Leaderboard
-----------

Leaderboard backed by [Redis](http://redis.io) in Node.js, basic on Promise. 

[![Build Status](https://www.npmjs.com/package/Leaderboard-Promise)](https://www.npmjs.com/package/Leaderboard-Promise)

Installation
------------

    $ npm install Leaderboard-Promise

API
---

#Constructor

  var lb = new Leaderboard('name', [options], [redisOptions|redisClient])

Creates a new leaderboard or attaches to an existing leaderboard.

###Options

  - `pageSize` - default: `0`

    Page size to be used when paging through the leaderboard.

  - `reverse` - default: `false`

    If `true` various methods will return results in lowest-to-highest order.

##Methods

  - `add(member, score, [λ])`

    Ranks a member in the leaderboard.

        lb.add('raheem', 100).then(function(){
          // completed, do something
        }).catch(function(error){
          //failed
        });

  - `incr(member, score, [λ])`

    Increments the score of a member by provided value and ranks it in the leaderboard. Decrements if negative.

        lb.incr('raheem', 2).then(function(){
          // completed, do something
        }).catch(function(error){
          //failed
        });
    now the score to the member raheem would be 102.

  - `rank(member, λ)`

    Retrieves the rank for a member in the leaderboard.

        lb.rank('raheem').then(function(rank){
          // rank - current position, -1 if a member doesn't
        }).catch(function(error){
          //failed
        });

  - `score(member, λ)`

    Retrieves the score for a member in the leaderboard.

        lb.score('raheem').then(function(score){
           // score - current score, -1 if a member doesn't
        }).catch(function(error){
          //failed
        });

  - `list([page], λ)`

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

  - `at(rank, λ)`

    Retrieves a member on the spicified ranks.

        lb.at(2).then(function(member) {
          // member - member at the specified rank i.e who has 2nd rank,
          // null if a member is not found
          // {
          //   member: 'member1',
          //   score: 30
          // }
        });

  - `rm(member, [λ])`

    Removes a member from the leaderboard.

        lb.rm('raheem').then(function(removed) {
          // removed - false in case the removing member 
          // doesn't exist in the leaderboard.
          // true - successful remove
        });

  - `total([λ])`

    Retrieves the total number of members in the leaderboard.

        lb.total().then(function(number) {
          // captain obvious
        });


## License 

[MIT](http://en.wikipedia.org/wiki/MIT_License#License_terms). Copyright (c) 2015 raheemmujavar &lt;raheemmujavar@gmail.com&gt;

#### Author: [zhaotianze](https://github.com/ZhaoTianze/leaderboard-promise)
