angular.module('Controllers',[])
.directive('scrollBottom', function () {		// custom directive for scrolling bottom on new message load
  return {
    scope: {
      scrollBottom: "="
    },
    link: function (scope, element) {
      scope.$watchCollection('scrollBottom', function (newValue) {
        if (newValue)
        {
          $(element).scrollTop($(element)[0].scrollHeight);
        }
      });
    }
  }
})
.directive('ngEnter', function () {			// custom directive for sending message on enter click
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngEnter);
                });
                event.preventDefault();
            }
        });
    };
})
.directive('focusMe', function($timeout) {		// custom directive for focusing on message sending input box
    return {
        link: function(scope, element, attrs) {
          scope.$watch(attrs.focusMe, function(value) {
            if(value === true) { 
              $timeout(function() {
                element[0].focus();
                scope[attrs.focusMe] = false;
              });
            }
          });
        }
    };
})
.controller('teamChatCtrl', function ($scope, $rootScope, $location, $http, Upload, $timeout, sendImageService){		// Chat Page Controller
	var url = $location.path().split('/');
	$scope.teamId = url[2];
	$scope.socket = io('/teamchat', { transports: ['websocket'] });
	$scope.isMsgBoxEmpty = false;
	$scope.isFileSelected = false;
	$scope.isMsg = false;
	$scope.setFocus = true;
	$scope.chatMsg = "";
	$scope.typingMsg = "";
	$scope.teamModel = "Social";
	$scope.users = [];
	$scope.typing = [];
	$scope.messages = [];

	
	// redirection if user is not logged in.
	if(!$rootScope.loggedIn){
		$location.path('/login');
	}

	$scope.updateMode = function() {
		console.log($scope.teamModel);
	};

// ====================================== XYZ is typing =================================
	
	$scope.textChanged = function() {
		if ($scope.chatMsg.length > 0) emitTyping()
		else emitEmpty();
	};

	function emitTyping() {
		$scope.socket.emit('typing', $scope.teamId);
	};

	function emitEmpty() {
		$scope.socket.emit('empty', $scope.teamId);
	};

	function buildTypingMsg() {
		console.log($scope.users);
		if ($scope.typing.length == 0) $scope.typingMsg = "";
		else {
			var names = [];
			for (var i = 0; i < $scope.typing.length; i++) {
				var userId = $scope.typing[i];
				for (var j = 0; j < $scope.users.length; j++) {
					var user = $scope.users[j];
					console.log(user);
					if (user._id == userId) names.push(user.username);
				}
			}
			var suffix = " is typing";
			var usersMsg = names[0];
			if (names.length > 1) {
				suffix = " are typing"; 
				for (var i = 1; i < names.length-1; i++) {
					usersMsg += ", " + names[i];
				}
				usersMsg += " and " + names[names.length-1];
			}

			$scope.typingMsg = usersMsg + suffix;
		}
		$scope.$apply();
	};
	
	$scope.socket.on("notifyTyping", function(data){
		if (data == $rootScope.currentUser._id) return;
		if (!$scope.typing.includes(data)) $scope.typing.push(data);
		console.log($scope.typing);
		buildTypingMsg();
	});

	$scope.socket.on("notifyEmpty", function(data){
		var index = $scope.typing.indexOf(data);
		if (index > -1) {
			$scope.typing.splice(index, 1);
		}
		buildTypingMsg();
	});

// ================================== Online Members List ===============================

	$scope.socket.emit('join', $scope.teamId);
	$scope.socket.on("updateUsersList", function(data){
		console.log("USERS");
		console.log(data);
		if (data.title) {
			$scope.title = data.title;
			$scope.users = data.users;
			// for (var i = 0; i < data.users.length; i++){
			// 	if ($scope.users.indexOf(data[i]) == -1) $scope.users.push(data[i]);
			// }
			if (data.prevMsgs){
				for (var i = 0; i < data.prevMsgs.length; i++) {
					var msg = data.prevMsgs[i];
					if(msg.username == $rootScope.username){
						msg.ownMsg = true;	
					}else{
						msg.ownMsg = false;
					}

					msg.msgTime = formatAMPM(new Date(msg.date));
					if (msg.msgTime == '12:NaN am')
						msg.msgTime = formatAMPM(ConvertToDatetime(msg.date));
					$scope.messages.push(msg);
				}
			}
		}
		//else if ($scope.users.indexOf(data) == -1) $scope.users.push(data);
		$scope.$apply();
		console.log($scope.users);
	});

// ================================== Common Functions ==================================    
	// device/desktop detection
	var isMobile = false;
    if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4)))
		isMobile = true;        

        if(isMobile){
        	var height = $( window ).height() * 0.7;
				$scope.setFocus = false;
				setTimeout(function(){ $('.direct-chat-messages').height(height); }, 1000);
        	$(window).on("resize", function () {
				var height = $( window ).height() * 0.7;
				$scope.setFocus = false;
				setTimeout(function(){ $('.direct-chat-messages').height(height); }, 1000);    
			});
        }else{
        	var height = $( document ).height() * 0.8;
			$('.direct-chat-messages').height(height);
        }
    // message time formatting into string    
	function formatAMPM(date) {
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var ampm = hours >= 12 ? 'pm' : 'am';
		hours = hours % 12;
		hours = hours ? hours : 12; // the hour '0' should be '12'
		minutes = minutes < 10 ? '0'+minutes : minutes;
		var strTime = hours + ':' + minutes + ' ' + ampm;
		return strTime;
	}
	// toggle online member list mobile
 	$scope.custom = true;
    $scope.toggleCustom = function() {
        $scope.custom = $scope.custom === false ? true: false;	
        if(!$scope.custom){
        	if(!angular.element(document.querySelector("#slidememberlist")).hasClass("slideout_inner_trans")){
        		angular.element(document.querySelector("#slidememberlist")).addClass("slideout_inner_trans");
        	}
        }else{
        	if (angular.element(document.querySelector("#slidememberlist")).hasClass("slideout_inner_trans")) {
        		angular.element(document.querySelector("#slidememberlist")).removeClass("slideout_inner_trans");        		
        	}
        }        
    };   

