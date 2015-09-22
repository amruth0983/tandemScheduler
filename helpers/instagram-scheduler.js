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
    getInstagramFollowersCount: getInstagramFollowersCount,
    getInstagramLikesCommentsCount: getInstagramLikesCommentsCount
};

function getInstagramFollowersCount() {

    var deferred = Promise.defer(),
        creatorsArr,
        creatorInstagramUserIdlist,
        options,
        invalidReq,
        len,
        errMsg,
        checkUndefinedVal;

    commonFunctions.getCreatorsData()
        .then(function(creatorObj) {

            invalidReq = !creatorObj || creatorObj[0].body.error;

            if (invalidReq) {
                errMsg = creatorObj[0].body.error || 'Error while retrieving creators data';
                deferred.reject(errMsg);
            }

            creatorsArr = creatorObj[0].body;

            creatorInstagramUserIdlist =  _(creatorObj[1])
                                           .pluck('socialAuth').flatten()
                                           .filter(function(socialObj) { return socialObj.platformName === 'Instagram'; })
                                           .pluck('userId').value();

            checkUndefinedVal = _.reject(creatorInstagramUserIdlist, function(val){ return _.isUndefined(val) });

            if (creatorInstagramUserIdlist === undefined || creatorInstagramUserIdlist.length === 0) {
                errMsg = "No userId found in the database";
                deferred.reject(errMsg);
            }

            return retrieveCreatorInstaInfo(checkUndefinedVal);
        })
        .then(function(followerCountObj) {

            invalidReq = !followerCountObj || !_.isArray(followerCountObj) || followerCountObj.length === 0;

            if (invalidReq) {
                errMsg = 'Error while retrieving creators reach data';
                deferred.reject(errMsg);
            }

            return commonFunctions.updateCreatorSocialFollowerStats(followerCountObj);
        })
        .then(function(data) {

            if(!data) {
                errMsg = "Error while updating the data";
                deferred.reject(errMsg);
            }

            deferred.resolve(data);
        })
        .catch(function(error) {
            deferred.reject("couldn't get the instagram followers info");
        });

    return deferred.promise;
}

function retrieveCreatorInstaInfo(userIdlist) {

    var deferred = Promise.defer(),
        instagramQueryParams,
        options,
        clientId = process.env.INSTAGRAM_CLIENTID,
        UserObjArr = [],
        invalidReq,
        errMsg;

    if (!_.isArray(userIdlist) || userIdlist.length === 0) {
        deferred.reject("No user id received");
    }

    async.series(userIdlist.map(function(creatorUserId) {

        return function(cb) {

            options = {
                'headers': {
                    'Content-Type': 'application/json'
                },
                'method': 'GET',
                'url': process.env.INSTGRAM_USER_DETAILS_API_URL + creatorUserId + '?client_id='+ clientId,
                json: true
            }

            httpRequest.getAsync(options).then(function(userObj) {

                invalidReq = userObj[0].body.meta.error_message

                if(invalidReq) {
                    errMsg = userObj[0].body.meta.error_message || "Error while fetching video Id info";
                    deferred.reject(errMsg);
                } else {
                    UserObjArr.push({
                        "reach": userObj[0].body.data.counts.followed_by,
                        "userId": creatorUserId,
                        "platformName": "Instagram"
                    });
                }

                cb();
            })
            .catch(function(err) {
                deferred.reject(err)
                log.write(err);
            });
        }
    }), function(error) {
        deferred.resolve(UserObjArr);
    });

    return deferred.promise;
}

function getInstagramLikesCommentsCount() {

    var creatorInstagramUserIdlist,
        invalidReq,
        deferred = Promise.defer(),
        errMsg,
        checkUndefinedVal;

    commonFunctions.getCreatorsData()
        .then(function(creatorObj) {

            invalidReq = !creatorObj || creatorObj[0].body.error;

            if (invalidReq) {
                errMsg = creatorObj[0].body.error || 'Error while retrieving creators data';
                deferred.reject(errMsg);
            }

            creatorInstagramUserIdlist =  _(creatorObj[1])
                                        .pluck('socialAuth').flatten()
                                        .filter(function(socialObj) { return socialObj.platformName === 'Instagram'; })
                                        .pluck('userId').value();

            checkUndefinedVal = _.reject(creatorInstagramUserIdlist, function(val){ return _.isUndefined(val) });

            if (creatorInstagramUserIdlist === undefined || checkUndefinedVal.length === 0) {
                errMsg = "No userId found in the database";
                deferred.reject(errMsg);
            }

            return retrieveCreatorLikesAndComments(checkUndefinedVal);
        })
        .then(function(userMediaObj) {

            invalidReq = !userMediaObj;

            if (invalidReq) {
                errMsg = 'No Creator media data found';
                deferred.reject(errMsg);
            }

            return retrieveCreatorTotalEngagements(userMediaObj);
        })
        .then(function(creatorEngagementsData){

            invalidReq = !creatorEngagementsData || !_.isArray(creatorEngagementsData) || creatorEngagementsData.length === 0;

            if (invalidReq) {
                errMsg = 'Error while retrieving creators engagement data';
                deferred.reject(errMsg);
            }

            return commonFunctions.updateCreatorSocialEngagementStats(creatorEngagementsData);
        })
        .then(function(data) {

            if(!data) {
                errMsg = "Error while updating the data";
                deferred.reject(errMsg);
            }

            deferred.resolve(data);
        })
        .catch(function(error) {
            log.write(error);
            deferred.reject("couldn't get the instagram user info");
        });

    return deferred.promise;
}

