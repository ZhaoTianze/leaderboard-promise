var assert = require('assert');
var async = require('async');
var redis = require('redis');
var  LB = require('../');

// Constants
var DBINDEX = 10;
var PAGESIZE = 5;

before(function(done){
    // Initialize a subject leaderboard before all suites
    this.board = new LB('general', {pageSize: PAGESIZE},{db: DBINDEX});

    // Creating connection to the redis and 
    // changing the current selected database
    this.client = redis.createClient();
    this.client.select(DBINDEX, done);
});

describe('Leaderboard',function(){
    describe('constructor',function(){
        // Empty database before the suite
        before(function(done) {
        this.client.flushdb(done);
        });

        it('should have possibility to take RedisClient instance',function(done){
            var client = redis.createClient();
            client.select(DBINDEX + 1);
            client.flushdb(function() {

                var board1 = new LB('__redis__', null, client);
                var board2 = new LB('__redis__', null, client);
                var board3 = new LB('__redis__', null, {db: DBINDEX});

                async.parallel([
                    function(cb) {board1.add('member1',10).then(function(){cb()}).catch(function(error){cb(error)});},
                    function(cb) {board2.add('member2',20).then(function(){cb()}).catch(function(error){cb(error)});}
                ],function() {
                    board1.list().then(function(list){
                        assert.deepEqual(list,[
                            {'member': 'member2', 'score': 20},
                            {'member': 'member1', 'score': 10}
                        ]);

                        return board3.list();
                    }).then(function(list){
                        assert.deepEqual(list,[]);
                        done();
                    });
                });
            });
        });
    });

    describe('"add" method',function(){
        // Empty database before the suite
        before(function(done) {
            this.client.flushdb(done);
        });
        var testFunc = function(member,score,equalRank,board){
            return board.add(member, score).then(function(){
                return board.rank(member);
            }).then(function(rank){
                assert.equal(rank,equalRank);
            }).catch(function(error){
                console.error(error);
            });
        }

        it('should put "member1" with score 30 to the 0 position', function(done) {
            testFunc('member1',30,0,this.board).then(function(){
                done();
            });
        });

        it('should put "member2" with score 20 to the 1 position', function(done) {
            testFunc('member2',20,1,this.board).then(function(){
                done();
            });
        });

        it('should put "member3" with score 10 to the 2 position', function(done) {
            testFunc('member3',10,2,this.board).then(function(){
                done();
            });
        });

        it('should put "member3" with score 40 to the 0 position', function(done) {
            testFunc('member3',40,0,this.board).then(function(){
                done();
            });
        });
    });

    describe('"incr" method', function(){
        // Empty database before the suite
        before(function(done) {
            this.client.flushdb(done);
        });

        it('should add members if they don\'t exist', function(done){
            var board = this.board;
            board.incr('member1',10).then(function(){
                return board.incr('member2',20);
            }).then(function(){
                return board.list();
            }).then(function(list){
                assert.deepEqual(list, [
                    {'member': 'member2', 'score': 20},
                    {'member': 'member1', 'score': 10}
                ]);
                done();
            });
        });

        it('should increment members\' score if they do exist', function(done) {
            var board = this.board;
            board.incr('member1',100).then(function(){
                return board.score('member1');
            }).then(function(score){
                assert.equal(score,110);
                done();
            });
        });

        it('should decrement members\' score if score value is negative', function(done) {
            var board = this.board;
            board.incr('member1',-20).then(function(){
                return board.score('member1');
            }).then(function(score){
                assert.equal(score,  90);
                done();
            });
        });

        it('should keep correct members order', function(done) {
            this.board.list().then(function(list){
                assert.deepEqual(list, [
                    {'member': 'member1', 'score': 90},
                    {'member': 'member2', 'score': 20}
                ]);
                done();
            }).catch(function(error){
                console.error(error);
                done();
            });
        });


    });

    describe('"highest" method',function(){
        // Empty database before the suite
        before(function(done) {
            this.client.flushdb(done);
        });

        it('should put "member1" with score 20 to the leaderboard',function(done){
            var board = this.board;
            board.highest('member1',20).then(function(){
                return board.rank('member1');
            }).then(function(rank){
                assert.equal(rank,0);
                done();
            });
        });

        it('set score 10 to "member1" should not change the highest score',function(done){
            var board = this.board;
            board.highest('member1',10).then(function(){
                return board.score('member1');
            }).then(function(score){
                assert.equal(score,20);
                done();
            });
        });

        it('set score 30 to "member1" should change the highest score',function(done){
            var board = this.board;
            board.highest('member1',30).then(function(){
                return board.score('member1');
            }).then(function(score){
                assert.equal(score,30);
                done();
            });
        });
    });
});

