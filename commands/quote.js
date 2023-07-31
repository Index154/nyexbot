var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'quote',
	usages: [''],
	descriptions: ['Loads a random quote that has been saved before (also accepts search arguments)'],
    shortDescription: 'Get a random funny quote',
    weight: 30,
	aliases: ['q'],
	addendum: ['- Search arguments are parsed as regular expressions'],
	category: 'variety',
	
	execute(message, user, args, prefix) {
	    fs = require('fs');
	    const lib = require("../library.js");
        
        lib.searchableList("quote", message, args);
	},
};