// ====================================== message Sending Code ============================
	// sending text message function
	$scope.sendMsg = function(){
		if ($scope.chatMsg) {
			$scope.isFileSelected = false;
			$scope.isMsg = true;
			//var dateString = formatAMPM(new Date());
			$scope.socket.emit("newMessage", $scope.teamId, { 
				username : $rootScope.username, 
				userPicture : $rootScope.userPicture, 
				msg : $scope.chatMsg, 
				hasMsg : $scope.isMsg , 
				hasFile : $scope.isFileSelected , 
				teamModel : $scope.teamModel, 
				date: Date.now() }, function(data){
					if (data.success == true) {
						$scope.setFocus = true;				
				}
			});
			$scope.chatMsg = "";
			$scope.textChanged();
		}else{
			$scope.isMsgBoxEmpty = true;
		}		
	}

	// recieving new text message
	$scope.socket.on("addMessage", function(data){
		console.log("new msg:");
		console.log(data);
		if(data.username == $rootScope.username){
			data.ownMsg = true;	
		}else{
			data.ownMsg = false;
		}
		data.msgTime = formatAMPM(new Date(data.date));
		$scope.$apply(function(){
			$scope.messages.push(data);
		});
	});

// ====================================== Image Sending Code ==============================
    $scope.$watch('imageFiles', function () {
        $scope.sendImage($scope.imageFiles);
    });

    //  opens the sent image on gallery_icon click
    $scope.openClickImage = function(msg){
		console.log("boop");
		if(!msg.ownMsg){
			console.log("beep");
			$http.post($rootScope.baseUrl + "/v1/getfile",msg).success(function (response){
				console.log("getfile resp");
				console.log(response);
				if(!response.isExpired){
					msg.showme = false;
					msg.serverfilename = msg.serverfilename;
				}else{
					var html = '<p id="alert">'+ response.expmsg +'</p>';
					if ($( ".chat-box" ).has( "p" ).length < 1) {
						$(html).hide().prependTo(".chat-box").fadeIn(1500);
						$('#alert').delay(1000).fadeOut('slow', function(){
							$('#alert').remove();
						});
					}
				}
			});	
		}
	};
	
	function ConvertToDatetime(dateValue) {
		var regex = /-?\d+/;
		  var match = regex.exec(dateValue);
		  if (match != null)
			  return new Date(parseInt(match[0]));
		  else return "";
	  }
    
    // recieving new image message
    $scope.socket.on("addImageMessage", function(data){
		$scope.showme = true;
		console.log("addIM");
		console.log(data);
		data.msgTime = formatAMPM(ConvertToDatetime(data.date));
		if(data.username == $rootScope.username){
			data.ownMsg = true;	
			//data.dwimgsrc = "app/images/spin.gif";	
		}else{
			data.ownMsg = false;
		}
		if((data.username == $rootScope.username) && data.repeatMsg){
			//checkmessagesImage(data);
			$scope.messages.push(data);
		}else{
			$scope.messages.push(data);
		}
		$scope.$apply();
	});

	// replacing spinning wheel in sender message after image message delivered to everyone.
	function checkmessagesImage(msg){
		for (var i = ($scope.messages.length-1); i >= 0 ; i--) {
			if($scope.messages[i].hasFile){
				if ($scope.messages[i].istype === "image") {
					if($scope.messages[i].dwid === msg.dwid){
						$scope.messages[i].showme = false;
						$scope.messages[i].filename = msg.filename;
						$scope.messages[i].size = msg.size;
						$scope.messages[i].imgsrc = msg.serverfilename;
						$scope.messages[i].serverfilename = msg.serverfilename;
						break;	
					}
				}						
			}
		};
	}

	// validate file type to image function
	$scope.validateImage = function(file){
		var filetype = file.type.substring(0,file.type.indexOf('/'));
		if (filetype == "image") {
			return true;
		}else{
			var html = '<p id="alert">Select Images.</p>';
			if ($( ".chat-box" ).has( "p" ).length < 1) {
				$(html).hide().prependTo(".chat-box").fadeIn(1500);
				$('#alert').delay(1000).fadeOut('slow', function(){
					$('#alert').remove();
				});
			}	
			return false;
		}
	}

	// download image if it exists on server else return error message
	$scope.downloadImage = function(ev, elem){
		console.log("download beep");
		var search_id = elem.id;
    	for (var i = ($scope.messages.length-1); i >= 0 ; i--) {
			if($scope.messages[i].hasFile){
				if ($scope.messages[i].istype === "image") {
					if($scope.messages[i].dwid === search_id){
						$http.post($rootScope.baseUrl + "/v1/getfile",$scope.messages[i]).success(function (response){
							console.log(response);
							console.log(search_id);
					    	if(!response.isExpired){
					    		var linkID = "#" + search_id + "A";
								//$(linkID).find('i').click();
								$(linkID).click();
					    		return true;
					    	}else{
					    		var html = '<p id="alert">'+ response.expmsg +'</p>';
								if ($( ".chat-box" ).has( "p" ).length < 1) {
									$(html).hide().prependTo(".chat-box").fadeIn(1500);
									$('#alert').delay(1000).fadeOut('slow', function(){
										$('#alert').remove();
									});
								}	
								return false;
					    	}
					    });				
						break;	
					}
				}						
			}
		};
    }

    // sending new images function
    $scope.sendImage = function (files) {
        if (files && files.length) {
        	$scope.isFileSelected = true;
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                var DWid = $rootScope.username + "dwid" + Date.now();
                var fd = new FormData();
    			fd.append('file', file);
        		fd.append('username', $rootScope.username);
        		fd.append('userPicture', $rootScope.userPicture);
        		fd.append('hasFile', $scope.isFileSelected);
        		fd.append('isImageFile', true);
				fd.append('istype', "image");        		
				fd.append('showme', true);
				fd.append('dwimgsrc', "app/images/gallery_icon5.png");
				fd.append('dwid', DWid);
				fd.append('teamModel', $scope.teamModel);
				fd.append('date', Date.now());
				fd.append('filename', file.name);
				$http.post($rootScope.baseUrl +"/v1/uploadImage", fd, {
		            transformRequest: angular.identity,
		            headers: { 'Content-Type': undefined }
		        }).then(function (response) {
					console.log("\o/");
					console.log(response);
					$scope.socket.emit('newMessage',$scope.teamId,response.data, function(data){
						if (data.success == true) {
							$scope.setFocus = true;				
						}
					});
		        });
            }
        }
    };

