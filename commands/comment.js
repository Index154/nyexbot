var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'comment',
	usages: ['', '[number]', '[custom word]'],
	descriptions: ['Generates a random comment', 'Generates a comment using the specified template ID', 'Generates a comment with the custom word'],
    shortDescription: 'Generate stupid sentences',
    weight: 56,
	aliases: ['co'],
    category: 'variety',
	
	execute(message, user, args, prefix) {
	    fs = require('fs');
	    const lib = require("../library.js");
        var allArgs = args.join(" ");

        // Repeatable function for performing the actual command
        var commentResult = lib.generateComment(allArgs);
        if(commentResult[0] == "error"){return;}

        // Build rerollable output
        lib.rerollbuttonReply(message, commentResult[0], allArgs, commentResult[1], "comment");

	},
};