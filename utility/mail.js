var promise = require("bluebird"),
    nodemailer = require("nodemailer"),
    mandrillTransport = require("nodemailer-mandrill-transport"),
    apiKey = process.env.MANDRILL_APIKEY;

var log = require("../utility/log");

module.exports = {
    send: send
};

var options = {
    auth: {
        apiKey: apiKey
    }
};

var transport = promise.promisifyAll(nodemailer.createTransport(mandrillTransport(options)));

function send(from, to, subject, html) {

    transport.sendMail({
        from: from,
        to: to,
        subject: subject,
        html: html
    }, function(err, info) {
        if (err) {
            log.write(err);
        } else {
            log.write(info);
        }
    });
}
