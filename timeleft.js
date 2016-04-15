var ircLib = require('irc');
var moment = require('moment');
require('moment-precise-range-plugin');

var endTime = new Date("April 15, 2016 20:00:00");
var event1 = "Time until Ludum Dare 35 is";
var event2 = ".";

var client = new ircLib.Client('irc.esper.net', 'TimeBot', {
	channels: ['#stencyl'],
});

//client.addListener('message', function (from, to, message) {
//	console.log(from + ' => ' + to + ': ' + message);
//});

client.addListener('message', function (nick, to, text, message) {
	var arrText = text.split(" ");
	if (arrText[0][0]!= '!')
		return;
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
		if(nick != "Hectate") { return; }
		else {
		//endTime = new Date("April 15, 2016 02:00:00");
		client.say(to, "Changing target time to: " + arrText[1] + " " + arrText[2] + " " + arrText[3] + " " + arrText[4]);
		endTime = new Date(arrText[1] + " " + arrText[2] + " " + arrText[3] + " " + arrText[4]);
		return;
		}
	}
	if(arrText[0]=="!sethours") {
		if(nick != "Hectate") { return; }
		else {
			//client.say(to, "Setting time to " + arrText[1] + " hours from now.");
			endTime = new Date();
			//console.log("new Date endTime: " + endTime);
			endTime.setTime(endTime.getTime() + (parseInt(arrText[1])*60*60*1000));
			client.say(to, "Time is now " + endTime);
			return;
		}
	}
	if(arrText[0]=="!setevent1" && nick == "Hectate") {
		event1 = "";
		for(var i=1; i < arrText.length; i++) {
			event1 += arrText[i];
			if(i != arrText.length-1) { event1 += " "; }
		}
		client.say(to,"Event1 description changed to " + event1);
		return;
	}
	if(arrText[0]=="!setevent2" && nick == "Hectate") {
		event2 = "";
		for(var i=1; i < arrText.length; i++) {
			if(i == 1) { event2 += " "; }
			event2 += arrText[i];
			if(i != arrText.length-1) { event2 += " "; }
		}
		client.say(to,"Event2 description changed to " + event2);
		return;
	}
	if(arrText[0]=="!quit" && nick == "Hectate") {
		client.disconnect("Goodbye",function quitIRC() {console.log("Disconnect complete, process closing...");process.exit(0); } );
	}
});	

//The following are the "admin" commands (only recognized from the named admin in a PM).
client.addListener('pm', function (from, text, message) {
    console.log(from + ' => ME: ' + message);
	if (from != "Hectate") return;  //REPLACE THIS NICK WHEN APPROPRIATE
	var arrText = text.split(" ");
	if (arrText[0][0]!= '!') {
		console.log(arrText[0] + " is not a command.");
		return;
	}
	if(arrText[0]=="!set") {
	//endTime = new Date("April 15, 2016 02:00:00");
	//	console.log("Attempting to set time to: " + arrText[1] + " " + arrText[2] + " " + arrText[3] + " " + arrText[4]);
		endTime = new Date(arrText[1] + " " + arrText[2] + " " + arrText[3] + " " + arrText[4]);
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
	else if (arrText[0]=="!quit") {
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
	//var remaining = end.diff(now);
	return remaining;
/*
	var remaining = new Date();
	var currTime = new Date();
	console.log("end: " + endTime);
	remaining.setTime(endTime.getTime() - currTime.getTime());
	console.log("remaining: " + remaining);
	if(remaining.getTime <= 0)
	{
		console.log("setTime to zero for negative value");
		remaining.setTime(0);
	}
	return remaining;
	*/
}