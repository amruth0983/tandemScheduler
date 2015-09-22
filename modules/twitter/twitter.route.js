/*Routes defined in this file are only for testing the social api data
  This file won't be available in production mode since this file is made
  for testing purpose */

var series = require("hapi-next"),
    joi = require("joi"),
    controller = require("./twitter.controller");

module.exports = {

    getTwitterUserInfo: {
        method: "GET",
        path: "/twitter/getTwitterUserInfo",
        config: {
            description: 'Access the twitter users info',
            notes: 'Access users twitter info',
            tags: ['twitter', 'user info'],
            handler: function(request, reply) {

                var functionSeries = new series([
                    controller.getTwitterUserInfo
                ]);

                functionSeries.execute(request, reply);
            }
        }
    },

    getCreatorTwitterUserTimeLine: {
        method: "GET",
        path: "/twitter/getCreatorTwitterUserTimeLine",
        config: {
            description: 'Access the twitter user timeline ',
            notes: 'Access twitter user timeline',
            tags: ['twitter', 'user', 'timeline'],
            handler: function(request, reply) {

                var functionSeries = new series([
                    controller.getCreatorTwitterUserTimeLine
                ]);

                functionSeries.execute(request, reply);
            }
        }
    }
};
