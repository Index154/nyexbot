var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'ability',
	usages: ['', '[number (max 10)]'],
	descriptions: ['Generates a random nonsensical "ability"', 'Generates the specified amount of abilities at once'],
    shortDescription: 'Generate stupid abilities',
    weight: 55,
	aliases: ['ab', 'power'],
    category: 'variety',
	
	execute(message, user, args, prefix) {
	    fs = require('fs');
	    const lib = require("../library.js");
        var allArgs = args.join(" ");

        // Repeatable function for performing the actual command
        var abilityResult = lib.generateAbilities(allArgs);
        if(abilityResult == "error"){return;}

        // Build rerollable output
        lib.rerollbuttonReply(message, abilityResult, allArgs, "", "ability");

	},
};