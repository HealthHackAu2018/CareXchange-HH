'use strict';

var uploadModel = require('../database').models.upload;

var create = function (data, callback){
	var newUpload = new uploadModel(data);
	newUpload.save(callback);
};

var find = function (data, callback){
    uploadModel.find(data, callback);
}

var findOne = function (data, callback){
	uploadModel.findOne(data, callback);
}

var findById = function (id, callback){
	uploadModel.findById(id, callback);
}

module.exports = { 
    create,
    find,
    findOne,
	findById
};
