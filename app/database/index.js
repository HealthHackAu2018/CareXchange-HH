'use strict';

var config 		= require('../config');
var Mongoose 	= require('mongoose');
var logger 		= require('../logger');

// Connect to the database
// construct the database URI and encode username and password.
var dbURI = "mongodb://" + 
//			encodeURIComponent(config.db.username) + ":" + 
//			encodeURIComponent(config.db.password) + "@" + 
			config.db.host + ":" + 
			config.db.port + "/" + 
			config.db.name;
Mongoose.connect(dbURI, { useNewUrlParser: true });

// Throw an error if the connection fails
Mongoose.connection.on('error', function(err) {
	if(err) throw err;
});

// mpromise (mongoose's default promise library) is deprecated, 
// Plug-in your own promise library instead.
// Use native promises
Mongoose.Promise = global.Promise;

// redis db
var redis 	= require('redis').createClient;

var port = config.redis.port;
var host = config.redis.host;
var password = config.redis.password;

// Connect to Redis
var pubClient = redis(port, host, { auth_pass: password });
var subClient = redis(port, host, { auth_pass: password, return_buffers: true, });

module.exports = { Mongoose, pubClient, subClient,
	models: {
		user: require('./schemas/user.js'),
		team: require('./schemas/team'),
		message: require('./schemas/message.js')
	}
};
