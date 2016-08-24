require('events');
var tl = require('./timeleft.js');
var moment = require('moment');
require('moment-precise-range-plugin');
var ircClient;
var Discord = require('discord.js');
var tokenJSON = require('./json/discord_token.json');
var dsClient = new Discord.Client();
var dsActive = false;
var channel;

var endTime = new Date("August 27, 2016 01:00:00 UTC");
var event1 = "Ludum Dare begins in";
var event2 = ".";

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
        else if (message.channel == dsClient.servers.get("name", "Stencyl").channels.get("name", "dinosaurs")) {
            ircClient.emit('dsMessage',message.author.name, message.content);
        }
        //if the message is not from a bot, a PM, or from THIS client (also a bot), parse it for commands...
        else {
            parseMessage(message.server,message.channel,message.author,message.cleanContent);
            return;
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

//pulls message information and checks for commands, etc...
function parseMessage(server,source,author,content) {
    var arrText = content.split(" ");
    if (arrText[0][0]!= '!')
		return;
    if (arrText[0]=="!time") {
		var diff = moment.preciseDiff(endTime,moment());
		dsClient.sendMessage(source, event1 + " " + diff + event2);
		return;
	}
    if(arrText[0]=="!settime") {
		if(!isAdmin(author)) { return; }
		else {
		//endTime = new Date("August 27, 2016 01:00:00 UTC");
		dsClient.sendMessage(source, "Changing target time to: " + arrText[1] + " " + arrText[2] + " " + arrText[3] + " " + arrText[4] + " " + arrText[5]);
		endTime = new Date(arrText[1] + " " + arrText[2] + " " + arrText[3] + " " + arrText[4] + " " + arrText[5]);
		return;
		}
	}
	if(arrText[0]=="!endtime") {
		dsClient.sendMessage(source, "Current end time is set to " + endTime);
		return;
	}
	if(arrText[0]=="!sethours") {
		if(!isAdmin(author)) { return; }
		else {
			endTime = new Date();
			endTime.setTime(endTime.getTime() + (parseInt(arrText[1])*60*60*1000));
			dsClient.sendMessage(source, "Time is now " + endTime);
			return;
		}
	}
	if(arrText[0]=="!setevent1" && isAdmin(author)) {
		event1 = "";
		for(var i=1; i < arrText.length; i++) {
			event1 += arrText[i];
			if(i != arrText.length-1) { event1 += " "; }
		}
		dsClient.sendMessage(source,"Event1 description changed to " + event1);
		return;
	}
	if(arrText[0]=="!setevent2" && isAdmin(author)) {
		event2 = "";
		//this is just so we can put immediate puncuation at the end without the leading space needed for words
		if(arrText[1]=="." || arrText[1]=="?" || arrText[1]=="!") {
			event2 = arrText[1];
			return;
		}
		for(var i=1; i < arrText.length; i++) {
			if(i == 1) { event2 += " "; }
			event2 += arrText[i];
			if(i != arrText.length-1) { event2 += " "; }
		}
		dsClient.sendMessage(source,"Event2 description changed to " + event2);
		return;
	}
}

//TODO set up admin check via Discord roles
function isAdmin(user) {
    var opRole = dsClient.servers.get("name", "Stencyl").roles.get("name","operator");
    if ( user.hasRole(opRole)) { return true; }
    else return false;
}