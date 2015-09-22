"use strict";

var oauthSignature = require("oauth-signature"),
    crypto=require("crypto");

module.exports = {
    loginAuthHeader: loginAuthHeader,
    endPointsAuthHeader: endPointsAuthHeader
};

function createNonce() {

    return (new Buffer(
        Math.floor(Math.random() * 100000000) +
        ';' + new Date().getTime() + ';' +
        Math.floor(Math.random() * 10000000)
    ).toString('base64')).replace(/[^a-z0-9]/gi, '');
}


function loginAuthHeader(httpMethod, url, token, verifier, hasCallback, queryParams) {

    var CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY,
        CONSUMER_SECRET = process.env.TWITTER_SECRET_KEY,
        retStr = 'OAuth ',
        params, signature;

    params = {
        oauth_consumer_key: CONSUMER_KEY,
        oauth_signature_method: 'HMAC-SHA1',
        oauth_version: '1.0'
    };

    if (hasCallback) {
        params.oauth_callback = 'http://' + process.env.SERVER_HOST + ':' + process.env.SERVER_PORT + '/twitter/accessTwitteroAuthToken?userType=' + queryParams.userType + '&userId=' + queryParams.userId;
    }

    if (token && verifier) {
        params.oauth_token = token;
        params.oauth_verifier = verifier;
    }

    params.oauth_nonce = createNonce();
    params.oauth_timestamp = Math.floor(Date.now() / 1000);

    signature = oauthSignature.generate(httpMethod, url, params, CONSUMER_SECRET);

    for (var key in params) {
        retStr += encodeURIComponent(key) + '="' + encodeURIComponent(params[key]) + '", ';
    }

    retStr += 'oauth_signature="' + signature + '"';
    return retStr;
}

function endPointsAuthHeader(data, headerData) {

    var oauthData = {
        oauth_consumer_key: process.env.TWITTER_CONSUMER_KEY,
        oauth_nonce: createNonce(),
        oauth_signature_method: "HMAC-SHA1",
        oauth_timestamp: Math.floor(Date.now() / 1000),
        oauth_token: headerData.oauthToken,
        oauth_version: "1.0"
    };
    
    var sigData = {};
    
    for (var k in oauthData) {
        sigData[k] = oauthData[k];
    }
    
    for (var k in data) {
        sigData[k] = data[k];
    }

    var sig = generateOAuthSignature(headerData.method, headerData.twitterFollowersApiUrl, sigData, headerData.tokenSecret);

    oauthData.oauth_signature = sig;

    var oauthHeader = "";
    for (var k in oauthData) {
        oauthHeader += ", " + encodeURIComponent(k) + "=\"" + encodeURIComponent(oauthData[k]) + "\"";
    }
    oauthHeader = oauthHeader.substring(1);

    return oauthHeader;
}

function generateOAuthSignature(method, url, data, tokenSecret) {

    var signingToken = encodeURIComponent(process.env.TWITTER_SECRET_KEY) + "&" + encodeURIComponent(tokenSecret),
        keys = [],
        output = "GET&" + encodeURIComponent(url) + "&",
        params = "";

    for (var d in data) {
        keys.push(d);
    }

    keys.sort();

    keys.forEach(function(k) {
        params += "&" + encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
    });

    params = encodeURIComponent(params.substring(1));

    return hashString(signingToken, output + params, "base64");
}


function hashString(key, str, encoding) {

    var hmac = crypto.createHmac("sha1", key);
    hmac.update(str);
    return hmac.digest(encoding);
}