/// <reference path=".vscode/node.d.ts" />

var ircLib = require('irc');
var moment = require('moment');
require('moment-precise-range-plugin');
var fs = require('fs');
var Discord = require('discord.js');
var tokenJSON = require('./json/discord_token.json');

var userFile = './irc-hectate/users.json';
var userData = {};
var msgFile = './irc-hectate/messages.json';
var msgData = {};
var tarotFile = "./irc-hectate/json/tarot.json";
var tarotData = {};
var wordGameFile = './irc-hectate/json/word_clues.json';
var wordGameData = {};
var guessGameActive = false;
var guessWord = "";
var guessGameTimer = 300000; //5 minutes in milliseconds
var guessGameTimeout;

var endTime = new Date("August 26, 2016 21:00:00");
var event1 = "Ludum Dare begins in";
var event2 = ".";
var echoMode = false;
var echoAdmin = "Hectate";
var botName = "JinxBot";
var channel = "#stencyl";

//Local Launch config requires a couple of alterations to some variables.
//The starting path is different, so we point to the files where they are,
//and we change the bot's name, since JinxBot is probably running in-channel right now as well.
if (process.argv[2] == "l") {
	console.log("Local Launch detected, starting with alternate config.")
	userFile = 'users.json';
	msgFile = 'messages.json';
	tarotFile = './json/tarot.json';
	wordGameFile = './json/word_clues.json';
	botName = "LocalBot";
}

var saveFreq = 600000; //10 minutes in milliseconds
var msgFreq = 60000; //1 minute in milliseconds
var coffeeList = [	"a mug of black coffee",
					"a shot of espresso",
					"a foamy cappuccino",
					"a big latte",
					"a sweetened mocha",
					"a little cup of Turkish coffee",
					"a macchiato with caramel drizzled on top",
					"a strong Irish coffee",
					"a well-chilled, iced coffee",
					"one of those cups of coffee with the leaf design in the foam",
					"a cup of cream and sugar with a tiny hint of coffee in there somewhere like how Hectate's wife drinks it",
					"a caffeine pill and a glass of water because he's out of coffee at the moment",
					"a foam cup of re-warmed office 'coffee' from the bottom dregs of the 3:30 PM pot",
					"something almost, but not quite entirely unlike coffee",
					"a big cup of nope",
					"a recepticle of dihydrogen-oxide combined with a solution made from pulverized, charred seeds of the plant Coffea arabica, separated by a gravity-assist refinement sieve.",
					"a cup of live bait worms from the tacklebox. Yum.",
					"anti-coffee."
					];


//read the data file for users
fs.readFile(userFile, function (err, data) {
	if(err) throw err;
	userData = JSON.parse(data);
	console.log("User data loaded.");
});

//read the data file for messages
fs.readFile(msgFile, function (err, data) {
	if(err) {  console.log(err); throw err; }
	msgData = JSON.parse(data);
	console.log("Message data loaded.");
});

//read the data file for tarot descriptions
fs.readFile(tarotFile, function (err,data) {
	if(err) { console.log(err); throw err; }
	tarotData = JSON.parse(data);
	console.log("Tarot data loaded.");
});

//read the data file for word guess game
fs.readFile(wordGameFile, function (err,data) {
	if(err) { console.log(err); throw err; }
	wordGameData = JSON.parse(data);
	console.log("Word game data loaded.");
})


var client = new ircLib.Client('irc.esper.net', botName, {
	channels: [channel],
	floodProtection: true,
	autoRejoin: true,
});


var dsClient = new Discord.Client();
dsClient.on('message', function(message) {
	if(message.content === "ping") {
		dsClient.reply(message, "pong");
	}
});


dsClient.loginWithToken(tokenJSON.token, output);

function output(error, token) {
        if (error) {
                console.log('There was an error logging in: ' + error);
                return;
        } else
                console.log('Logged in. Token: ' + token);
}

var saveInterval = setInterval(saveData,saveFreq);
var msgInterval = setInterval(checkMessages,msgFreq);

//client.addListener('message', function (from, to, message) {
//	console.log(from + ' => ' + to + ': ' + message);
//});