function retrieveCreatorLikesAndComments(instagramUserIdArr) {

    var deferred = Promise.defer(),
        clientId = process.env.INSTAGRAM_CLIENTID,
        options,
        maxTimeStamp = Math.round(new Date().getTime() / 1000),
        minTimeStamp = Math.round(new Date().setMonth(new Date().getMonth() - 2) / 1000),
        count = 100,
        invalidReq,
        errMsg,
        userMediaReqParams,
        userMediaData = [],
        userMediaDataArr= [];

    if (!_.isArray(instagramUserIdArr) || instagramUserIdArr.length === 0) {
        deferred.reject("No user id received");
    }

    async.series(instagramUserIdArr.map(function(creatorUserId) {

        return function(cb) {

            userMediaReqParams = {
                client_id: clientId,
                min_timestamp: minTimeStamp,
                count: count
            };
            options = {
                'headers': {
                    'Content-Type': 'application/json'
                },
                'method': 'GET',
                'url': process.env.INSTGRAM_USER_DETAILS_API_URL + creatorUserId + '/media/recent/?'+ qs.stringify(userMediaReqParams),
                json: true
            };

            httpRequest.getAsync(options).then(function(mediaObj) {

                invalidReq = mediaObj[0].body.meta.error_message;

                if(invalidReq) {
                    errMsg = mediaObj[0].body.meta.error_message || "Error while fetching user media info";
                    deferred.reject(errMsg);
                }

                _.each(mediaObj[0].body.data, function(dataObj) {
                    userMediaDataArr.push(dataObj);
                });

                userMediaData.push({
                    instagramUserMediaList: userMediaDataArr,
                    instagramUserId: creatorUserId
                });

                if(mediaObj[0].body.pagination.next_url) {
                    getPaginationData(mediaObj[0].body.pagination.next_url, userMediaDataArr, function(userMediaDataArr) {
                        cb();  
                    });
                } else {
                    cb();
                }
            });
        }
    }), function(error) {
        deferred.resolve(userMediaData);
    });

    return deferred.promise;
}

function getPaginationData(url, userData, cb) {

    var options,
        deferred = Promise.defer();

    if(url !== undefined) {

        options = {
            'headers': {
                'Content-Type': 'application/json'
            },
            'method': 'GET',
            'url': url,
            'json': true
        };

        httpRequest.getAsync(options).then(function(mediaDataObj) {

            _.each(mediaDataObj[0].body.data, function(dataObj) {
                userData.push(dataObj);
            });
            
            if(mediaDataObj[0].body.pagination) {
                url = mediaDataObj[0].body.pagination.next_url;
                return getPaginationData(url, userData, cb);
            }
            cb(userData);
        });
    } else {
        cb(userData);
    }

    deferred.resolve(userData);
    return deferred.promise;
}

function retrieveCreatorTotalEngagements(userMediaData){

    var deferred = Promise.defer(),
        userData,
        len = userMediaData.length,
        likes,
        comments,
        userDataLength,
        engagements,
        userInstagramData = [];

    if(userMediaData === undefined || userMediaData === null || userMediaData.length === 0) {
        deferred.reject("No instagram data fetched");
    }

    while(len--) {
       userData = userMediaData[len].instagramUserMediaList,
       likes = 0,
       comments = 0,
       engagements = 0,
       userDataLength = userData.length;

       if(userDataLength > 0){

            while(userDataLength--) {
                likes += userData[userDataLength].likes.count;
                comments += userData[userDataLength].comments.count;
            }

            if(!Number(likes) || !Number(comments)) {
                deferred.reject("error while calculting instagram likes and comments");
            }

            engagements = Number(likes) + Number(comments);

            userInstagramData.push({
                "engagements": engagements,
                "creatorSocialId": userMediaData[len].instagramUserId,
                "platformName": "Instagram"
           });
       }
       
    }

    deferred.resolve(userInstagramData);
    return deferred.promise;
}
