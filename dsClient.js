"use strict";

require('events');
const os = require('os');
var moment = require('moment');
require('moment-precise-range-plugin');
var Discord = require('discord.js');
var tokenJSON = require('./json/discord_token.json');
var dsClient = new Discord.Client();
var dsActive = false;
var postTweets = true;
var tweetChannel;
var sharedEmitter;

var endTime = new Date("October 16, 2016 07:00:00 EDT");
var event1 = "StencylJam '16 ends in";
var event2 = ". The theme is 'Spooky!'.";

exports.dsStart = function(emitter) {

	sharedEmitter = emitter;
	sharedEmitter.on('dsTweet', tweet => {
		if(dsActive) {
			if(postTweets) {
				var mediaURL = "";
				console.log(tweet);
				//console.log("trying to post in discord");
				if(tweet.entities.media.length > 0) {
					mediaURL = os.EOL + tweet.entities.media[0].media_url; 
				}
				//We wrap the URL in <> so Discord doesn't embed the tweet - it comes out really ugly most of the time.
				tweetChannel.sendMessage(
					"New by: " + tweet.user.screen_name
					+ os.EOL + tweet.text
					+ os.EOL + "<https://twitter.com/"
					+ tweet.user.screen_name
					+ "/status/"
					+ tweet.id_str
					+ ">"
					+ mediaURL
				);
			}
		}
		return;
	});

	dsClient.on('error', (error) => {
		console.log(error);
	});

	dsClient.on('ready', () => {
		console.log("Discord client ready.");
		dsActive=true;
		tweetChannel = dsClient.guilds.find("name","Stencyl").channels.find("name","tweets");
		sharedEmitter.emit('dsReady');
	});

    dsClient.on('message', message => {
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
        //if the message is not from a bot, a PM, or from THIS client (also a bot), parse it for commands...
        else {
            parseMessage(message.guild,message.channel,message.member,message.content);
            return;
        }
    });

   dsClient.login(tokenJSON.token);
}

//pulls message information and checks for commands, etc...
function parseMessage(guild,source,author,content) {
    var arrText = content.split(" ");
    if (arrText[0][0]!= '!')
		return;
    if (arrText[0]=="!time") {
		var diff = moment.preciseDiff(endTime,moment());
		source.sendMessage(event1 + " " + diff + event2);
		return;
	}
    if(arrText[0]=="!settime") {
		if(!isAdmin(author)) { return; }
		else {
		//endTime = new Date("August 27, 2016 01:00:00 UTC");
		source.sendMessage("Changing target time to: " + arrText[1] + " " + arrText[2] + " " + arrText[3] + " " + arrText[4] + " " + arrText[5]);
		endTime = new Date(arrText[1] + " " + arrText[2] + " " + arrText[3] + " " + arrText[4] + " " + arrText[5]);
		return;
		}
	}
	if(arrText[0]=="!endtime") {
		source.sendMessage("Current end time is set to " + endTime);
		return;
	}
	if(arrText[0]=="!sethours") {
		if(!isAdmin(author)) { return; }
		else {
			endTime = new Date();
			endTime.setTime(endTime.getTime() + (parseInt(arrText[1])*60*60*1000));
			source.sendMessage("Time is now " + endTime);
			return;
		}
	}
	if(arrText[0]=="!setevent1" && isAdmin(author)) {
		event1 = "";
		for(var i=1; i < arrText.length; i++) {
			event1 += arrText[i];
			if(i != arrText.length-1) { event1 += " "; }
		}
		source.sendMessage("Event1 description changed to " + event1);
		return;
	}
	if(arrText[0]=="!setevent2" && isAdmin(author)) {
		event2 = "";
		//this is just so we can put immediate puncuation at the end without the leading space needed for words
		if(arrText[1]=="." || arrText[1]=="?" || arrText[1]=="!") {
			event2 = arrText[1];
			for(var i=2; i < arrText.length; i++) {
				if(i == 2) { event2 += " "; }
				event2 += arrText[i];
				if(i != arrText.length-1) { event2 += " "; }
			}
			source.sendMessage("Event2 description changed to " + event2);
			return;
		}
		for(var i=1; i < arrText.length; i++) {
			if(i == 1) { event2 += " "; }
			event2 += arrText[i];
			if(i != arrText.length-1) { event2 += " "; }
		}
		source.sendMessage("Event2 description changed to " + event2);
		return;
	}
	if(arrText[0]=="!ping") {
		source.sendMessage("Pong!");
		return;
	}
	if(arrText[0]=="!echo" && isAdmin(author)) {
		source.sendMessage("Echoing: " + content);
		return;
	}
	if(arrText[0]=="!tweetstatus") {
		source.sendMessage("Tweet streaming is currently " + postTweets);
		return;
	}
	if(arrText[0]=="!tweettoggle" && isAdmin(author)) {
		postTweets = !postTweets;
		source.sendMessage("Tweet streaming is now " + postTweets);
		return;
	}
}

//Checks if a member has the "operator" role
function isAdmin(member) {
    var opRole = dsClient.guilds.find("name", "Stencyl").roles.find("name","operator");
	if ( member.roles.has(opRole.id)) {
		return true;
	}
    else return false;
}