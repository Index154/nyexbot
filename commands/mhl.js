var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'mhl',
	usages: [''],
	descriptions: ['Loads a random Monster Hunter monster from the lexicon (also accepts search arguments)'],
    shortDescription: 'Look at a Monster Hunter monster',
	addendum: 'Search arguments are parsed as regular expressions',
    category: 'variety',
	
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
        
        lib.searchableList("mhl", message, args);
	},
};