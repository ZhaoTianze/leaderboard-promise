var redis = require('redis');
var Promise = require('bluebird');

// use bluebird for node-redis add Promise API
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

/**
 * @param {String} name
 * @param {Object} options
 * @param {Object} redisOptions
 */
function Leaderboard(name,options,redisOptions) {
    options || (options = {});

    this.name = name;
    this.pageSize = options.pageSize || 50;
    this.reverse = options.reverse || false;

    this.connect(redisOptions);
}

var proto = Leaderboard.prototype;

/**
 * Initialize redis connection
 *
 * @param {Object} options
 * @api private
 */
proto.connect = function(options){
    options || (options = {});

    if (options.connection_id !== undefined &&
        options.connected !== undefined &&
        options.ready !== undefined) {
        return this.redis = options;
    }

    this.redis = redis.createClient(options);
    this.redis.on('error',function(error){
        return console.error('leaderboard: ' + this.name + ' redis error: ' + err);
    });
};

/**
 * Ranks a member in the leaderboard.
 *
 * @param {String} member
 * @param {Number} score
 * @param {Function} cb
 * @api public
 */
proto.add = function(member, score){
    return this.redis.zaddAsync(this.name,score,member);
};

/**
 * Increments the score of a member by provided value and
 * ranks it in the leaderboard. Decrements if the
 * provided value is negative.
 *
 * @param {String} member
 * @param {Number} score
 * @param {Function} cb
 * @api public
 */
proto.incr = function(member,incrScore) {
    return this.redis.zincrbyAsync(this.name,incrScore,member);
};

/**
 * Set a member`s highest score
 */
proto.highest = function(member,score) {
    var script = 'local highest = tonumber(redis.call("ZSCORE", KEYS[1], ARGV[2]))\n' +
               'if highest == nil or tonumber(ARGV[1]) > highest then redis.call("ZADD", KEYS[1], ARGV[1], ARGV[2]) end';
    
    return this.redis.evalAsync(script, 1, this.name, score, member);
};

/**
 * Retrieves the rank for a member in the leaderboard.
 *
 * @param {String} member
 * @param {Function} cb
 * @api public
 */
proto.rank = function(member){
    var newPromise;
    if (this.reverse) {
        newPromise = this.redis.zrankAsync(this.name,member);
    }else{
        newPromise = this.redis.zrevrankAsync(this.name,member);
    }
    return newPromise.then(function(rank){
        if (rank === null){
            return -1;
        }
        return +rank;
    })
};

/**
 * Retrieves the score for a member in the leaderboard.
 *
 * @param {String} member
 * @param {Function} cb
 * @api public
 */
proto.score = function(member){
    return this.redis.zscoreAsync(this.name,member).then(function(score){
        if (score === null){
            return -1;
        }else{
            return +score;
        }
    });
};

/**
 * Removes a member from the leaderboard.
 *
 * @param {String} member
 * @param {Function} cb
 * @api public
 */
proto.rm = function(member){
    return this.redis.zremAsync(this.name,member);
};

/**
 * Retrieves a page of members from the leaderboard.
 *
 * @param {Number} page
 * @param {Function} cb
 * @api public
 */
proto.list = function(page){
    if (typeof(page) === 'undefined' || page instanceof Function) {
        page = 0;
    }
    var newPromise;
    if (this.reverse) {
        newPromise = this.redis.zrangeAsync(this.name, page * this.pageSize, page * this.pageSize + this.pageSize - 1, 'WITHSCORES');
    }else{
        newPromise = this.redis.zrevrangeAsync(this.name, page * this.pageSize, page * this.pageSize + this.pageSize - 1, 'WITHSCORES');
    }
    return newPromise.then(function(range){
        var list = [], l = range.length;

        for (var i = 0; i < l; i += 2) {
            list.push({
                'member': range[i]
            , 'score': range[i+1]
            });
        }
        return list;
    });
};

/**
 * Retrieves a member on the spicified rank.
 *
 * @param {Number} rank
 * @param {Function} cb
 * @api public
 */
proto.at = function(rank){
    var newPromise;
    if (this.reverse) {
        newPromise = this.redis.zrangeAsync(this.name, rank, rank, 'WITHSCORES');
    } else {
        newPromise = this.redis.zrevrangeAsync(this.name, rank, rank, 'WITHSCORES');
    }
    return newPromise.then(function(range){
        if (!range.length)
            return null;
        
        return {member:range[0],score:+range[1]};
    });
};

/**
 * Retrieves the total number of members in the leaderboard.
 *
 * @param {Function} cb
 * @api public
 */
proto.total = function(){
    return this.redis.zcardAsync(this.name);
};

/**
 * Returns the number of elements in the sorted set at key with a score between min and max.
 */
proto.numberInScoreRange = function(min,max){
    return this.redis.zcountAsync(this.name,min,max);
};

/**
 * Returns all the elements in the sorted set at key with a score between min and max.
 */
proto.membersInScoreRange = function(min,max){
    if (this.reverse){
        return this.redis.zrangebyscoreAsync(this.name,min,max);
    }else{
        return this.redis.zrevrangebyscoreAsync(this.name,min,max);
    }
};

module.exports = Leaderboard;