describe('"at" method',function(){
     // Empty database before the suite
    before(function(done) {
      this.client.flushdb(done);
    });

    it('should return correct member #1', function(done) {
        var board = this.board;

        async.parallel([
            function(cb) { board.add('member1', 10).then(function(){cb()}); },
            function(cb) { board.add('member2', 20).then(function(){cb()}); },
            function(cb) { board.add('member3', 30).then(function(){cb()}); },
            function(cb) { board.add('member4', 40).then(function(){cb()}); },
            function(cb) { board.add('member5', 50).then(function(){cb()}); }
        ],function(){
            board.at(2).then(function(member){
                assert.deepEqual(member,{'member': 'member3', 'score': 30});
                done();
            });
        });
    });

    it('should return correct member #2',function(done){
        var board = this.board;

        board.at(-2).then(function(member){
            assert.deepEqual(member, {'member': 'member2', 'score': 20});
            done();
        });
    });

    it('returned score should be typeof number', function(done) {
        var board = this.board;

        board.at(1).then(function(member){
            assert.equal(typeof(member.score), 'number');
            done();
        })
    });

    it('should return null if member is not found', function(done) {
      var board = this.board;

      board.at(100).then(function(member) {
        assert.deepEqual(member, null);
        done();
      });
    });
});


describe('"total" && "rm" method', function() {
    // Empty database before the suite
    before(function(done) {
      this.client.flushdb(done);
    });

    it('should return correct number of members', function(done) {
        var board = this.board;

        async.parallel([
            function(cb) { board.add('member1', 10).then(function(){cb()}); },
            function(cb) { board.add('member2', 20).then(function(){cb()}); },
            function(cb) { board.add('member3', 30).then(function(){cb()}); }
        ], function() {
            board.total().then(function(total) {
                assert.equal(total, 3);
                done();
            });
        });
    });

    it('should rm "member3" in the leaderboard',function(done){
        var board = this.board;
        board.rm('member3').then(function(removed){
            assert.equal(removed,1);
            return board.total();
        }).then(function(total){
            assert.equal(total,2);
            done();
        });
    });
});

describe('"numberInScoreRange" && "membersInScoreRange" method',function(){
    // Empty database before the suite
    before(function(done) {
      this.client.flushdb(done);
    });

    it('should return the number of members in the leaderboard',function(done){
        var board = this.board;
        async.parallel([
          function(cb) { board.add('member1', 10).then(function(){cb()}); },
          function(cb) { board.add('member2', 20).then(function(){cb()}); },
          function(cb) { board.add('member3', 30).then(function(){cb()}); },
          function(cb) { board.add('member4', 40).then(function(){cb()}); }
        ],function(){
            board.numberInScoreRange(10,40).then(function(num){
                assert.equal(num,4);
                //exclusive
                return board.numberInScoreRange("("+10,"("+40);
            }).then(function(num){
                assert.equal(num,2);
                done();
            });
        });
    });
});

describe('Options', function() {
    // Empty database before the suite
    before(function(done) {
      this.client.flushdb(done);
    });

    describe('"pageSize"', function() {
      it('should set specified number of entries for a page', function(done) {
        var board = new LB('general', {pageSize: 3}, {db: DBINDEX});

        async.parallel([
          function(cb) { board.add('member1', 10).then(function(){cb()}); },
          function(cb) { board.add('member2', 20).then(function(){cb()}); },
          function(cb) { board.add('member3', 30).then(function(){cb()}); },
          function(cb) { board.add('member4', 40).then(function(){cb()}); }
        ], function() {
          board.list().then(function(list) {
            assert.equal(list.length, 3);
            done();
          });
        });
      });
    });

    describe('"reverse"', function() {
        it('should make "list" method return results in reverse order', function(done){
            var board = new LB('general', {reverse: true}, {db: DBINDEX});
            board.list().then(function(list) {
                assert.deepEqual(list, [
                    {'member': 'member1', 'score': 10},
                    {'member': 'member2', 'score': 20},
                    {'member': 'member3', 'score': 30},
                    {'member': 'member4', 'score': 40}
                ]);
                done();
            });
        });

        it('should make "rank" method return results in reverse order', function(done) {
            var board = new LB('general', {reverse: true}, {db: DBINDEX});
            board.rank('member2').then(function(rank) {
                assert.equal(rank, 1);
                done();
            });
        });

        it('should make "at" method return results in reverse order', function(done) {
            var board = new LB('general', {reverse: true}, {db: DBINDEX});
            board.at(1).then(function(member) {
                assert.deepEqual(member, {'member': 'member2', 'score': 20});
                done();
            });
        });

    });
});