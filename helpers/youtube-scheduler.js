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
    getYoutubeVideoStats: getYoutubeVideoStats
};

function updateYoutubeStats(videoStats) {

    var deferred = Promise.defer(),
        responseData,
        invalidReq,
        errMsg;

    if(!videoStats || !_.isArray(videoStats) || videoStats.length === 0) {
        deferred.reject("No video stats received");
    }

    async.series(videoStats.map(function(videoObj) {

        return function(cb) {

            if(!videoObj) {
                deferred.reject("Error in fetching the video stats");
            }

            var options = {
                url: process.env.NODE_API_URL + "/creator/youtube/updateCreatorYoutubeStats",
                form: {
                    youtubeData: videoObj
                },
                method: "POST",
                json: true
            };

            httpRequest.postAsync(options).then(function(data) {

                invalidReq = !data || data[0].body.error;

                if(invalidReq) {
                    errMsg = data[0].body.error || 'Error while retrieving creators data';
                    deferred.reject(errMsg);
                }

                responseData = data[0].body.message;
                cb();
            });
        }
    }), function() {
        deferred.resolve(responseData);
    });

    return deferred.promise;
}


function getYoutubeVideoStats() {

    var creatorsArr,
        creatorYoutubeChannelIdList,
        youtubeQueryParams,
        options,
        invalidReq,
        len,
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

            creatorsArr = creatorObj[0].body;

            creatorYoutubeChannelIdList =  _(creatorObj[1])
                                           .pluck('socialAuth').flatten()
                                           .filter(function(socialObj) { return socialObj.platformName === 'Youtube'; })
                                           .pluck('channelId').value();

            checkUndefinedVal = _.reject(creatorYoutubeChannelIdList, function(val){ return _.isUndefined(val) });

            if (creatorYoutubeChannelIdList === undefined || checkUndefinedVal.length === 0) {
                deferred.reject("No channelId found in the database");
            }

            return retrieveCreatorSearchData(checkUndefinedVal);
        })
        .then(function(videoSearchData) {

            if (videoSearchData === undefined || videoSearchData.length === 0) {
                deferred.reject("No video search data recevied from youtube");
            }

           return loopVideoSearchData(videoSearchData);
        })
        .then(function(videoArrData) {

            if(_.isEmpty(videoArrData) || videoArrData.length === 0) {
                errMsg = 'Empty Video id list data';
                deferred.reject(errMsg);
            }

            return retrieveVideoStats(videoArrData);
        })
        .then(function(statsInfo) {

            if (_.isEmpty(statsInfo) || statsInfo.length === 0) {
                errMsg = 'Error while retrieving video statistics';
                deferred.reject(errMsg);
            }

            return loopStatsInfo(statsInfo);
        })
        .then(function(videoStats){

            if (_.isEmpty(videoStats) || videoStats.length === 0) {
                errMsg = 'Error while calculating video statistics';
                deferred.reject(errMsg);
            }

            return updateYoutubeStats(videoStats);
        })
        .then(function(data) {

            if(!data) {
                deferred.reject("Error while updating the data");
            }

            deferred.resolve(data);
        })
        .catch(function(error) {
            log.write(error);
            deferred.reject(error);
        });

    return deferred.promise;
}

function retrieveCreatorSearchData(channelIdList) {

    var deferred = Promise.defer(),
        youtubeQueryParams,
        options,
        videoListArr = [],
        youtubeApiKey = process.env.YOUTUBE_API_KEY,
        invalidReq,
        errMsg;

    if (!_.isArray(channelIdList) || channelIdList.length === 0) {
        deferred.reject("No channel id received");
    }

    async.series(channelIdList.map(function(creatorChannelId) {

        return function(cb) {

            youtubeQueryParams = {
                part: "snippet",
                channelId: creatorChannelId,
                type: "video",
                publishedAfter: commonFunctions.getISOtimeStamp(),
                key: youtubeApiKey
            }

            options = {
                'headers': {
                    'Content-Type': 'application/json'
                },
                'method': 'GET',
                'url': process.env.YOUTUBE_SEARCH_API_URL + '?' + qs.stringify(youtubeQueryParams),
                json: true
            }

            httpRequest.getAsync(options).then(function(videoObj) {

                invalidReq = !videoObj || videoObj[0].body.error

                if(invalidReq) {
                    errMsg = videoObj[0].body.error.message || "Error while fetching video Id info";
                    deferred.reject(errMsg);
                }

                videoListArr.push({
                    "videoIdArr": videoObj[0].body.items,
                    "channelId": creatorChannelId
                });
                cb();
            });
        }
    }), function(error) {
        deferred.resolve(videoListArr);
    });

    return deferred.promise;
}

