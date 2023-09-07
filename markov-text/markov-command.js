var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'markov',
	usages: [''],
	descriptions: ['Test'],
    shortDescription: 'Generate stuff',
    weight: 21,
	aliases: ['mark', 'co', 'comment'],
    category: 'variety',
	
	execute(message, user, args, prefix) {
	    fs = require('fs');
	    const lib = require("../library.js");
        var Markov = require("../markov-text/Markov");
        
        // Set important variables
        var username = user.username;
        var dir = "userdata/" + user.id;
        
        // Do the markov
        var trainingText = lib.readFile("./data/imported/pokesolutions.txt");
        const options = {mode: 'single', order: 3};
        const markovGen = new Markov(options);
        markovGen.seed(trainingText);
        var result = markovGen.generate(7);

        result = result.charAt(0).toUpperCase() + result.slice(1);

        // Output
        message.reply({ content: result, allowedMentions: { repliedUser: false }});

	},
};