// =========================================== Audio Sending Code =====================
    $scope.$watch('audioFiles', function () {
        $scope.sendAudio($scope.audioFiles);
    });

    //  opens the sent audio file on audio_icon click on new window
    $scope.openClickAudio = function(msg){
    	$http.post($rootScope.baseUrl + "/v1/getfile",msg).success(function (response){
	    	if(!response.isExpired){
	    		window.open($rootScope.baseUrl +'/'+response.serverfilename, "_blank");
	    	}else{	    		
		    		var html = '<p id="alert">'+ response.expmsg +'</p>';
				if ($( ".chat-box" ).has( "p" ).length < 1) {
					$(html).hide().prependTo(".chat-box").fadeIn(1500);
					$('#alert').delay(1000).fadeOut('slow', function(){
						$('#alert').remove();
					});
				}
	    	}
	    });	
	}

	// recieving new audio message
    $scope.socket.on("addAudioMessage", function(data){
		if(data.username == $rootScope.username){
			data.ownMsg = true;
			data.dwimgsrc = "app/images/spin.gif";
		}else{
			data.ownMsg = false;
		}
		if((data.username == $rootScope.username) && data.repeatMsg){	
			checkmessagesAudio(data);
		}else{
			$scope.messages.push(data);
		}
	});

	// replacing spinning wheel in sender message after audio message delivered to everyone.
	function checkmessagesAudio(msg){
		for (var i = ($scope.messages.length-1); i >= 0 ; i--) {
			if($scope.messages[i].hasFile){
				if ($scope.messages[i].istype === "audio") {					
					if($scope.messages[i].dwid === msg.dwid){
						$scope.messages[i].showme = true;
						$scope.messages[i].serverfilename = msg.serverfilename;
						$scope.messages[i].filename = msg.filename;
						$scope.messages[i].size = msg.size;
						$scope.messages[i].dwimgsrc = "app/images/audioplay_icon.png";
						break;	
					}
				}						
			}
		};
	}

	// download audio file if it exists on server else return error message
	$scope.downloadAudio = function(ev, elem){
		var search_id = elem.id;
    	for (var i = ($scope.messages.length-1); i >= 0 ; i--) {
			if($scope.messages[i].hasFile){
				if ($scope.messages[i].istype === "audio") {
					if($scope.messages[i].dwid === search_id){
						$http.post($rootScope.baseUrl + "/v1/getfile",$scope.messages[i]).success(function (response){
					    	if(!response.isExpired){
					    		var linkID = "#" + search_id + "A";
					    		$(linkID).find('i').click();
					    		return true;
					    	}else{
					    		var html = '<p id="alert">'+ response.expmsg +'</p>';
								if ($( ".chat-box" ).has( "p" ).length < 1) {
									$(html).hide().prependTo(".chat-box").fadeIn(1500);
									$('#alert').delay(1000).fadeOut('slow', function(){
										$('#alert').remove();
									});
								}
								return false;
					    	}
					    });				
						break;	
					}
				}						
			}
		};
    }

    // validate file type to 'audio file' function
	$scope.validateMP3 = function(file){
		if (file.type == "audio/mp3" || file.type == "audio/mpeg") {
			return true;
		}else{
			var html = '<p id="alert">Select MP3.</p>';
			if ($( ".chat-box" ).has( "p" ).length < 1) {
				$(html).hide().prependTo(".chat-box").fadeIn(1500);
				$('#alert').delay(1000).fadeOut('slow', function(){
					$('#alert').remove();
				});
			}
			return false;
		}
	}    

	// sending new 'audio file' function
    $scope.sendAudio = function (files) {
        if (files && files.length) {
        	$scope.isFileSelected = true;
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                var DWid = $rootScope.username + "dwid" + Date.now();
                var fd = new FormData();
    			fd.append('file', file);
        		fd.append('username', $rootScope.username);
        		fd.append('userPicture', $rootScope.userPicture);
        		fd.append('hasFile', $scope.isFileSelected);
        		fd.append('isAudioFile', true);
				fd.append('istype', "audio");        		
				fd.append('showme', false);
				fd.append('dwimgsrc', "app/images/audioplay_icon.png");
				fd.append('dwid', DWid);
				fd.append('teamModel', $scope.teamModel);
				fd.append('date', Date.now());
				fd.append('filename', file.name);
				$http.post('/v1/uploadAudio', fd, {
		            transformRequest: angular.identity,
		            headers: { 'Content-Type': undefined }
		        }).then(function (response) {
					$scope.socket.emit("newMessage", $scope.teamId, response, function(data){
						if (data.success == true) {
							$scope.setFocus = true;				
						}
					});
				});    
            }
        }
    };

