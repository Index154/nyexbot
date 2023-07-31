var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'media',
	usages: [''],
	descriptions: ['Loads a random image, gif or video that has been saved before (also accepts search arguments)'],
    shortDescription: 'Look at funny images',
    weight: 10,
	aliases: ['m', 'image', 'img', 'i'],
	addendum: ['- Search arguments are parsed as regular expressions'],
	category: 'variety',
	
	execute(message, user, args, prefix) {
	    fs = require('fs');
	    const lib = require("../library.js");
        
        lib.searchableList("media", message, args);
	},
};