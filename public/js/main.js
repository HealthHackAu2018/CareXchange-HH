'use strict';

var app = {

  teams: function(){

    var socket = io('/teams', { transports: ['websocket'] });

    // When socket connects, get a list of chatteams
    socket.on('connect', function () {

      // Update teams list upon emitting updateTeamsList event
      socket.on('updateTeamsList', function(team) {

        // Display an error message upon a user error(i.e. creating a team with an existing title)
        $('.team-create p.message').remove();
        if(team.error != null){
          $('.team-create').append(`<p class="message error">${team.error}</p>`);
        }else{
          app.helpers.updateTeamsList(team);
        }
      });

      // Whenever the user hits the create button, emit createTeam event.
      $('.team-create button').on('click', function(e) {
        var inputEle = $("input[name='title']");
        var teamTitle = inputEle.val().trim();
        if(teamTitle !== '') {
          socket.emit('createTeam', teamTitle);
          inputEle.val('');
        }
      });
    });
  },

  teamchat: function(teamId, username){
    
    var socket = io('/teamchat', { transports: ['websocket'] });

      // When socket connects, join the current team chat
      socket.on('connect', function () {

        socket.emit('join', teamId);

        // Update users list upon emitting updateUsersList event
        socket.on('updateUsersList', function(users, clear) {

          $('.container p.message').remove();
          if(users.error != null){
            $('.container').html(`<p class="message error">${users.error}</p>`);
          }else{
            app.helpers.updateUsersList(users, clear);
          }
        });

        // Whenever the user hits the save button, emit newMessage event.
        $(".chat-message button").on('click', function(e) {

          var textareaEle = $("textarea[name='message']");
          var messageContent = textareaEle.val().trim();
          if(messageContent !== '') {
            var message = { 
              content: messageContent, 
              username: username,
              date: Date.now()
            };

            socket.emit('newMessage', teamId, message);
            textareaEle.val('');
            app.helpers.addMessage(message);
          }
        });

        // Whenever a user leaves the current team, remove the user from users list
        socket.on('removeUser', function(userId) {
          $('li#user-' + userId).remove();
          app.helpers.updateNumOfUsers();
        });

        // Append a new message 
        socket.on('addMessage', function(message) {
          app.helpers.addMessage(message);
        });
      });
  },

  helpers: {

    encodeHTML: function (str){
      return $('<div />').text(str).html();
    },

    // Update teams list
    updateTeamsList: function(team){
      team.title = this.encodeHTML(team.title);
      team.title = team.title.length > 25? team.title.substr(0, 25) + '...': team.title;
      var html = `<a href="/#/team/${team._id}"><li class="team-item">${team.title}</li></a>`;

      if(html === ''){ return; }

      if($(".team-list ul li").length > 0){
        $('.team-list ul').prepend(html);
      }else{
        $('.team-list ul').html('').html(html);
      }
      
      this.updateNumOfTeams();
    },

    // Update users list
    updateUsersList: function(users, clear){
        if(users.constructor !== Array){
          users = [users];
        }

        var html = '';
        for(var user of users) {
          user.username = this.encodeHTML(user.username);
          html += `<li class="clearfix" id="user-${user._id}">
                     <img src="${user.picture}" alt="${user.username}" />
                     <div class="about">
                        <div class="name">${user.username}</div>
                        <div class="status"><i class="fa fa-circle online"></i> online</div>
                     </div></li>`;
        }

        if(html === ''){ return; }

        if(clear != null && clear == true){
          $('.users-list ul').html('').html(html);
        }else{
          $('.users-list ul').prepend(html);
        }

        this.updateNumOfUsers();
    },

    // Adding a new message to chat history
    addMessage: function(message){
      message.date      = (new Date(message.date)).toLocaleString();
      message.username  = this.encodeHTML(message.username);
      message.content   = this.encodeHTML(message.content);

      var html = `<li>
                    <div class="message-data">
                      <span class="message-data-name">${message.username}</span>
                      <span class="message-data-time">${message.date}</span>
                    </div>
                    <div class="message my-message" dir="auto">${message.content}</div>
                  </li>`;
      $(html).hide().appendTo('.chat-history ul').slideDown(200);

      // Keep scroll bar down
      $(".chat-history").animate({ scrollTop: $('.chat-history')[0].scrollHeight}, 1000);
    },

    // Update number of teams
    // This method MUST be called after adding a new team
    updateNumOfTeams: function(){
      var num = $('.team-list ul li').length;
      $('.team-num-teams').text(num +  " Team(s)");
    },

    // Update number of online users in the current team
    // This method MUST be called after adding, or removing list element(s)
    updateNumOfUsers: function(){
      var num = $('.users-list ul li').length;
      $('.chat-num-users').text(num +  " User(s)");
    }
  }
};
