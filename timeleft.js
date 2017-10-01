/// <reference path=".vscode/node.d.ts" />
// Author Nathaniel 'Hectate' Mitchell

"use strict";

const EventEmitter = require('events');
var fs = require('fs');
var ds = require( __dirname + '/dsClient.js');
var tw = require( __dirname + '/twClient.js');
var event = require( __dirname + '/json/event.json');

var sharedEmitter = new EventEmitter();

//Local Launch config requires a couple of alterations to some variables.
//The starting path is different, so we point to the files where they are
if (process.argv[2] == "l") {
	console.log("Local Launch detected, starting with alternate config.")
}

ds.dsStart(sharedEmitter, event);
tw.twStart(sharedEmitter);



