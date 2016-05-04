# irc-hectate
## IRC bot made in Node.js

Originally this bot was just a simple in-channel timer for Ludum Dares. As time progressed (har har) features were added until it because wothwhile to have it as an actual IRC bot that remained in channel. Once I put it on a server the value of putting it on Github to manage fixing and enhancing it was obvious, so here it is!

Note that the security of the bot is entirely dependant on having the correct nickname (mine) for admin commands. If that nick is absent (and/or not protected) then the bot *will* accept commands from anyone that changes themselves to that nick.
The network and channel are also hardcoded currently; change those if needed.

Current public all-users commands (case sensitive):
* !time : tells time until/since a specified timestamp
* !seen (nick) : tells time since the nick last sent a public message
* !ping : replies with "Pong!"
* !fetch [string...] : Sarcastically sends user to a "let me duck duck go that for you" search results
* !crash : simple string reply
* !endtime : repeats the currently set endTime
* !coffee : gives user a random type of coffee-based drink
* !beer : serves user a beer
* !tell (nick) [string...] : Saves the message until the nick given is seen in the channel, and then the message is delivered.

Current public admin commands (case sensitive):
* !forget (nick) : erases the specified nick from the memory for the "seen" command
* !settime (time) : Sets a new endTime for the "time" command; format is like "April 15, 2016 02:00:00". Be aware of the bot's server's timezone will impact the timestamp's difference from yours (if they vary).
* !sethours (number) : sets the endTime to a timestamp equal to the current timestamp + (number) of hours in the future
* !setevent1 [string...] : sets a string to the front end of the "time" command - everything before the time left itself
* !setevent2 [string...] : sets a string (or puncutation) to back end of the "time" command - everything after the time left
* !quit : bot quits network, saves data to files, and closes the process. Currently the only way to save data in memory to the file system (unfortunately, it is lost in crashes right now)

Current private admin command (case sensitive):
* !join (channel) : attempts to join the named channel; make sure to include the #
* !part (channel) : attempts to part the named channel; make sure to include the #
* !echo (on/off) : turns on/off the Echo Mode for an admin; when on, any PMs to JinxBot will be echo'd to the echoAdmin along with the name of who said it to the bot.
* !say (nick/channel) [string...] : JinxBot will say the string. If a nick is given it will be a PM, if a channel is given it will go to the public channel, of course. Be sure to include the # for the channel name or else it will be treated as a nick. It is case sensitive.
* !do (nick/channel) [string...] : JinxBot will do (/me) the string. If a nick is given it will be a PM, if a channel is given it will go to the public channel, of course. Be sure to include the # for the channel name or else it will be treated as a nick. It is case sensitive.
* !identify (password) : Sends a message to nickserv with content of "identify (password)" to attemp to log in. Note that replies from nickserv go to the console log/file because they are server notices, not PMs.
* !quitpm : same as public quit - saves data to files, quits the network, and closes the process.
* !clearmessages : Deletes all saved messages from the "tell" command.
* !reloadmessages : Forces a reload from messages saved to disk; useful if you want to manually clear some spurious content