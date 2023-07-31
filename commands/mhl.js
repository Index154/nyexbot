var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'mhl',
	usages: [''],
	descriptions: ['Loads a random Monster Hunter monster from the lexicon (also accepts search arguments)'],
    shortDescription: 'Look at a Monster Hunter monster',
    weight: 120,
	addendum: ['- Search arguments are parsed as regular expressions'],
    category: 'variety',
	
	execute(message, user, args, prefix) {
	    fs = require('fs');
	    const lib = require("../library.js");
        
        lib.searchableList("mhl", message, args);
	},
};