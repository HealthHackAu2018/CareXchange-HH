'use strict';

var express	 	= require('express');
var router 		= express.Router();
var passport 	= require('passport');
var formidable = require('formidable');	

var User = require('../models/user');
var Team = require('../models/team');
var Db = require('../database');

var files_array  = [];
var expiryTime = 8;

// Home page
router.get('/login', function(req, res, next) {
	// If user is already logged in, then redirect to teams page
	if(req.isAuthenticated()){
		res.redirect('/teams');
	}
	else{
		res.render('login', {
			success: req.flash('success')[0],
			errors: req.flash('error'), 
			showRegisterForm: req.flash('showRegisterForm')[0]
		});
	}
});

// Login
router.post('/login', passport.authenticate('local', { 
	successRedirect: '/teams', 
	failureRedirect: '/login',
	failureFlash: true
}));

// Register via username and password
router.post('/register', function(req, res, next) {

	var credentials = {'username': req.body.username, 'password': req.body.password };

	if(credentials.username === '' || credentials.password === ''){
		req.flash('error', 'Missing credentials');
		req.flash('showRegisterForm', true);
		res.redirect('/');
	}else{

		// Check if the username already exists for non-social account
		User.findOne({'username': new RegExp('^' + req.body.username + '$', 'i'), 'socialId': null}, function(err, user){
			if(err) throw err;
			if(user){
				req.flash('error', 'Username already exists.');
				req.flash('showRegisterForm', true);
				res.redirect('/');
			}else{
				User.create(credentials, function(err, newUser){
					if(err) throw err;
					req.flash('success', 'Your account has been created. Please log in.');
					res.redirect('/');
				});
			}
		});
	}
});



// Social Authentication routes
// 1. Login via Facebook
router.get('/auth/facebook', passport.authenticate('facebook'));
router.get('/auth/facebook/callback', passport.authenticate('facebook', {
		successRedirect: '/teams',
		failureRedirect: '/',
		failureFlash: true
}));

// 2. Login via Twitter
router.get('/auth/twitter', passport.authenticate('twitter'));
router.get('/auth/twitter/callback', passport.authenticate('twitter', {
		successRedirect: '/teams',
		failureRedirect: '/',
		failureFlash: true
}));

// Teams
router.get('/teams', [User.isAuthenticated, function(req, res, next) {
	Team.find(function(err, teams){
		if(err) throw err;
		res.render('teams', { teams });
	});
}]);

// Privacy policy
router.get('/privacy', function(req, res, next) {
	res.render('privacy', {  });
});

// Logout
router.get('/logout', function(req, res, next) {
	// remove the req.user property and clear the login session
	req.logout();

	// destroy session data
	req.session = null;

	// redirect to homepage
	res.redirect('/');
});

// route for checking login status
router.get("/loggedin", function(req, res) {
	res.send(req.isAuthenticated() ? req.user : '0');
  });
  
