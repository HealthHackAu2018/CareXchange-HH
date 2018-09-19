# CareXchange #

A "Slack for Doctors" that was slapped together over the weekend of HealthHack 2018 in Brisbane.

It is designed to allow for real-time communications and file-sharing between healthcare professionals, while maintaining a separation between social and clinical communications. Additionally, messages and files sent via the "Clinical" mode are subject to various measures like automatic destruction and link expiry, while the entire app is designed to be completely secure, with encryption from point to point.

## Technolgoies ##

CareXchange uses a MEAN (MongoDB, ExpressJS, AngularJS, NodeJS) stack, with a Redis database acting as a quick-access, short-term message cache and Pub/Sub adapter. Our production deployment also uses NGINX and Let's Encrypt to deploy and proxy a HTTPS site to the Node.js app (by default port 3000).

Real-time communication is acheived using websockets via `Socket.io`. User management and social SSO is done using `Passport`. Database integration is done with `Mongoose` for storing models/data, and `connect-mongo` for proudction session storage.

Native apps use `Electron` to wrap web app for desktop OS (Windows, OSX, Linux), and `Xamarin` for mobile OS (iOS, Android).

Prettiness is attained using both `AdminLTE` for chat theming, and `ui-bootstrap`/`Bootstrap` for everything else. Image uploads are presented using `lightbox2`.

## Installation ##

Use `conda`. It's awesome:
```
conda create -n carex -c conda-forge nodejs redis mongodb
source activate carex
npm install
```

## Running ##
Launch both Mongo and Redis (either as services/daemons, or in foreground in various shells:
```
redis-server
mongod
```

Then run the app with:
```
node server.js
```

Alternatively, for local development, you can use `VS Code` with the included `.vscode` files, and use that to debug. It's great.

Please note that you will need your own `config.json`, in `app/config`, filled out (use provided template), or use the standard Node production environment variables setup.

## Todo ##
### Primary ###
* Move "teams" page from EJS render to Ng view
* Update CSS; better adaptive mobile support
* Add modals for displaying uploading audio, movies, PDFs e.g. securely (i.e. user can consume, but not download)
* Ng modals for settings
    * Team settings
    * User settings
* Firebase push notifications
* Bug of image of other users
* Device image/video/audio capture (works on old iOS, permissions issues on latest iOS/Android)
* Better handling of missing (expired) fires in the `getfile` route
* validate link/message expiry and deletion (maybe only store `date` properties, and just customizable policies to determine when appropriate to expire/delete)

### Secondary ###
* Post seen
* user setting of whether to load social or clinical first (default to social)
* Move teams page from backend (EJS)) to frontend (ng)
* Migrate to postgres
    * investigate
* Extend Teams to include Contacts
* Extend Teams to include Contact search and add
* Add badge for unread notifications on teams listing
* Text message: check box functionality (i.e. todo list)
* search
* @mentions
* #groups (specialities, locations e.g.) w/ team
* ...I guess update to use latest Angular

### Schema ###
* Teams
    * TeamId
    * Users
        * UserId
        * Role
* Users
    * UserId
    * Role
    * Speciality
    * Location...
    * Name
    * Picture
    * SocialId
    * Username
    * Password
* Messages
    * MessageId
    * TeamId
    * Timestamp
    * Content.
    * Seen[]
        * UserId
        * Timestamp
* Objects
    * MessageId[]
    * CreationDate

* CheckMessage
    * ...(as above)
    * items[]
        * content
        * check (bool)
        * checkdate
        * checkby
