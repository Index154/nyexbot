var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'clip',
	usages: [''],
	descriptions: ['Loads a random clip that has been saved before (also accepts search arguments)'],
    shortDescription: 'Look at funny gaming clips',
    weight: 10,
	aliases: ['c', 'clips'],
	addendum: ['- Search arguments will be matched to entry names as well as tags'],
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
        
        lib.searchableListNew("clip", message, args);
	},
};