//==================================== Doc Sending Code ==============================
    $scope.$watch('PDFFiles', function () {
    	var file = $scope.PDFFiles;
        $scope.sendPDF($scope.PDFFiles);
    });

    //  download the document file on doc_icon click 
    $scope.openClickPDF = function(msg){
    	$http.post($rootScope.baseUrl + "/v1/getfile",msg).success(function (response){
	    	if(!response.isExpired){
	    		window.open($rootScope.baseUrl+'/'+response.serverfilename, "_blank");
	    	}else{
	    		var html = '<p id="alert">'+ response.expmsg +'</p>';
	    		if ($( ".chat-box" ).has( "p" ).length < 1) {
					$(html).hide().prependTo(".chat-box").fadeIn(1500);
					$('#alert').delay(1000).fadeOut('slow', function(){
						$('#alert').remove();
					});
				}
	    	}
	    });
	}

	// recieving new document message
	$scope.socket.on("addDocMessage", function(data){
		if(data.username == $rootScope.username){
			data.ownMsg = true;
			data.dwimgsrc = "app/images/spin.gif";
		}else{
			data.ownMsg = false;
		}
		if((data.username == $rootScope.username) && data.repeatMsg){	
			checkmessagesPDF(data);
		}else{
			$scope.messages.push(data);
		}
	});

	// replacing spinning wheel in sender message after document message delivered to everyone.
	function checkmessagesPDF(msg){
		for (var i = ($scope.messages.length-1); i >= 0 ; i--) {
			if($scope.messages[i].hasFile){
				if ($scope.messages[i].istype === "PDF") {
					if($scope.messages[i].dwid === msg.dwid){
						$scope.messages[i].showme = true;
						$scope.messages[i].serverfilename = msg.serverfilename;
						$scope.messages[i].filename = msg.filename;
						$scope.messages[i].size = msg.size;
						$scope.messages[i].dwimgsrc = "app/images/doc_icon.png";
						break;	
					}
				}						
			}
		};
	}
	
	// validate file type to 'document file' function
	$scope.validatePDF = function(file){
		if (file.type == "application/pdf" || file.type == "application/msword" || file.type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.type == "text/plain" || file.type == "application/vnd.ms-excel") {
			return true;
		}else{
			var html = '<p id="alert">Select pdf/excel/doc.</p>';
			if ($( ".chat-box" ).has( "p" ).length < 1) {
				$(html).hide().prependTo(".chat-box").fadeIn(1500);
				$('#alert').delay(1000).fadeOut('slow', function(){
					$('#alert').remove();
				});
			}
			return false;
		}
	}

	// download document file if it exists on server else return error message
	$scope.downloadPDF = function(ev, elem){
		var search_id = elem.id;
    	for (var i = ($scope.messages.length-1); i >= 0 ; i--) {
			if($scope.messages[i].hasFile){
				if ($scope.messages[i].istype === "PDF") {
					if($scope.messages[i].dwid === search_id){
						$http.post($rootScope.baseUrl + "/v1/getfile",$scope.messages[i]).success(function (response){
					    	if(!response.isExpired){
					    		var linkID = "#" + search_id + "A";
					    		$(linkID).find('i').click();
					    		return true;
					    	}else{
					    		var html = '<p id="alert">'+ response.expmsg +'</p>';
								if ($( ".chat-box" ).has( "p" ).length < 1) {
									$(html).hide().prependTo(".chat-box").fadeIn(1500);
									$('#alert').delay(1000).fadeOut('slow', function(){
										$('#alert').remove();
									});
								}
								return false;
					    	}
					    });				
						break;	
					}
				}						
			}
		};
    }

    // sending new 'document file' function
    $scope.sendPDF = function (files) {
        if (files && files.length) {
        	$scope.isFileSelected = true;
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                var DWid = $rootScope.username + "dwid" + Date.now();
                var fd = new FormData();
    			fd.append('file', file);
        		fd.append('username', $rootScope.username);
        		fd.append('userPicture', $rootScope.userPicture);
        		fd.append('hasFile', $scope.isFileSelected);
        		fd.append('isPDFFile', true);
				fd.append('istype', "PDF");        		
				fd.append('showme', false);
				fd.append('dwimgsrc', "app/images/doc_icon.png");
				fd.append('dwid', DWid);
				fd.append('teamModel', $scope.teamModel);
				fd.append('date', Date.now());
				fd.append('filename', file.name);
				$http.post("/v1/uploadPDF", fd, {
		            transformRequest: angular.identity,
		            headers: { 'Content-Type': undefined }
		        }).then(function (response) {
		            $scope.socket.emit('newMessage',$scope.teamId,response, function(data){
						if (data.success == true) {
							$scope.setFocus = true;				
						}
					});
		        });
            }
        }
    };

