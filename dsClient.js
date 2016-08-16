require('events');
var tl = require('./timeleft.js');
var ircClient;
var Discord = require('discord.js');
var tokenJSON = require('./json/discord_token.json');
var dsClient = new Discord.Client();
var dsActive = false;
var channel;

exports.dsStart = function(client) {
    ircClient = client;
    dsClient.on('message', function(message) {
        if(message.author.bot) return;
	    //if(message.content === "ping") {
		//    dsClient.reply(message, "pong");
	    //}
        if (message.channel.isPrivate) {
                //console.log('(Private) ${message.author.name}: ${message.content}');
                return;
        }
        else if (message.author.id == dsClient.user.id){
            //do nothing because it's ourself
            return;
        }
        else {
               //console.log('(${message.server.name} / ${message.channel.name}) ${message.author.name}: ${message.content}');
               if(message.channel == dsClient.servers.get("name", "Stencyl").channels.get("name", "dinosaurs")) {
                   ircClient.emit('dsMessage',message.author.name, message.content);
               }
        }
    });


    dsClient.loginWithToken(tokenJSON.token, output);

    function output(error, token) {
            if (error) {
                    console.log('There was an error logging in: ' + error);
                    return;
            } else
                    console.log('Logged in. Token: ' + token);
                    dsActive = true;
    }
}

exports.dsIrcToDiscord = function(from, message) {
    if(dsActive) {
        channel = dsClient.servers.get("name", "Stencyl").channels.get("name", "dinosaurs");
        dsClient.sendMessage(channel,"<" + from + "> " + message);
        return;
    }
}
