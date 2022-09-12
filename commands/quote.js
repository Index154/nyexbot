var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'quote',
	usages: [''],
	descriptions: ['Loads a random quote that has been saved before (also accepts search arguments)'],
    shortDescription: 'Get a random funny quote',
    weight: 15,
	aliases: ['q'],
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
        
        lib.searchableList("quote", message, args);
	},
};