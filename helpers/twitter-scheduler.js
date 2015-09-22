"use strict";

var Promise = require("bluebird"),
    httpRequest = Promise.promisifyAll(require('request')),
    https = require('https'),
    qs = require('querystring'),
    async = require("async"),
    commonFunctions = require("../helpers/commonFunctions"),
    log = require("../utility/log"),
    _ = require("lodash");

module.exports = {
    getTwitterUserInfo: getTwitterUserInfo,
    getCreatorTwitterUserTimeLine: getCreatorTwitterUserTimeLine
};

function getTwitterUserInfo() {

    var consumerKey = process.env.TWITTER_CONSUMER_KEY,
        consumerSecret = process.env.TWITTER_SECRET_KEY,
        credentials = new Buffer(encodeURI(consumerKey) + ':' + encodeURI(consumerSecret)).toString('base64'),
        options = {
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + credentials,
                'Content-Length': 29
            },
            'method': 'POST',
            'form': {
                grant_type: 'client_credentials'
            },
            json: true
        },
        url = process.env.TWITTER_TOKEN_URL,
        invalidReq, errMsg, response,
        deferred = Promise.defer();

    httpRequest.postAsync(url, options)
        .then(function(tokenDetails) {

            invalidReq = !tokenDetails || !tokenDetails.length || !tokenDetails[1] || !tokenDetails[1].access_token;

            if (invalidReq) {
                errMsg = (tokenDetails && tokenDetails.length) || "Couldn't get the access token";
                deferred.reject("Couldn't fetch the access token" + errMsg);
            }

            response = tokenDetails[1];
            return fetchCreatorUserId(response);
        })
        .then(function(creatorsTwitterData) {

            invalidReq = !creatorsTwitterData || !creatorsTwitterData.length || !creatorsTwitterData[0];

            if (invalidReq) {
                errMsg = (creatorsTwitterData && creatorsTwitterData.length) || "Couldn't get the twitter data";
                deferred.reject("Couldn't get the twitter data" + errMsg);
            }

            return fetchCreatorTwitterData(creatorsTwitterData[0].twitterData, creatorsTwitterData[0].creators);
        })
        .then(function(updateCreatorDetails) {

            invalidReq = !updateCreatorDetails || !updateCreatorDetails.length;

            if (invalidReq) {
                errMsg = (updateCreatorDetails && updateCreatorDetails.length) || "Couldn't get the Creators details";
                deferred.reject(errMsg);
            }

            return commonFunctions.updateCreatorSocialFollowerStats(updateCreatorDetails);
        })
        .then(function(data) {

            if(!data) {
                deferred.reject("Error while updating the data");
            }
            deferred.resolve(data);
        })
        .catch(function(error) {
            log.write(error);
            deferred.reject("couldn't get the twitter user info");
        });

    return deferred.promise;
}

function fetchCreatorUserId(result) {

    var accessToken = result.access_token,
        userId,
        creatorsArr, 
        twitterQueryParams, 
        options, 
        invalidReq, 
        errMsg, 
        response,
        deferred = Promise.defer(),
        creatorsDetails = [];

    commonFunctions.getCreatorsData()
        .then(function(data) {

            if (!_.isArray(data)) {
                deferred.reject("couldn't get the creators data");
            }

            creatorsArr = data[0].body;

            //pluck the screen Names from the creators data
            userId = _(creatorsArr)
                    .pluck('socialAuth').flatten()
                    .filter(function(creatorObj) { return creatorObj.platformName === 'Twitter'; })
                    .pluck('userId').value().join(', ');

            if (!userId) {
                deferred.reject("No userId found in the database");
            }

            twitterQueryParams = {
                user_id: userId
            };

            options = {
                'headers': {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + accessToken
                },
                'method': 'POST',
                'url': process.env.TWITTER_USERS_INFO + '?' + qs.stringify(twitterQueryParams),
                'json': true
            }

            return httpRequest.postAsync(options);
        })
        .then(function(twitterUserData) {

            invalidReq = !twitterUserData || !twitterUserData.length;

            if (invalidReq) {
                errMsg = "Couldn't fetch the twitter data using the user id";
                deferred.reject(errMsg);
            }

            response = twitterUserData[1];
            creatorsDetails.push({
                "creators": creatorsArr,
                "twitterData": response
            });
            deferred.resolve(creatorsDetails);
        })
        .catch(function(err) {
            deferred.reject(err);
        });
        
    return deferred.promise;
}

function fetchCreatorTwitterData(result, creators) {

    var userIdArr = [],
        userId, 
        userIdPresent, 
        userData = [],
        deferred = Promise.defer();

    async.series(result.map(function(resultObj) {
        return function(cb) {

            if (!resultObj) {
                log.write("error while looping twitter data");
                deferred.reject("error while looping twitter data");
            }

            userIdArr = _(creators)
                        .pluck('socialAuth').flatten()
                        .filter(function(creatorObj) { return creatorObj.platformName === 'Twitter'; })
                        .pluck('userId')
                        .value();

            // check to see if the fetched result userId present in the db or not
            userIdPresent = _.includes(userIdArr, resultObj.id_str);

            if (userIdPresent) {
                userData.push({
                    "platformName": "Twitter",
                    "userId": resultObj.id_str,
                    "reach": resultObj.followers_count
                });
                cb();
            } else {
                cb();
            }
        }
    }), function(error) {
        deferred.resolve(userData);
    });

    return deferred.promise;
}

