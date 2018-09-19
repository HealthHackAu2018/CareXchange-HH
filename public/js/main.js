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

    // Update number of teams
    updateNumOfTeams: function(){
      var num = $('.team-list ul li').length;
      $('.team-num-teams').text(num +  " Team(s)");
    },

  }
};
