# irc-hectate
## Discord bot made in Node.js

Originally this bot was just a simple IRC timer bot for Ludum Dares. As time progressed (har har) features were added until it because wothwhile to have it as an actual IRC bot that remained in channel. Once I put it on a server the value of putting it on Github to manage fixing and enhancing it was obvious, so here it is! It has since switched to Discord-only and had a Twitter stream added. The server is hardcoded to 'Stencyl' and the tweets go to channel 'tweets'.

## Discord Commands

This bot joins a Discord server (hard-coded at the moment) and connects to a filtered Twitter stream. Note that the bot is coded to ignore Discord messages from other bots.

Commands for all users 
* !time : tells time until current endTime
* !endTime : repeats the currently set endTime
* !ping : responds with "Pong!"
* !tweetstatus : responds with a true/false answer if the tweet stream is being utilized

Commands that require user to have "operator" role named to the server and assigned to the message author to accept the command.
* !settime (time) : Sets a new endTime for the "time" command; format is like "April 15, 2016 02:00:00 UTC". The server running the bot will change how the result is saved if the time zone varies, however.
* !sethours (number) : sets the endTime to a timestamp equal to the current timestamp + (number) of hours in the future
* !setevent1 [string...] : sets a string to the front end of the "time" command - everything before the time left itself
* !setevent2 [string...] : sets a string (or puncutation) to back end of the "time" command - everything after the time left
* !echo [string...] : echos the message seen by the bot in the channel; useful to test how messages are seen by the bot for coding purposes
* !tweettoggle : flips the status of live tweet posting. Note that the stream stays active even if this is disabled, just nothing is posted.

## Future Plans

I expect to phase out and remove IRC support from the bot as activity in Discord has nearly completely supplanted IRC. Rather than lose the body of work, however, I will likely fork it into a version with IRC prior to removal.