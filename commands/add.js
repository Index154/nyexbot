var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'add',
	usages: ['[list name] [new entry]'],
	descriptions: ['Admin command'],
	
	execute(message, user, args) {
	    fs = require('fs');
	    const lib = require("../library.js");
        
        // Check if the server has a custom prefix and load it
        if(message.guild !== null){
            var serverID = message.guildId;
            if(fs.existsSync("./data/configs/" + serverID)){
                prefix = lib.readFile("./data/configs/" + serverID + "/prefix.txt");
            }
        }
        
        // Only Index is allowed
        if(user.id != 214754022832209921){
            message.reply({ content: "\u274C This subcommand can only be used by Index!", allowedMentions: { repliedUser: false }});
            return;
        }
        if(args[0] != "media" && args[0] != "clip" && args[0] != "quotes"){
            message.reply({ content: "\u274C Required argument [list name] is missing or unknown!", allowedMentions: { repliedUser: false }});
            return;
        }
        // Add new thing to list
        var listName = args[0];
        var list = lib.readFile("./data/imported/" + listName + ".txt");
        args.splice(0, 1);
        var allArgs = args.join(" ");
        list = list + "\n" + allArgs;
        lib.saveFile("./data/imported/" + listName + ".txt", list);
        message.reply({ content: "New entry added to **" + listName + "**!", allowedMentions: { repliedUser: false }});
        
	},
};