client.addListener('quit', function(nick,reason,channel,message) {
	if(nick == echoAdmin) {
		echoMode = false;
		console.log("echoMode disabled due to echoAdmin quit detected by: " + echoAdmin);
	}
	return;
});

//logging of notices from server, etc.
client.addListener('notice', function(nick, to, text, message) {
	console.log("Notice: " + text);
	return;
});

//log messages said by users to users.json for the !seen command needs
client.addListener('message', function(nick, to, message){
	if(to == channel ) {
		var ts = moment();
		if(!nameExists(nick)) {
			userData.users.push(
				{
					"name":nick,
					"timestamp": ts,
				}
			)
		}
		else {
			userData.users[getName(nick)].timestamp = ts;
		}
	}
});

client.addListener('message', function (nick, to, text, message) {
	var arrText = text.split(" ");
	if (guessGameActive == true) {
		for (i in arrText) {
			if(arrText[i] == guessWord || (arrText[i] == (guessWord + 's')) || ((arrText[i].slice(0,arrText[i].length-1)) == guessWord) || (guessWord == (arrText[i] + 's'))) {
				client.say(channel, nick + " just got the word! It was " + guessWord + "!");
				guessGameEnd(true);
				break;
				//TODO: award points here or something eventually...
			}
		}
	}
	if (arrText[0][0]!= '!')
		return;
	if (arrText[0]=="!seen") {
		if (arrText.length == 1) {
			client.say(to, "Who are you looking for, " + nick + "?");
			return;
		}
		var handle = arrText[1];
		if(handle == nick) {
			client.say(to, "But " + handle + ", you're right here with me!");
			return;
		}
		if(handle == botName) {
			client.say(to, "You're talking to me!");
			return;
		}
		if(!nameExists(handle)) {
			client.say(to, "I don't remember seeing " + handle + "."	);
			return;
		}
		else {
			var diff = moment.preciseDiff(userData.users[getName(handle)].timestamp,moment());
			client.say(to, handle + " was last seen talking " + diff + " ago.");
			return;
		}
	}
	if (arrText[0]=="!tell") {
		if (arrText.length < 3 ) {
			client.say(to, nick + ", I need a name and a message.");
			return;
		}
		var handle = arrText[1];
		
		if (userIsPresent(to,handle)) {
			client.say(to, nick + ", just tell them yourself!");
			return;
		}
		else {
			var ts = moment().format("MM/D/YY, h:mm A");
			var text = "";
			for(var i=2; i < arrText.length; i++) {
				text += arrText[i];
				if(i != arrText.length-1) { text += " "; }
			}
			
			if(!(msgData.hasOwnProperty("users"))) {
				console.log("Adding users to msgData");
				msgData["users"] = {};
			}
			//user is not in msgData yet
			if(!(handle in msgData.users)) {
				msgData.users[handle] = {};
				msgData.users[handle].messages =
					[{
						msgFrom:nick,
						msgTime:ts,
						msgContent:text
					}];
				//console.log(msgData.users[handle]);
			}
			//user is in msgData so we add to data to existing handle
			else {
				msgData.users[handle].messages.push
					({
						msgFrom:nick,
						msgTime:ts,
						msgContent:text
					});
				//console.log(msgData.users[handle]);
			}
			client.say(to,"I will let them know.");
		}
		return;
	}
	if(arrText[0]=="!forget" && isAdmin(nick)) {
		if(arrText.length == 1) {
			client.say(to, "Who should I forget, " + nick + "?");
			return;
		}
		if(nameExists(arrText[1])) {
			userData.users.splice([getName(arrText[1])],1);
			client.say(to, arrText[1] + " has been forgotten.");
			return;
		}
		else {
			client.say(to, "I can't forget something I don't remember already!");
			return;
		}
	}
	if(arrText[0]=="!guessgame") {
		if( guessGameActive == false ) {
			//start a new word guessing game
			guessGameStart();
			return;
		}
		else //one is already going; end it and start a new one
		{
			if(isAdmin(nick)) {
				guessGameEnd(false);
				return;	
			}
		}
	}
	if (arrText[0]=="!ping") {
		client.say(to, "Pong!");
		return;
	}
	if (arrText[0]=="!coffee") {
		client.action(to,"hands " + nick + " " + coffeeList[randomIntInc(0,coffeeList.length-1)]);
		return;
	}
	if (arrText[0]=="!beer") {
		client.action(to,"serves up " + nick + "'s favorite beer.");
		return;
	}
	if (arrText[0]=="!tea") {
		client.action(to, "prepares a nice cup of tea for " + nick + ".");
		return;
	}
	//grab a tarot card at random from ./json/tarot.json a describe the light and dark (pick from the list at random from within each card).
	if (arrText[0]=="!tarot") {
		var i = randomIntInc(0,tarotData.tarot_interpretations.length-1);
		var ii = randomIntInc(0,tarotData.tarot_interpretations[i].keywords.length-1);
		var iii = randomIntInc(0,tarotData.tarot_interpretations[i].meanings.light.length-1);
		var iiii = randomIntInc(0,tarotData.tarot_interpretations[i].meanings.shadow.length-1);
		var cardName = tarotData.tarot_interpretations[i].name;
		var cardWord = tarotData.tarot_interpretations[i].keywords[ii];
		var text1 = tarotData.tarot_interpretations[i].meanings.light[iii];
		var text2 = tarotData.tarot_interpretations[i].meanings.shadow[iiii];
		
		client.say(to,nick + ', your card is ' + cardName + ' which is about "' + cardWord + '", and means "' + text1 + '" but also "' + text2 + '".');
		return;
	}
	if (arrText[0]=="!time") {
		//var name = nick;
		//if(arrText.length > 1) {
		//	name = arrText[1];
		//}
		//
		//var timeLeft = new moment(getTimeLeft());
		var diff = moment.preciseDiff(endTime,moment());
		client.say(to, event1 + " " + diff + event2);
		return;
	}
	if (arrText[0]=="!fetch" && arrText.length > 1) {
		var search = "";
		for (i = 1; i < arrText.length; i++) {
			search += "%20" + arrText[i];
		}
		client.say(to, "https://lmddgtfy.net/?q=" + search);
		return;
	}
	if (arrText[0]=="!crash")
	{
		var name = nick;
		if(name == "SadiQ")
		{
			client.say(to, "You should know better than to try that!");
		}
		else
		{
			client.say(to, "Sorry, " + name + ", I can't do that for you.");
		}
		return;
	}
	/*
	if(arrText[0]=="!weekend") {
		var today = moment();
		if(today.day() == 5) { //is it Friday? (day 5 in 0-6)
			client.say(to,"Yes, today is Friday! Get ready to party!");
		}
		else if (today.day() > 5) { //it's past friday
			client.say(to,"Yes, it's the weekend! You should be partying!");
		}
		else {
			
		}
	}
	*/
	//How long until Justin's birthday on April 5th?
	if(arrText[0].toLowerCase()=="!justin") {
		var jbday = moment({M:4,d:5});
		/* Debugging code; left in for now
		if(arrText[1]=="true") {
			jbday = moment();
		}
		*/
		if(moment().isSame(jbday,'day')) {
			client.say(to,"Today is Justin's birthday! Happy Birthday, Justin!");
			return;
		}
		if(jbday.isBefore(moment())) {
			jbday.add(1, 'y');
		}
		var diff = moment.preciseDiff(jbday,moment());
		client.say(to, "Justin's next birthday is in " + diff + ".");
		return;
	}
	if(arrText[0]=="!settime") {
		if(!isAdmin(nick)) { return; }
		else {
		//endTime = new Date("April 15, 2016 02:00:00");
		client.say(to, "Changing target time to: " + arrText[1] + " " + arrText[2] + " " + arrText[3] + " " + arrText[4]);
		endTime = new Date(arrText[1] + " " + arrText[2] + " " + arrText[3] + " " + arrText[4]);
		return;
		}
	}
	if(arrText[0]=="!endtime") {
		client.say(to, "Current end time is set to " + endTime);
		return;
	}
	if(arrText[0]=="!sethours") {
		if(!isAdmin(nick)) { return; }
		else {
			//client.say(to, "Setting time to " + arrText[1] + " hours from now.");
			endTime = new Date();
			//console.log("new Date endTime: " + endTime);
			endTime.setTime(endTime.getTime() + (parseInt(arrText[1])*60*60*1000));
			client.say(to, "Time is now " + endTime);
			return;
		}
	}
	if(arrText[0]=="!setevent1" && isAdmin(nick)) {
		event1 = "";
		for(var i=1; i < arrText.length; i++) {
			event1 += arrText[i];
			if(i != arrText.length-1) { event1 += " "; }
		}
		client.say(to,"Event1 description changed to " + event1);
		return;
	}
	if(arrText[0]=="!setevent2" && isAdmin(nick)) {
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
		client.say(to,"Event2 description changed to " + event2);
		return;
	}
	if(arrText[0]=="!quit" && isAdmin(nick)) {
		console.log("Pre-quit userData save...");
		//fs.writeFileSync(userFile, JSON.stringify(userData, null, 4), console.log("Saved user data." ));
		saveData();
		console.log("Quitting IRC...");
		client.disconnect("Goodbye",function quitIRC() {console.log("Disconnect complete, process closing...");process.exit(0); } );
	}
});	

