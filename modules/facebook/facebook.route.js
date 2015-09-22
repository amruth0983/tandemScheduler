/*Routes defined in this file are only for testing the social api data
  This file won't be available in production mode since this file is made
  for testing purpose */

var series = require("hapi-next"),
    joi = require("joi"),
    controller = require("./facebook.controller");

module.exports = {

    getFacebookStats: {
        method: "GET",
        path: "/facebook/feedStats",
        config: {
            description: 'Fetch the facebook feed statistics',
            notes: 'Fetch the facebook feed statistics',
            tags: ['facebook', 'feed', 'statistics'],
            handler: function(request, reply) {

                var functionSeries = new series([
                    controller.getFacebookStats
                ]);

                functionSeries.execute(request, reply);
            }
        }
    }
};
