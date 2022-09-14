const express = require('express');
const router = express.Router();
const neo4j = require('neo4j-driver').v1;
const fs = require('fs');
const Twitter = require('twitter');

const session = setupDatabase();
const twitter = setupTwitter();


/**
 *  Add a users past 5 tweets to the database and link them to all users
 *  mentioned in the tweets
 */
router.get('/', async function (req, res, next) {
  const username = req.query.username;
  const depth = req.query.depth || 2;
  const d = new Date();
  const timeStamp = d.getTime() / 1000;

  const params = {
    screen_name: username,
    count: 5
  };

  checkCache(username, depth + 1).then((results) => {

    // console.log(results);
    if (results !== true) {
      console.log('retrieve from cache');
      res.status(200).send(results);
    } else if (results === true) {

      console.log('Twitter user not in cache');
      retrieveTweets(params, depth).then((tweets) => {
        let queryString = "";

        let users = {};
        users[username] = {};

        for (let i = 0; i < tweets.length; i++) {
          let tweet = tweets[i];
          let mentions = tweet.entities.user_mentions;
          let name = tweet.user.screen_name;

          if (users[name] === undefined) {
            users[name] = {}
          }

          for (let i in mentions) {
            let mentionedUser = mentions[i].screen_name;
            if (!users[name].hasOwnProperty(mentionedUser)) {
              users[name][mentionedUser] = 1;
            } else {
              users[name][mentionedUser]++;
            }

            if (users[mentionedUser] === undefined) {
              users[mentionedUser] = {}
            }
          }
        }

        // Create user nodes
        for (let username in users) {
          queryString += `MERGE (\`${username}\`:TwitterUser {
            username:'${username}',
            date: ${timeStamp}
          })\n`;
        }

        for (let username in users) {
          let mentions = users[username];

          // Attach mentions
          for (let mention in mentions) {
            queryString += `MERGE \`${username + "_" + mention}\` =(\`${username}\`)-[:MENTIONED
                            {num_mentions:${mentions[mention]}}]->(\`${mention}\`)\n`;
          }
        }
        queryString += 'RETURN *';
        runQuery(queryString).then((results) => {
          // checkCache(username, depth + 1).then((results) => {
          //   res.status(200).send(results);
          // });
          res.status(200).send(results);
        }).catch((error) => {
          console.log(error);
          res.status(500).send();
        });

      }).catch((error) => {
        console.log(error);
        res.status(500).send();
      });

    }
  });

  /**
   * Check the database for recent usernames
   * @param username
   * @param depth
   * @param date
   * @returns {Promise<any>}
   */
  function checkCache(username, depth) {

    // Retrieve from cache if parent node is less than 24 hours old
    const query = `MATCH (z:TwitterUser {username: '${username}'})-[x*1..${depth + 1}]-(y:TwitterUser)
                     WHERE (${timeStamp} - y.date >= 86400)
                   DETACH DELETE z, y
                   WITH count(*) as dummy
                   MATCH (a:TwitterUser {username: '${username}'})-[r*1..${depth + 1}]-(b:TwitterUser)
                     WHERE (${timeStamp} - a.date < 86400)
                   RETURN a ,r ,b`;

    return new Promise((resolve, reject) => {
      session.run(query).then(result => {

        if (result.records.length > 0) {
          console.log(`fetch ${username} from cache`);
          resolve(parseCacheResults(result));
        } else {
          console.log(`search twitter for ${username}`);
          resolve(true);
        }
      }).catch((error) => {
        console.log(error);
        res.status(500).send();
      });
    });
  }

  /**
   * Run a query and resolve a formatted response
   * @param query
   * @returns {Promise<any>}
   */
  function runQuery(query) {
    return new Promise((resolve, reject) => {
      session.run(query).then(result => {
        session.close();
        resolve(parseResults(result.records[0]));

      }).catch((error) => {
        console.log(error);
        res.status(500).send();
      });
    })
  }

  /**
   * Recursively find all mentions related to one twitter user
   * @param params
   * @param depth
   * @returns {Promise<any>}
   */
  function retrieveTweets(params, depth) {
    let promise = new Promise((resolve, reject) => {
      twitter.get('statuses/user_timeline', params, (error, tweets, response) => {

        let promises = [];

        for (let i = 0; i < tweets.length; i++) {
          // Attach mentions
          for (let j = 0; j < tweets[i].entities.user_mentions.length; j++) {
            const mentionedUser = tweets[i].entities.user_mentions[j].screen_name;
            const mentionedParams = {
              screen_name: mentionedUser,
              count: 5
            };

            let promise = new Promise((resolve, reject) => {

              if (depth <= 1) {
                twitter.get('statuses/user_timeline', mentionedParams, (error, subTweets, response) => {
                  subTweets.push(...tweets);
                  resolve(subTweets);
                });
              } else {
                depth -= 1;
                retrieveTweets(mentionedParams, depth).then((subTweets) => {
                  resolve(subTweets);
                });
              }
            });

            promises.push(promise);
          }
        }

        resolve(promises);
      });
    });

    return new Promise((resolve, reject) => {
      promise.then((promises) => {
        Promise.all(promises).then((tweets) => {
          resolve([].concat.apply([], tweets));
        });
      });
    });
  }
});