function loopVideoSearchData(response) {

    if(response === undefined || response === null || response.length === 0 ) {
        deferred.reject("No video search data found");
    }

    var len = response.length,
        deferred = Promise.defer(),
        videoIdList = [],
        videoDataIdArr = [],
        videoIdData,
        channelId,
        videoDataLen;

    while(len--) {

        videoIdData = response[len].videoIdArr;
        channelId = response[len].channelId;
        videoDataLen = videoIdData.length;
        videoDataIdArr = [];

        if(!_.isEmpty(videoIdData) || videoIdData.length > 0) {

            while(videoDataLen--) {

                if(videoIdData[videoDataLen].snippet.channelId === channelId) {

                    videoDataIdArr.push(videoIdData[videoDataLen].id.videoId);
                }
            }

            videoIdList.push({
                "videoIdArrList": videoDataIdArr,
                "channelId": channelId
            })
        }
    }

    deferred.resolve(videoIdList);
    return deferred.promise;
}

function retrieveVideoStats(response) {

    var deferred = Promise.defer(),
        youtubeQueryParams,
        videoStats = [],
        options,
        youtubeApiKey = process.env.YOUTUBE_API_KEY,
        invalidReq,
        errMsg,
        videoIdArr,
        videoChannelId,
        videoStatsDataArr = [];

    async.series(response.map(function(videoObj) {

        return function(cb) {

            if (!_.isArray(videoObj.videoIdArrList) || videoObj.videoIdArrList.length === 0) {
                deferred.reject("No video Id received");
            }

            videoIdArr = videoObj.videoIdArrList;
            videoChannelId = videoObj.channelId;

            async.series(videoIdArr.map(function(videoId) {

                return function(cb2) {

                    youtubeQueryParams = {
                        part: "statistics, snippet",
                        id: videoId,
                        key: youtubeApiKey
                    }

                    options = {
                        'headers': {
                            'Content-Type': 'application/json'
                        },
                        'method': 'GET',
                        'url': process.env.YOUTUBE_VIDEO_STATS_API_URL + '?' + qs.stringify(youtubeQueryParams),
                        json: true
                    }

                    httpRequest.getAsync(options).then(function(statsInfo) {

                        invalidReq = !statsInfo || statsInfo[0].body.error

                        if(invalidReq) {
                            errMsg = statsInfo[0].body.error.message || "Error while fetching video Id info";
                            deferred.reject(errMsg);
                        }

                        videoStatsDataArr.push(statsInfo[0].body.items[0]);
                        cb2();
                    });
                }
            }), function() {
                videoStats.push({
                    "videoInfo": videoStatsDataArr,
                    "videoChannelId": videoChannelId
                });
                cb();
            });
        }
    }), function(error) {
        deferred.resolve(videoStats);
    });

    return deferred.promise;
}

function loopStatsInfo(response) {

    if(response === undefined || response === null || response.length === 0) {
        deferred.reject("No video stats found");
    }

    var len = response.length,
        deferred = Promise.defer(),
        creatorVideostatsList = [],
        creatorVideoInfo,
        creatorChannelId,
        creatorVideoInfoLen,
        viewCount = 0,
        likesCount = 0,
        commentCount = 0,
        totalEngagements;

    while(len--) {

        if(!_.isEmpty(response[len]) || response[len].length > 0) {

            creatorVideoInfo = response[len].videoInfo;
            creatorVideoInfoLen = creatorVideoInfo.length;
            creatorChannelId = response[len].videoChannelId;
            viewCount = 0;
            likesCount = 0;
            commentCount = 0;

            while(creatorVideoInfoLen--) {

                if(creatorVideoInfo[creatorVideoInfoLen].snippet.channelId === creatorChannelId) {

                    viewCount += parseInt(creatorVideoInfo[creatorVideoInfoLen].statistics.viewCount);
                    likesCount += parseInt(creatorVideoInfo[creatorVideoInfoLen].statistics.likeCount);
                    commentCount += parseInt(creatorVideoInfo[creatorVideoInfoLen].statistics.commentCount);
                }
            }

            if(!Number(viewCount) || !Number(likesCount) || !Number(commentCount)) {
                deferred.reject("error while calculting youtube video id data");
            }

            totalEngagements = Number(likesCount) + Number(commentCount);

            creatorVideostatsList.push({
                "channelId": creatorChannelId,
                "engagements": totalEngagements,
                "avgViewCount": viewCount,
                "platformName": "Youtube"
            });
        }
    }

    deferred.resolve(creatorVideostatsList);
    return deferred.promise;
}