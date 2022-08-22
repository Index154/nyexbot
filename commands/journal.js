var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'journal',
	usages: [''],
	descriptions: ['Loads a random Spelunky 2 badly translated journal page (also accepts search arguments)'],
    shortDescription: 'Get a funny Spelunky 2 journal entry',
    weight: 25,
	aliases: ['j'],
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
        
        lib.searchableList("journal", message, args);
	},
};