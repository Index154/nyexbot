var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'journal',
	usages: [''],
	descriptions: ['Loads a random Spelunky 2 badly translated journal page (also accepts search arguments)'],
    shortDescription: 'Get a funny Spelunky 2 journal entry',
    weight: 70,
	aliases: ['j'],
	addendum: ['- Search arguments are parsed as regular expressions'],
	category: 'variety',
	
	execute(message, user, args, prefix) {
	    fs = require('fs');
	    const lib = require("../library.js");
		
        lib.searchableList("journal", message, args);
	},
};