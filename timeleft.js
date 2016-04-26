var ircLib = require('irc');
var moment = require('moment');
require('moment-precise-range-plugin');
var fs = require('fs');


//note; on the server I use to run this, the working directly is actually below one level
//so the file is on there run as './irc-hectate/users.json' instead. Change if local run :P
var userFile = './irc-hectate/users.json';
//var userFile = 'users.json';
var userData = {};

var endTime = new Date("May 9, 2016 21:00:00");
var event1 = "LD35 judging ends in  ";
var event2 = ".";
var echoMode = false;
var echoAdmin = "Hectate";


//read the data file for users listed
fs.readFile(userFile, function (err, data) {
	if(err) throw err;
	userData = JSON.parse(data);
	console.log("User data loaded.");
});

var client = new ircLib.Client('irc.esper.net', 'JinxBot', {
	channels: ['#stencyl'],
	floodProtection: true,
	autoRejoin: true,
});

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
	if(to == "#stencyl") {
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
	if (arrText[0]=="!time") {
		var name = nick;
		if(arrText.length > 1) {
			name = arrText[1];
		}
		
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
		fs.writeFileSync(userFile, JSON.stringify(userData, null, 4), console.log("Saved user data." ));
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
	else if (arrText[0]=="!quit") {
		console.log("Pre-quit userData save...");
		fs.writeFileSync(userFile, JSON.stringify(userData, null, 4), console.log("Saved user data." ));
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