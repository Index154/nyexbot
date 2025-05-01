var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'nickname',
	usages: ['[number] type1/type2/type3 [custom word]/type4', '[number] truename', '[number] type0'],
	descriptions: ['Generates a random weird nickname.\nThe number argument is optional and specifies how many nicknames should be generated at once. The maximum is 20.\nIf you include a custom word then it will be used in the resulting nickname. Underscores will be converted into spaces. Additionally, the word will also be added to the pool of custom words and can then appear in all future results. You may also use one of the typeX arguments to make the bot only choose from specific word lists. See more info below.', 'Will generate a specified amount of new words (random combinations of letters)', 'Will generate a specified amount of nicknames made up of only "normal" nouns from a dictionary'],
    shortDescription: 'Generate random nicknames',
    weight: 40,
	aliases: ['nick'],
    addendum: [
        '- type0: ONLY uses words from the "normal nouns" pool. Prevents the use of any other arguments aside from [number]',
        '- type1: Uses words from the Monster Hunter World guild card titles pool. Will only apply to the first part of the nick',
        '- type2: Uses a word from the "adjectives" pool. Will only apply to the first part of the nick',
        '- type3: Uses a custom word that was previously used by another user. Can be used twice in a row to apply to both parts of the nick'
    ],
    category: 'variety',

	execute(message, user, args, prefix) {
	    fs = require('fs');
	    const lib = require("../library.js");
        var allArgs = args.join(" ");

        // Repeatable function for performing the actual command
        var nickResult = lib.generateNicks(allArgs);
        if(nickResult[0] == "error"){return;}
        var output = nickResult[0];

        // Build rerollable output
        lib.rerollbuttonReply(message, output, allArgs, nickResult[1], "nickname");

	}
};