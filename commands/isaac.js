var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'isaac',
	usages: [''],
	descriptions: ['Tells you what your item of destiny is!'],
	
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
        
        // Set important variables
        var username = user.username;
        
        // Load item list
        var items = lib.readFile("./data/imported/isaacitems.txt").split("\n");

        // Pick an array index based on the user ID
        var resultIndex = user.id % items.length;
        if(resultIndex == 0){resultIndex = parseInt(("" + user.id).slice(0, 2));}
        var resultItem = items[resultIndex];

        // Output
        message.reply({ content: "__**" + username + "**__, your Isaac item of destiny is... ||" + resultItem + "||!", allowedMentions: { repliedUser: false }});
        return;
	},
};