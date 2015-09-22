# Tandimate scheduler server (Nodejs with Hapijs)

**Step 1: Clone repo**

Clone this repo and checkout a required branch.

1. `git clone https://github.com/theworkingassembly/tandimate-scheduler.git`
2. `git fetch origin [branch]`
3. `git checkout [branch]`

**Step 6: Install packages**

1. `cd /path/to/tandem-scheduler/directory`
2. `sudo npm install`

### Environment File

Create a ".env" file in the `tandem-scheduler` directory. Open it and add the following lines.

```
SERVER_HOST=localhost // Must NOT be used for staging/production
SERVER_PORT=3002

NODE_API_URL= //staging/production node api url

TANDEM_REFRESH_CRON_TIME_MINUTES=[Mention-minutes-for-the-cron-to-run]
TANDEM_REFRESH_CRON_TIME_HOURS=[Mention-hours-for-the-cron-to-run]

EMAIL_FROM=[Name <email@domain.com>]

CREATOR_BASEURL=[base-url-of-public-app]
AUTH_BASEURL=[base-url-of-auth-app]
MAIN_BASEURL=[base-url-of-private-app]

TWITTER_CONSUMER_KEY=[twitter-app-consmer-key]
TWITTER_SECRET_KEY=[twitter-app-secret-key]
TWITTER_HOST_URL=[twitter-dev-url]
TWITTER_TOKEN_URL=[twitter-token_url]
TWITTER_USERS_INFO=[twitter-look-users-url]
TWITTER_USERS_TIMELINE=[twitter-user-timeline]

YOUTUBE_API_KEY=[youtube-api-key]
YOUTUBE_SEARCH_API_URL=[youtube-search-url]
YOUTUBE_VIDEO_STATS_API_URL=[youtube-video-stats-url]

INSTAGRAM_HOST_URL=[instagram-host-url]
INSTAGRAM_CLIENTID=[instagram-client-id]
INSTAGRAM_SECRET_KEY=[instagram-secret-key]
INSTGRAM_USER_DETAILS_API_URL=[instagram-user-details-url]

```
### Kickstart

Run the following command in your `tandem-server` directory to start the Node server.

`node app.js`
