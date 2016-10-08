"use strict";

require('events');
var Twit = require("twit");
var twTokenJSON = require('./json/twit_token.json');
var sharedEmitter;

var twClient = new Twit(twTokenJSON);

exports.twStart = function(emitter) {
    sharedEmitter = emitter;
    sharedEmitter.on('dsReady', () => {
        //console.log("reading tweets");
        //sharedEmitter.emit('dsTweet', "STRING");
    });

    var stream = twClient.stream('statuses/filter', { track: ["stencyl", "madeinstencyl","stencyl's","stencyls","stencly","stencylgamejam"] });
    stream.on('tweet', function (tweet) {
        //console.log(tweet);
        if(!isRetweet(tweet)) {
            //console.log("sending tweet to discord");
            sharedEmitter.emit('dsTweet', tweet);
        } 
    });
    stream.on('error', function(error) {
        console.log(error);
    });
}

function isRetweet(tweet) {
  if ( tweet.retweeted_status != null) {
    //console.log("skipping retweet");
    return true;
  }
  else return false;
}