//The following are the "admin" commands
client.addListener('pm', function (from, text, message) {
    //console.log(from + ' => ME: ' + message);
	
	if(echoMode) {
		if(from != echoAdmin) {
			client.say(echoAdmin, from + " > " + text);
		}
	}
	
	if (!isAdmin(from)) return; 
	
	var arrText = text.split(" ");
	if (arrText[0][0]!= '!') {
		console.log(arrText[0] + " is not a command.");
		return;
	}
	if (arrText[0]=="!join") {
		if (arrText.length < 2) {
			client.say(from,"Channel name not included in command.");
			return;
		}
		if (arrText[1][0] != "#" ) {
		return; }
		console.log("Joining " + arrText[1]);
		client.join(arrText[1]);
		return;
	}
	else if (arrText[0]=="!part") {
		if (arrText.length < 2) {
			client.say(from,"Channel name not included in command.");
			return;
		}
		if (arrText[1][0] != "#" ) {
		return; }
		console.log("Parting " + arrText[1]);
		client.part(arrText[1]);
		return;
	}
	else if (arrText[0]=="!echo") {
		if(arrText[1] == "on") {
			echoMode = true;
			echoAdmin = from;
		}
		else if (arrText[1]=="off") {
			echoMode = false;
			client.say(echoAdmin,"PM echo mode disabled by " + from);
		}
		else { client.say(from,"Please include 'on' or 'off' after the !echo command"); }
		client.say(from,"PM echo mode: " + echoMode);
		return;
	}
	else if (arrText[0]=="!say") {
		var text = "";
		for(var i=2; i < arrText.length; i++) {
			text += arrText[i];
			if(i != arrText.length-1) { text += " "; }
		}
		client.say(arrText[1], text);
		return;
	}
	else if (arrText[0]=="!do") {
		var text = "";
		for(var i=2; i < arrText.length; i++) {
			text += arrText[i];
			if(i != arrText.length-1) { text += " "; }
		}
		client.action(arrText[1], text);
		return;
	}
	else if (arrText[0]=="!clearmessages") {
		clearMessages();
		return;
	}
	else if (arrText[0]=="!reloadmessages") {
		reloadMessages();
		return;
	}
	else if (arrText[0]=="!identify") {
		if (arrText.length == 1) {
			client.say(from, "Please include the password to identify with.");
			return;
		}
		else {
			client.say("nickserv", "identify " + arrText[1]);
			return;
		}
	}
	else if (arrText[0]=="!quitpm") {
		console.log("Pre-quit userData save via PM command...");
		//fs.writeFileSync(userFile, JSON.stringify(userData, null, 4), console.log("Saved user data." ));
		saveData();
		console.log("Quitting IRC...");
		client.disconnect("Goodbye",function quitIRC() {console.log("Disconnect complete, process closing...");process.exit(0); } );
	}
});