//==================================== Any File Upload ============================
    $scope.$watch('Files', function () {
        var filetype = $scope.catchFile($scope.Files);
        if(filetype == "document"){
        	$scope.sendPDF($scope.Files);
        }else if(filetype == "audio"){
        	$scope.sendAudio($scope.Files);
        }else if(filetype == "image"){
        	$scope.sendImage($scope.Files);
        }else if(filetype == "invalid format"){
        	var html = '<p id="alert">Invalid file format.</p>';
        	if ($( ".chat-box" ).has( "p" ).length < 1) {
				$(html).hide().prependTo(".chat-box").fadeIn(1500);
				$('#alert').delay(1000).fadeOut('slow', function(){
					$('#alert').remove();
				});
			}
        }    
    });

    // function for checking file type
    $scope.catchFile = function (files){
    	if (files && files.length) {
        	$scope.isFileSelected = true;
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (file.type == "application/pdf" || file.type == "application/msword" || file.type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.type == "text/plain" || file.type == "application/vnd.ms-excel") {
					return "document";
				}else if(file.type == "audio/mp3" || file.type == "audio/mpeg"){
					return "audio";
				}else{
					var filetype = file.type.substring(0,file.type.indexOf('/'));
					if (filetype == "image") {
						return "image";
					}else{
						return "invalid format";
					}
				}

            }
        }
    }

})
