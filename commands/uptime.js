var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'uptime',
	usages: [''],
	descriptions: ['Shows the uptime of the bot as well as the server it runs on'],
    shortDescription: 'See bot uptime',
    weight: 15,
	aliases: ['up'],
    category: 'admin',

	execute(message, user, args, prefix) {
	    fs = require('fs');
	    const lib = require("../library.js");
        
        // Uptime subcommand
        // Get uptimes
        var serverUptime = lib.secondsToTime(require("os").uptime());
        var botUptime = lib.secondsToTime(process.uptime());
        // Output
        message.reply({ content: "**Server uptime:** " + serverUptime + "\n**Bot uptime:** " + botUptime, allowedMentions: { repliedUser: false }});
        
	},
};