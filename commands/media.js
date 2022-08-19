var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'media',
	usages: [''],
	descriptions: ['Loads a random image, gif or video that has been saved before (also accepts search arguments)'],
    shortDescription: 'Look at funny images',
	aliases: ['m', 'image', 'img', 'i'],
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
        
        lib.searchableList("media", message, args);
	},
};