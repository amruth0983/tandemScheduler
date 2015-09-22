var hapi = require("hapi"),
    log = require("./utility/log");

// Load stuff from ".env" into "process.env"
require("dotenv").load();

var server = module.exports = new hapi.Server();

if (process.env.SERVER_HOST) {
    server.connection({
        routes: {
            cors: true
        },
        host: process.env.SERVER_HOST,
        port: process.env.SERVER_PORT
    });
} else {
    server.connection({
        routes: {
            cors: {
                origin: [
                    "http://50.112.180.5",
                    "http://creator.dev.tandemapp.com",
                    "http://52.26.194.214",
                    "http://auth.dev.tandemapp.com",
                    "http://main.dev.tandemapp.com",
                    "http://52.2.230.223",
                    "http://creator.staging.tandemapp.com",
                    "http://52.2.125.37",
                    "http://auth.staging.tandemapp.com",
                    "http://main.staging.tandemapp.com"
                ]
            }
        },
        port: process.env.SERVER_PORT
    });
}

require("./modules");

var cron = require('./utility/cron');

/*if(process.env.TANDEM_REFRESH_CRON_TIME_MINUTES) {
    cron.CronCreatorUpdate(process.env.TANDEM_REFRESH_CRON_TIME_MINUTES);  
}*/

server.start(function() {
    log.write("Server running at:", server.info.uri);
});
