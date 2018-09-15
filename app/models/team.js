'use strict';

var teamModel   = require('../database').models.team;
var User 		= require('./user');

var create = function (data, callback){
	var newTeam = new teamModel(data);
	newTeam.save(callback);
};

var find = function (data, callback){
	teamModel.find(data, callback);
}

var findOne = function (data, callback){
	teamModel.findOne(data, callback);
}

var findById = function (id, callback){
	teamModel.findById(id, callback);
}

var findByIdAndUpdate = function(id, data, callback){
	teamModel.findByIdAndUpdate(id, data, { new: true }, callback);
}

/**
 * Add a user along with the corresponding socket to the passed team
 *
 */
var addUser = function(team, socket, callback){
	
	// Get current user's id
	var userId = socket.request.session.passport.user;

	// Push a new connection object(i.e. {userId + socketId})
	var conn = { userId: userId, socketId: socket.id};
	team.connections.push(conn);
	team.save(callback);
}

/**
 * Get all users in a team
 *
 */
var getUsers = function(team, socket, callback){

	var users = [], vis = {}, count = 0;
	var userId = socket.request.session.passport.user;

	// Loop on team's connections, Then:
	team.connections.forEach(function(conn){

		// 1. Count the number of connections of the current user(using one or more sockets) to the passed team.
		if(conn.userId === userId){
			count++;
		}

		// 2. Create an array(i.e. users) contains unique users' ids
		if(!vis[conn.userId]){
			users.push(conn.userId);
		}
		vis[conn.userId] = true;
	});

	// Loop on each user id, Then:
	// Get the user object by id, and assign it to users array.
	// So, users array will hold users' objects instead of ids.
	var loadedUsers = 0;		
	users.forEach(function(userId, i){
		User.findById(userId, function(err, user){
			if (err) { return callback(err); }
			users[i] = user;

			// fire callback when all users are loaded (async) from database 
			if(++loadedUsers === users.length){
				return callback(null, users, count);
			}
		});
	});
}


/**
 * Remove a user along with the corresponding socket from a team
 *
 */
var removeUser = function(socket, callback){

	// Get current user's id
	var userId = socket.request.session.passport.user;

	find(function(err, teams){
		if(err) { return callback(err); }

		// Loop on each team, Then:
		teams.every(function(team){
			var pass = true, count = 0, target = 0;

			// For every team, 
			// 1. Count the number of connections of the current user(using one or more sockets).
			team.connections.forEach(function(conn, i){
				if(conn.userId === userId){
					count++;
				}
				if(conn.socketId === socket.id){
					pass = false, target = i;
				}
			});

			// 2. Check if the current team has the disconnected socket, 
			// If so, then, remove the current connection object, and terminate the loop.
			if(!pass) {
				team.connections.id(team.connections[target]._id).remove();
				team.save(function(err){
					callback(err, team, userId, count);
				});
			}

			return pass;
		});
	});
}

module.exports = { 
	create, 
	find, 
	findOne, 
	findById, 
	addUser, 
	getUsers, 
	removeUser 
};