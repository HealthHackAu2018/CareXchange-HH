'use strict';

var config 	= require('../config');
var adapter = require('socket.io-redis');

var Team = require('../models/team');
var Db = require('../database');

/**
 * Encapsulates all code for emitting and listening to socket events
 *
 */

function msgDate(a,b) {
	var aObj = JSON.parse(a);
	var bObj = JSON.parse(b);
	if (aObj.date < bObj.date)
	  return -1;
	if (aObj.date > bObj.date)
	  return 1;
	return 0;
  }
  
var ioEvents = function(io) {

	// Teams namespace
	io.of('/teams').on('connection', function(socket) {

		// Create a new team
		socket.on('createTeam', function(title) {
			Team.findOne({'title': new RegExp('^' + title + '$', 'i')}, function(err, team){
				if(err) throw err;
				if(team){
					socket.emit('updateTeamsList', { error: 'Team name already exists.' });
				} else {
					Team.create({ 
						title: title
					}, function(err, newTeam){
						if(err) throw err;
						socket.emit('updateTeamsList', newTeam);
						socket.broadcast.emit('updateTeamsList', newTeam);
					});
				}
			});
		});
	});

	// Team chat namespace
	io.of('/teamchat').on('connection', function(socket) {

		// Join a team chat
		socket.on('join', function(teamId) {
			Team.findById(teamId, function(err, team){
				if(err) throw err;
				if(!team){
					// Assuming that you already checked in router that team chat exists
					// Then, if a team doesn't exist here, return an error to inform the client-side.
					socket.emit('updateUsersList', { error: 'Team doesn\'t exist.' });
				} else {
					// Check if user exists in the session
					if(socket.request.session.passport == null){
						return;
					}

					Team.addUser(team, socket, function(err, newTeam){

						// Join the team channel
						socket.join(newTeam.id);

						Team.getUsers(newTeam, socket, function(err, users, currentUserInTeam){
							if(err) throw err;

							// Get the 100 most recent messages from Redis
							var mId = "message_" + teamId;
							Db.pubClient.lrange(mId, 0, 99, function(err, reply) {
								if(!err) {
									var result = [];
									reply.sort(msgDate);
									// Loop through the list, parsing each item into an object
									for(var message in reply){
										message = JSON.parse(reply[message]);
										message.date      = (new Date(message.date)).toLocaleString();
										message.username  = message.username;
										message.content   = message.content;
										result.push(message);
									}
									// Return list of all user connected to the team to the current user
									var data = {};
									data.users = users;
									data.prevMsgs = result;
									data.title = team.title;
									socket.emit('updateUsersList', data, true);
									// add
									data.prevMsgs = [];
									socket.broadcast.to(newTeam.id).emit('updateUsersList', data);
								}
							});
							
							// Return the current user to other connecting sockets in the team 
							// ONLY if the user wasn't connected already to the current team
							// if(currentUserInTeam === 1){
							// 	var data = {};
							// 	data.users = users[users.length - 1];
							// 	data.title = team.title;
							// 	socket.broadcast.to(newTeam.id).emit('updateUsersList', data);
							//}
						});
					});
				}
			});
		});

		// When a socket exits
		socket.on('disconnect', function() {

			// Check if user exists in the session
			if(socket.request.session.passport == null){
				return;
			}

			// Find the team to which the socket is connected to, 
			// and remove the current user + socket from this team
			Team.removeUser(socket, function(err, team, userId, currentUserInTeam){
				if(err) throw err;

				// Leave the team channel
				socket.leave(team.id);

				// Return the user id ONLY if the user was connected to the current team using one socket
				// The user id will be then used to remove the user from users list on team chat page
				if(currentUserInTeam === 1){
					socket.broadcast.to(team.id).emit('removeUser', userId);
				}
			});
		});

		// When a user is typing..
		socket.on('typing', function(teamId, callback) {
			var userId = socket.request.session.passport.user;
			socket.emit('notifyTyping', userId);
			socket.broadcast.to(teamId).emit('notifyTyping', userId);
		});

		// When a user is empty..
		socket.on('empty', function(teamId, callback) {
			var userId = socket.request.session.passport.user;
			socket.emit('notifyEmpty', userId);
			socket.broadcast.to(teamId).emit('notifyEmpty', userId);
		});

		// When a new message arrives
		socket.on('newMessage', function(teamId, message, callback) {
			if(message.hasMsg){
				socket.emit('addMessage', message);
				socket.broadcast.to(teamId).emit('addMessage', message);
				callback({success:true});	
			}else if(message.hasFile){
				if(message.istype == "image"){
					socket.emit('addImageMessage', message);
					socket.broadcast.to(teamId).emit('addImageMessage', message);
					callback({success:true});
				} else if(message.istype == "music"){
					socket.emit('addAudioMessage', message);
					socket.broadcast.to(teamId).emit('addAudioMessage', message);
					callback({success:true});
				} else if(message.istype == "PDF"){
					socket.emit('addDocMessage', message);
					socket.broadcast.to(teamId).emit('addDocMessage', message);
					callback({success:true});
				}
			}else{
				callback({ success:false});
				return;
			}
			// cache message to redis, trim to 100 records only
			var mId = "message_" + teamId;
			Db.pubClient.lpush(mId, JSON.stringify(message));
			Db.pubClient.ltrim(mId, 0, 99);						
		});

	});
}

/**
 * Initialize Socket.io
 * Uses Redis as Adapter for Socket.io
 *
 */
var init = function(app){

	var server 	= require('http').Server(app);
	var io 		= require('socket.io')(server);

	// Force Socket.io to ONLY use "websockets"; No Long Polling.
	io.set('transports', ['websocket']);
	let pubClient = Db.pubClient;
	let subClient = Db.subClient;
	io.adapter(adapter({ pubClient, subClient }));

	// Allow sockets to access session data
	io.use((socket, next) => {
		require('../session')(socket.request, {}, next);
	});

	// Define all Events
	ioEvents(io);

	// The server object will be then used to list to a port number
	return server;
}

module.exports = init;