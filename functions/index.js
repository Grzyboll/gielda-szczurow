const admin = require("firebase-admin");

if (!admin.apps.length) admin.initializeApp();

exports.discordInteractions = require("./discordInteractions").discordInteractions;