client.addListener('error', function(message) {
	console.log('error: ', message);
});

function getTimeLeft()
{
	var now = moment();
	var end = moment(endTime);
	var remaining = moment(end.diff(now));
	return remaining;
}

//Moved all Admin-checking results to this function
//so all commands can be easily updated to use smarter
//admin-checking in one swoop later.	
function isAdmin(handle)
{
	//obviously insecure, but it works for now
	if(handle == "Hectate")
	{
		return true;
	}
	else return false;
}

//check for name in listed known users
function nameExists(nick) {
	if(userData.users.length === 0) {
		//console.log("nameExists returned false due to 0 length");
		return false;
	}
	for(var i=0; i < userData.users.length; i++) {
		//console.log("loopcount: " + i);
		if(userData.users[i].name === nick) {
			//console.log(nick + " : nameExists returned true.");
			return true;
		}
	}
	//console.log("nameExists returned false due to no match.");
	return false;
}
function getName(nick) {
	for(var i=0; i < userData.users.length; i++) {
		if(userData.users[i].name === nick) {
			//console.log("getName found " + i);
			return i;
		}
	}
	//console.log("getName found -1");
	return -1;
}
//returns a JSON object containing nicks as the keys and their usermode ("@", "+", or "" usually).
function getUsers(channel) {
	return client.chans[channel].users;
}

