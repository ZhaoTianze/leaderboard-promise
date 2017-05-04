Leaderboard
-----------

Leaderboard backed by [Redis](http://redis.io) in Node.js, basic on Promise. 

https://www.npmjs.com/package/leaderboard-promise

Installation
------------

    $ npm install leaderboard-promise

API
---

#Constructor

  var lb = new Leaderboard('name', [options], [redisOptions|redisClient])

Creates a new leaderboard or attaches to an existing leaderboard.

###Options

  - `pageSize` - default: `50`

    Page size to be used when paging through the leaderboard.

  - `reverse` - default: `false`

    If `true` various methods will return results in lowest-to-highest order.

##Methods

  - `add(member, score)`

    Ranks a member in the leaderboard.

        lb.add('member', 100).then(function(){
          // completed, do something
        }).catch(function(error){
          //failed
        });

  - `incr(member, score)`

    Increments the score of a member by provided score and ranks it in the leaderboard. Decrements if negative.

        lb.incr('member', 2).then(function(){
          // completed, do something
        }).catch(function(error){
          //failed
        });
    now the score to the member would be 102.

  - `highest(member,score)`

    Set a member`s highest score by provided score and ranks it in the leaderboard. If new score is less than old score in the leaderboard, it will keep the old scores.  

      lb.highest('member',103).then(function(){
        // completed, do something
      }).catch(function(error){
        //failed
      });
      now the score to the member would be 103.
  - `rank(member)`

    Retrieves the rank for a member in the leaderboard.

        lb.rank('member').then(function(rank){
          // rank - current position, -1 if a member doesn't
        }).catch(function(error){
          //failed
        });

  - `score(member)`

    Retrieves the score for a member in the leaderboard.

        lb.score('member').then(function(score){
           // score - current score, -1 if a member doesn't
        }).catch(function(error){
          //failed
        });

  - `list([page])`

    Retrieves a page of leaders from the leaderboard.

        lb.list().then(function(list) {
          // list - list of leaders are ordered from
          // the highest to the lowest score
          // [
          //   {member: 'member1', score: 30},
          //   {member: 'member2', score: 20},
          //   {member: 'member3', score: 10}
          // ]
        });

  - `at(rank)`

    Retrieves a member on the spicified ranks.

        lb.at(2).then(function(member) {
          // member - member at the specified rank i.e who has 2nd rank,
          // null if a member is not found
          // {
          //   member: 'member1',
          //   score: 30
          // }
        });

  - `rm(member)`

    Removes a member from the leaderboard.

        lb.rm('member').then(function(removed) {
          // removed - false in case the removing member 
          // doesn't exist in the leaderboard.
          // true - successful remove
        });

  - `total()`

    Retrieves the total number of members in the leaderboard.

        lb.total().then(function(number) {
          // captain obvious
        });

  - `numberInScoreRange(min,max)`

    Returns the number of members in the leaderboard with a score between min and max.

        lb.numberInScoreRange(10,100).then(function(number){
          // number - the number of members
        });

  - `membersInRankRange(beginRank,endRank)`

    Returns the list of members in the leaderboard between beginRank and endRank.

        lb.membersInRankRange(10,100).then(function(list){
          // list - the list of members
        });

## License 

[MIT](http://en.wikipedia.org/wiki/MIT_License#License_terms). Copyright (c) 2015 zhaotianze &lt;zen_zhao@qq.com&gt;

#### Author: [zhaotianze](https://github.com/ZhaoTianze/leaderboard-promise)
