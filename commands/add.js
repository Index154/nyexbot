var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'add',
	usages: ['[list name] [new entry]'],
	descriptions: ['Admin command'],
    shortDescription: 'Add a database entry',
    weight: 20,
    category: 'admin',
	
	execute(message, user, args, prefix) {
	    fs = require('fs');
	    const lib = require("../library.js");
        
        // Only Index is allowed
        if(user.id != globalVars.adminUserId){
            message.reply({ content: "\u274C This subcommand can only be used by Index!", allowedMentions: { repliedUser: false }});
            return;
        }
        if(args[0] != "media" && args[0] != "clip" && args[0] != "quote"){
            message.reply({ content: "\u274C Required argument [list name] is missing or unknown!", allowedMentions: { repliedUser: false }});
            return;
        }
        // Add new thing to list
        var listName = args[0];
        var list = lib.readFile("../nyextest/data/imported/" + listName + ".txt");
        args.splice(0, 1);
        var allArgs = args.join(" ");
        list = list + "\n" + allArgs;
        lib.saveFile("../nyextest/data/imported/" + listName + ".txt", list);
        message.reply({ content: "New entry added to **" + listName + "**!", allowedMentions: { repliedUser: false }});
        
	},
};