//checks if a user is present in the channel specified
function userIsPresent(chanName,userName) {
	if (client.chans[chanName].users[userName] == null) {
		return false;
	}
	else return true;
}

//Writes userdata to disk (maybe more data later). Used for auto-backup and save-on-quits.
function saveData() {
	fs.writeFileSync(msgFile, JSON.stringify(msgData, null, 4), console.log("Saved message data."));
	fs.writeFileSync(userFile, JSON.stringify(userData, null, 4), console.log("Saved user data." ));
	
	return;
}
function randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}

//Checks current list of users against log of messages to deliver, and attempts to deliver if appropriate.
function checkMessages() {
	for(x in msgData.users) {
		if(userIsPresent(channel,x)) {
			console.log("Sending messages to: " + x)
			client.say(x,"You have " + msgData.users[x].messages.length + ((msgData.users[x].messages.length == 1) ? " message" : " messages" ) + " waiting for you.");
			for(y in msgData.users[x].messages) {
				client.say(x, msgData.users[x].messages[y].msgFrom + " on " + msgData.users[x].messages[y].msgTime + ": " + msgData.users[x].messages[y].msgContent);
			}
			delete msgData.users[x];
		}
	}
	//all done delivering or none to deliver
	return;
}
//Clears all existing messages
function clearMessages() {
	for(x in msgData.users) {
		delete msgData.users[x];
	}
	console.log("Cleared all existing messages.");
	return;
}
//Reloads messages from disk to overwrite anything currently in memory.
//Useful if you want to manually delete some contents and reload to clear spurious contents.
function reloadMessages() {
	fs.readFile(msgFile, function (err, data) {
		if(err) throw err;
		msgData = JSON.parse(data);
		console.log("Message data loaded.");
	});
	return;
}

function guessGameStart() {
	guessGameActive = true;
	var obj_keys = Object.keys(wordGameData);
	var random_key = obj_keys[Math.floor(Math.random() *obj_keys.length)];
	guessWord = "" + random_key;
	//console.log("guessWord: " + guessWord);
	var cluesArray = wordGameData[random_key];
	var t = ' | ';
	for (i in cluesArray) {
		t += cluesArray[i] + " | ";
	}
	client.say(channel,"(5 Mins) What word fits these phrases?" + t);
	guessGameTimeout = setTimeout(guessGameEnd,guessGameTimer,false);
	return;
}
function guessGameEnd(winner) {
	guessGameActive = false;
	if(!winner) {
		client.say(channel, "Time is up, Game Over! Nobody guessed correctly. The word was '" + guessWord + "'.");
		if(randomIntInc(0,100) == 0) {
			client.say(channel, "Really? Nobody got that one?");
		}	
	}
	clearTimeout(guessGameTimeout);
	return;
}