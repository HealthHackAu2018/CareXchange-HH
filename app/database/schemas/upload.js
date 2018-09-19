'use strict';

var Mongoose  = require('mongoose');

/**
 * Upload schema
 */
var UploadSchema = new Mongoose.Schema({
    dwid: { type: String, required: true },
    filename: { type: String, required: true },
    filetype: { type: String, required: true },
    serverfilename: { type: String, required: true },
    serverfilepath: { type: String, required: true },
    expirytime: { type: Date, required: true }
});

var UploadModel = Mongoose.model('Upload', UploadSchema);

module.exports = UploadModel;