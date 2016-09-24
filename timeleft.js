/// <reference path=".vscode/node.d.ts" />

"use strict";

const EventEmitter = require('events');
var fs = require('fs');
var ds = require('./dsClient.js');
var tw = require('./twClient.js');

var sharedEmitter = new EventEmitter();

//Local Launch config requires a couple of alterations to some variables.
//The starting path is different, so we point to the files where they are
if (process.argv[2] == "l") {
	console.log("Local Launch detected, starting with alternate config.")
}

ds.dsStart(sharedEmitter);
tw.twStart(sharedEmitter);



