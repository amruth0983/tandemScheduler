/*Functions written in this file are only for testing the social api data
  This file won't be available in production mode since this file is made
  for testing purpose */

"use strict";

var Promise = require("bluebird"),
    httpRequest = Promise.promisifyAll(require('request')),
    https = require('https'),
    qs = require('querystring'),
    log = require("../../utility/log"),
    async = require("async"),
    commonFunctions = require("../../helpers/commonFunctions"),
    _ = require("lodash");

module.exports = {
    getFacebookStats: getFacebookStats
};

function getFacebbokAccessToken() {

    return new Promise(function(resolve, reject) {

        var options = {
            'headers': {
                'Accept': 'application/json'
            },
            'method': 'POST',
            'url': process.env.FACEBOOK_HOST_URL + '/oauth/access_token?client_id=' + process.env.FACEBOOK_CLIENT_ID + '&client_secret=' + process.env.FACEBOOK_SECRET_KEY + '&grant_type=client_credentials',
        }

        httpRequest.postAsync(options).then(function(data) {

            if(data[0].body.error) {
                reject("Error while getting the access token ");
            }

            return resolve(data);
        });
    });
}

function getFacebookStats(request, reply) {

    var creatorsArr,
        creatorInstagramUserIdlist,
        options,
        invalidReq,
        len,
        errMsg,
        checkUndefinedVal;

    getFacebbokAccessToken().then(function(result) {
        var token = result[1].split('=')[1];
        return getCreatorPagesList(token);
    })
    .then(function(data) {
        reply(data);
    })
    .catch(function(error) {
        console.log(error);
        reply(error);
    });
}

function getCreatorPagesList(token) {

    var deferred = Promise.defer(),
        options;

    options = {
        'headers': {
        'Accept': 'application/json'
        },
        'method': 'GET',
        'url': process.env.FACEBOOK_HOST_URL + '/495912453768783/feed?access_token='+ token
    }

    httpRequest.getAsync(options).then(function(data) {
        deferred.resolve(data);
    })

    return deferred.promise;
}