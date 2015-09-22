/*Routes defined in this file are only for testing the social api data
  This file won't be available in production mode since this file is made
  for testing purpose */

var series = require("hapi-next"),
    joi = require("joi"),
    controller = require("./instagram.controller");

module.exports = {

    getInstagramFollowersCount: {
        method: "GET",
        path: "/instagram/userFollowersCount",
        config: {
            description: 'Fetch the instagram user followers count',
            notes: 'Fetch the instagram user followers count',
            tags: ['instagram', 'user', 'followers', 'count'],
            handler: function(request, reply) {

                var functionSeries = new series([
                    controller.getInstagramFollowersCount
                ]);

                functionSeries.execute(request, reply);
            }
        }
    },

    getInstagramLikesCommentsCount: {
        method: "GET",
        path: "/instagram/userLikesAndCommentsCount",
        config: {
            description: 'Fetch the instagram user likes and comments count',
            notes: 'Fetch the instagram user likes and comments count',
            tags: ['instagram', 'user', 'likes', 'comments', 'count'],
            handler: function(request, reply) {
                var functionSeries = new series([
                    controller.getInstagramLikesCommentsCount
                ]);

                functionSeries.execute(request, reply);
            }
        }
    }
};