/**
 * Takes a database response object and transforms to a plottable format
 * @param resultsData
 */
function parseCacheResults(resultsData) {
  let nodesList = [];
  let linksList = [];
  for (let i = 0; i < resultsData.records.length; i++) {
    for (let j = 0; j < resultsData.records[i]._fields.length; j++) {
      if (resultsData.records[i]._fields[j].constructor.name === 'Node') {

        let node = {
          id: resultsData.records[i]._fields[j].identity.toNumber(),
          username: resultsData.records[i]._fields[j].properties.username
        };

        if (!nodesList.filter(e => e.id === node.id).length > 0) {
          nodesList.push(node);
        }
      } else if (resultsData.records[i]._fields[j].constructor.name === 'Array') {
        for (let k = 0; k < resultsData.records[i]._fields[j].length; k++) {
          let arr = resultsData.records[i]._fields[j];

          let link = {
            source: arr[k].start.toNumber(),
            target: arr[k].end.toNumber(),
            // tweetId: resultsData._fields[i].segments[0].relationship.properties.TweetId.toString(),
            // type: resultsData._fields[i].segments[0].relationship.type,
            // retweets: resultsData._fields[i].segments[0].relationship.properties.Retweets.toNumber(),
            // favourites: resultsData._fields[i].segments[0].relationship.properties.Favourites.toNumber(),
            length: 1
          };

          linksList.push(link);
        }

      }

    }
  }

  return {nodes: nodesList, links: linksList};
}

/**
 * Takes a database response object and transforms to a plottable format
 * @param resultsData
 * @returns {*}
 */
function parseResults(resultsData) {
  let nodesList = [];
  let linksList = [];
  for (let i = 0; i < resultsData._fields.length; i++) {
    if (resultsData._fields[i].constructor.name === 'Node') {
      nodesList.push({
          id: resultsData._fields[i].identity.toNumber(),
          username: resultsData._fields[i].properties.username
        }
      );
    }
    if (resultsData._fields[i].constructor.name === 'Path') {
      linksList.push({
        source: resultsData._fields[i].start.identity.toNumber(),
        target: resultsData._fields[i].end.identity.toNumber(),
        // tweetId: resultsData._fields[i].segments[0].relationship.properties.TweetId.toString(),
        // type: resultsData._fields[i].segments[0].relationship.type,
        // retweets: resultsData._fields[i].segments[0].relationship.properties.Retweets.toNumber(),
        // favourites: resultsData._fields[i].segments[0].relationship.properties.Favourites.toNumber(),
        length: 1
      });
    }
  }
  return {nodes: nodesList, links: linksList};
}

/**
 * Setup neo4j database driver and session
 * @returns {Session}
 */
function setupDatabase() {
  const databaseJSON = JSON.parse(fs.readFileSync('config/database_config.json', 'utf8'));
  const databaseUri = databaseJSON.uri;
  const user = databaseJSON.username;
  const password = databaseJSON.password;

  // Neo4j driver
  const driv = neo4j.driver(databaseUri, neo4j.auth.basic(user, password));
  return driv.session();
}

/**
 * Get twitter configuration
 * @returns {json object}
 */
function setupTwitter() {
  const auth = JSON.parse(fs.readFileSync('config/twitter_config.json', 'utf8'));
  return new Twitter(auth);
}

module.exports = router;
