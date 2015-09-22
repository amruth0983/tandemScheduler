/*Routes defined in this file are only for testing the social api data
  This file won't be available in production mode since this file is made
  for testing purpose */

var series = require("hapi-next"),
    joi = require("joi"),
    controller = require("./youtube.controller");

module.exports = {

    getYoutubeVideoStats: {
        method: "GET",
        path: "/youtube/videoStats",
        config: {
            description: 'Fetch the youtube video statistics',
            notes: 'Fetch the youtube video statistics',
            tags: ['youtube', 'video', 'statistics'],
            handler: function(request, reply) {

                var functionSeries = new series([
                    controller.getYoutubeVideoStats
                ]);

                functionSeries.execute(request, reply);
            }
        }
    }
};
