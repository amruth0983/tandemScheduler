"use strict";

var Promise = require("bluebird"),
    httpRequest = Promise.promisifyAll(require('request')),
    moment = require("moment"),
    async = require("async"),
    _ = require("lodash");

module.exports = {
    getCreatorsData: getCreatorsData,
    getPreviousMonthTimeStamp: getPreviousMonthTimeStamp,
    getISOtimeStamp: getISOtimeStamp,
    updateCreatorSocialFollowerStats: updateCreatorSocialFollowerStats,
    updateCreatorSocialEngagementStats: updateCreatorSocialEngagementStats
};

function getCreatorsData() {

    return new Promise(function(resolve, reject) {

        var options = {
            url: process.env.NODE_API_URL + "/creatorsSocailData",
            method: "GET",
            json: true
        };

        httpRequest.getAsync(options).then(function(data) {

            if(!data || data[1].errors) {
                reject("Error while getting the creators data ");
            }

            return resolve(data);
        });
    });
}

function updateCreatorSocialFollowerStats(creatorsData) {

    var deferred = Promise.defer(),
        responseData,
        invalidReq,
        errMsg;

    if(!creatorsData || !_.isArray(creatorsData) || creatorsData.length === 0) {
        deferred.reject("No creators data received");
    }

    async.series(creatorsData.map(function(creatorObj) {
        return function(cb) {

            if(!creatorObj) {
                deferred.reject("no creator object received");
            }

            var options = {
                url: process.env.NODE_API_URL + "/creator/updateCreatorReachStats",
                form: {
                    creatorSocialData: creatorObj
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
    }), function(err) {
        deferred.resolve(responseData);
    });

    return deferred.promise;
}

function updateCreatorSocialEngagementStats(creatorsTweetData) {

    var deferred = Promise.defer(),
        responseData,
        invalidReq,
        errMsg;

    if(!creatorsTweetData || !_.isArray(creatorsTweetData) || creatorsTweetData.length === 0) {
        deferred.reject("No creator tweeter data received");
    }

    async.series(creatorsTweetData.map(function(creatorTweetObj) {
        return function(cb) {

            if(!creatorTweetObj) {
                deferred.reject("no tweeter object received");
            }

            var options = {
                url: process.env.NODE_API_URL + "/creator/updateCreatorEngagementDetails",
                form: {
                    creatorSocialData: creatorTweetObj
                },
                method: "POST",
                json: true
            };

            httpRequest.postAsync(options).then(function(data) {

                invalidReq = !data || data[0].body.error;

                if(invalidReq) {
                    errMsg = data[0].body.error || 'Error while retrieving creators tweet data';
                    deferred.reject(errMsg);
                }

                responseData = data[0].body.message;
                cb();
            });
        }
    }), function(err) {
        deferred.resolve(responseData);
    });

    return deferred.promise;
}

function getPreviousMonthTimeStamp() {

    var today = new Date(),
        timeStamp;

    today.setMonth(today.getMonth() - 2);
    timeStamp = today.getTime();

    return timeStamp;
}

function getISOtimeStamp() {

    var today = new Date(),
        formattedString;

    today.setMonth(today.getMonth() - 2);
    today.toISOString();

    formattedString = moment(today).format('YYYY-MM-DDT[00:00:00Z]');

    return formattedString;
}