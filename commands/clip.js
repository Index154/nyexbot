var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'clip',
	usages: [''],
	descriptions: ['Loads a random clip that has been saved before (also accepts search arguments)'],
    shortDescription: 'Look at funny gaming clips',
    weight: 20,
	aliases: ['c', 'clips'],
	addendum: ['- Search arguments will be matched to entry names as well as tags'],
	category: 'variety',
	
	execute(message, user, args, prefix) {
	    fs = require('fs');
	    const lib = require("../library.js");
        
        lib.searchableListNew("clip", message, args);
	},
};