// route for uploading images asynchronously
router.post('/v1/uploadImage',function (req, res){
	var imgdatetimenow = Date.now();
	var form = new formidable.IncomingForm({
		uploadDir: __dirname + '../../../public/app/upload/images',
		keepExtensions: true
	});

	form.on('end', function() {
	res.end();
	});
	
	form.parse(req,function(err,fields,files){
		var data = { 
				username : fields.username, 
				userAvatar : fields.userAvatar, 
				repeatMsg : true, 
				hasFile : fields.hasFile, 
				isImageFile : fields.isImageFile, 
				istype : fields.istype, 
				showme : fields.showme, 
				dwimgsrc : fields.dwimgsrc, 
				dwid : fields.dwid,
				serverfilename : baseName(files.file.path), 
				msgTime : fields.msgTime,
				filename : files.file.name,
				size : bytesToSize(files.file.size)
		};
		var image_file = { 
				dwid : fields.dwid,
				filename : files.file.name,
				filetype : fields.istype,
				serverfilename : baseName(files.file.path),
				serverfilepath : files.file.path,
				expirytime : imgdatetimenow + (3600000 * expiryTime)           
		};
		files_array.push(image_file);
		socket.emit('addImageMessage', data);
	});
  });
  
  // route for uploading audio asynchronously
  router.post('/v1/uploadAudio',function (req, res){
	  var userName, useravatar, hasfile, ismusicfile, isType, showMe, DWimgsrc, DWid, msgtime;
	  var imgdatetimenow = Date.now();
	  var form = new formidable.IncomingForm({
			uploadDir: __dirname + '../../../public/app/upload/music',
			keepExtensions: true
		});
  
  
	  form.on('end', function() {
		res.end();
	  });
	  form.parse(req,function(err,fields,files){
		  console.log("files : ",files);
		  console.log("fields : ", fields);
		  var data = { 
				  username : fields.username, 
				  userAvatar : fields.userAvatar, 
				  repeatMsg : true, 
				  hasFile : fields.hasFile, 
				  isMusicFile : fields.isMusicFile, 
				  istype : fields.istype, 
				  showme : fields.showme, 
				  dwimgsrc : fields.dwimgsrc, 
				  dwid : fields.dwid,
				  serverfilename : baseName(files.file.path), 
				  msgTime : fields.msgTime,
				  filename : files.file.name,
				  size : bytesToSize(files.file.size)
		  };
		  var audio_file = { 
				  dwid : fields.dwid,
				  filename : files.file.name,
				  filetype : fields.istype,
				  serverfilename : baseName(files.file.path),
				  serverfilepath : files.file.path,
				  expirytime : imgdatetimenow + (3600000 * expiryTime)           
		  };
		  files_array.push(audio_file);
		  ios.sockets.emit('new message music', data);
	  });
  });
  
  // route for uploading document asynchronously
  router.post('/v1/uploadPDF',function (req, res){
	  var imgdatetimenow = Date.now();
	  var form = new formidable.IncomingForm({
			uploadDir: __dirname + '../../../public/app/upload/doc',
			keepExtensions: true
		});
  
	  form.on('end', function() {
		res.end();
	  });
	  form.parse(req,function(err,fields,files){
		  var data = { 
				  username : fields.username, 
				  userAvatar : fields.userAvatar, 
				  repeatMsg : true, 
				  hasFile : fields.hasFile, 
				  isPDFFile : fields.isPDFFile, 
				  istype : fields.istype, 
				  showme : fields.showme, 
				  dwimgsrc : fields.dwimgsrc, 
				  dwid : fields.dwid,
				  serverfilename : baseName(files.file.path), 
				  msgTime : fields.msgTime,
				  filename : files.file.name,
				  size : bytesToSize(files.file.size)
		  };
		  var pdf_file = { 
				  dwid : fields.dwid,
				  filename : files.file.name,
				  filetype : fields.istype,
				  serverfilename : baseName(files.file.path),
				  serverfilepath : files.file.path,
				  expirytime : imgdatetimenow + (3600000 * expiryTime)           
		  };
		  files_array.push(pdf_file);
		  ios.sockets.emit('new message PDF', data);
	  });
  });
  
  // route for checking requested file , does exist on server or not
  router.post('/v1/getfile', function(req, res){
	  var data = req.body.dwid;
	  var filenm = req.body.filename;
	  var dwidexist = false;
	  var req_file_data;
	  
	  for(var i = 0; i<files_array.length; i++)
	  {
		  if(files_array[i].dwid == data)
		  {
			  dwidexist = true;
			  req_file_data = files_array[i];
		  }
	  }
  
	  // CASE 1 : File Exists
	  if(dwidexist == true)
	  {
		  //CASE 2 : File Expired and Deleted
		  if(req_file_data.expirytime < Date.now())
		  {
			  var deletedfileinfo = { 
				  isExpired : true,
				  expmsg : "File has beed removed."
				  };
				  fs.unlink(req_file_data.serverfilepath, function(err){
						 if (err) {
							 return console.error(err);
					  }
						  res.send(deletedfileinfo);           
				  });
				 var index = files_array.indexOf(req_file_data);
				 files_array.splice(index,1);           
		  }else{
			  // CASE 3 : File Exist and returned serverfilename in response
			  var fileinfo = {
				  isExpired : false, 
				  filename : req_file_data.filename,            
				  serverfilename : req_file_data.serverfilename };
			  res.send(fileinfo);
		  }
	  }else{  
			  // CASE 4 : File Doesn't Exists.       
			  var deletedfileinfo = { 
					  isExpired : true,
					  expmsg : "File has beed removed."
			  };
			  res.send(deletedfileinfo);       
		  }
  });
  
  // Size Conversion
  function bytesToSize(bytes) {
	var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	if (bytes == 0) return 'n/a';
	var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
	if (i == 0) return bytes + ' ' + sizes[i]; 
	return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
  };
  //get file name from server file path
  function baseName(str)
  {
   var base = new String(str).substring(str.lastIndexOf('/') + 1);     
   return base;
  }

module.exports = router;