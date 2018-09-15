'use strict';

var Mongoose  = require('mongoose');

/**
 * Message schema
 */
var MessageSchema = new Mongoose.Schema({
    teamId: { type: String, required: true },
    message: { type: { username: String, content: String, date: Date }},
});

var messageModel = Mongoose.model('message', MessageSchema);

module.exports = messageModel;