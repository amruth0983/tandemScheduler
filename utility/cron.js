"use strict";

var schedule = require('node-schedule'),
    log = require("../utility/log"),
    twitterScheduler = require("../helpers/twitter-scheduler"),
    youtubeScheduler = require("../helpers/youtube-scheduler"),
    instagramScheduler = require("../helpers/instagram-scheduler");


module.exports = {
    CronCreatorUpdate: CronCreatorUpdate
};

function CronCreatorUpdate(cronTime) {

    var minutesInterval = parseInt(process.env.TANDEM_REFRESH_CRON_TIME_MINUTES, 2),
        hoursInterval = parseInt(process.env.TANDEM_REFRESH_CRON_TIME_HOURS, 2),
        secondsInterval = parseInt(process.env.TANDEM_REFRESH_CRON_TIME_SECONDS, 2);

    var rule = new schedule.RecurrenceRule();
    rule.hours  = new schedule.Range(0, 59, hoursInterval);
    rule.minute = new schedule.Range(0, 59, minutesInterval);

    schedule.scheduleJob(rule, function() {

        log.write('Running Scheduler');

        twitterScheduler.getTwitterUserInfo()
            .then(function(){
                log.write("Twitter Followers Scheduler done");
            })
            .catch(function(error) {
                log.write(error);
            });

        twitterScheduler.getCreatorTwitterUserTimeLine()
            .then(function() {
                log.write("Twitter Timeline Scheduler done");
            })
            .catch(function(error) {
                log.write(error)
            });

        youtubeScheduler.getYoutubeVideoStats()
            .then(function() {
                log.write("Youtube Scheduler done");
            })
            .catch(function(error) {
                log.write(error)
            });

        instagramScheduler.getInstagramFollowersCount()
            .then(function() {
                log.write("Instagram followers Scheduler done");
            })
            .catch(function(error) {
                log.write(error)
            });

        instagramScheduler.getInstagramLikesCommentsCount()
            .then(function() {
                log.write("Instagram likes and comments Scheduler done");
            })
            .catch(function(error) {
                log.write(error)
            });

    });
}