function getTwitterUserAccessToken() {

    return new Promise(function(resolve, reject) {

        var consumerKey = process.env.TWITTER_CONSUMER_KEY,
            consumerSecret = process.env.TWITTER_SECRET_KEY,
            credentials = new Buffer(encodeURI(consumerKey) + ':' + encodeURI(consumerSecret)).toString('base64'),
            options = {
                'headers': {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + credentials,
                    'Content-Length': 29
                },
                'method': 'POST',
                'form': {
                    grant_type: 'client_credentials'
                },
                json: true
            },
            url = process.env.TWITTER_TOKEN_URL,
            invalidReq, errMsg, response;

        httpRequest.postAsync(url, options).then(function(data) {

            if(!data || data[1].errors) {
                reject("Error while getting the access token ");
            }

            return resolve(data);
        })
    });
}

function getCreatorTwitterUserTimeLine() {

    var invalidReq,
        errMsg, 
        response,
        deferred = Promise.defer();

    getTwitterUserAccessToken()
        .then(function(twitterUserData) {

            invalidReq = !twitterUserData || !twitterUserData.length;

            if (invalidReq) {
                errMsg = "Couldn't fetch the twitter access token";
                deferred.reject(errMsg);
            }

            response = twitterUserData[1];
            return loopCreatorsData(response);
        })
        .then(function(timelineData) {

            invalidReq = !timelineData || !timelineData.length;

            if (invalidReq) {
                errMsg = "Couldn't fetch the twitter line data";
                deferred.reject(errMsg);
            }

            return loopUserTimelineData(timelineData);
        })
        .then(function(tweetData){

            invalidReq = !tweetData || !tweetData.length;

            if (invalidReq) {
                errMsg = "Couldn't fetch the twitter tweet data";
                deferred.reject(errMsg);
            }

            return commonFunctions.updateCreatorSocialEngagementStats(tweetData);
        })
        .then(function(data){

            if(!data) {
                deferred.reject("Error while updating the data");
            }

            deferred.resolve(data);
        })
        .catch(function(error) {
            log.write(error);
            deferred.reject("couldn't get the twitter user time line info");
        });

    return deferred.promise;
}

function loopCreatorsData(response) {

    var accessToken = response.access_token,
        twitterQueryParams, 
        options, 
        invalidReq, 
        errMsg, 
        response, 
        creatorsArr,
        deferred = Promise.defer(),
        userTimelineData = [],
        userTwitterId;

    commonFunctions.getCreatorsData()
        .then(function(data) {

            if (!_.isArray(data)) {
                deferred.reject("couldn't get the creators data while fetching retweet data");
            }

            creatorsArr = data[0].body;
            async.series(creatorsArr.map(function(creatorObj) {
                
                return function(cb) {

                    if (creatorObj.socialAuth.length > 0) {

                        userTwitterId = _(creatorObj.socialAuth)
                                        .filter(function(socialObj) { return socialObj.platformName === 'Twitter'; })
                                        .pluck('userId').value().join();

                        twitterQueryParams = {
                            user_id: userTwitterId,
                            since_id: commonFunctions.getPreviousMonthTimeStamp()
                        };

                        options = {
                            'headers': {
                                'Accept': 'application/json',
                                'Authorization': 'Bearer ' + accessToken
                            },
                            'method': 'GET',
                            'url': process.env.TWITTER_USERS_TIMELINE + '?' + qs.stringify(twitterQueryParams),
                            'json': true
                        };

                        httpRequest.getAsync(options)
                            .then(function(timelineData) {

                                invalidReq = !timelineData || !timelineData.length;
                                if (invalidReq) {
                                    errMsg = "Couldn't fetch the user timeline data";
                                    deferred.reject(errMsg);
                                }
                                userTimelineData.push({
                                    "data": timelineData[1],
                                    "userId": userTwitterId
                                });
                                cb();
                            })
                            .catch(function(err) {
                                deferred.reject(err)
                            });
                    } else {
                        cb();
                    }
                }
            }), function(error) {
                deferred.resolve(userTimelineData);
            });
        })
        .catch(function(err) {
            deferred.reject("couldn't get the creators data");
        });

    return deferred.promise;
}

function loopUserTimelineData(response) {

    var userData, 
        userTwitterId, 
        userTwitterData = [], 
        retweetCount=0, 
        favoriteCount=0,
        engagementValue,
        deferred = Promise.defer(),
        len = response.length,
        dataLength;

    if(len === undefined || len === null || len === 0) {
        deferred.reject("No time line data fetched");
    }

    while(len--) {

        userData = response[len].data;
        userTwitterId = response[len].userId;
        retweetCount=0, favoriteCount=0;
        engagementValue;
        dataLength = userData.length;

        if(userData.length > 0) {

            while( dataLength-- ) {

                if((userData[dataLength].user.id_str === userTwitterId) 
                    && (((userData[dataLength].retweet_count === 0) && (userData[dataLength].favorite_count > 0)) 
                    || ((userData[dataLength].retweet_count > 0) && (userData[dataLength].favorite_count === 0)) 
                    || ((userData[dataLength].retweet_count > 0) && (userData[dataLength].favorite_count > 0)))) {

                    retweetCount += userData[dataLength].retweet_count;
                    favoriteCount += userData[dataLength].favorite_count;
                } 
            }

            if(!Number(retweetCount) || !Number(favoriteCount)) {
                deferred.reject("error while calculting tweet values");
            }

            engagementValue = Number(retweetCount) + Number(favoriteCount);

            userTwitterData.push({
                "engagements": engagementValue,
                "creatorSocialId": userTwitterId,
                "platformName": "Twitter"
            });
        }
    }

    deferred.resolve(userTwitterData);
    return deferred.promise;
}