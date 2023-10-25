var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'wordle',
	usages: [''],
	descriptions: ['Suggests a random starting word for the daily wordle'],
    shortDescription: 'Get a random wordle starting word',
    weight: 52,
	aliases: ['word', 'worlde'],
    category: 'variety',
	
	execute(message, user, args, prefix) {
	    fs = require('fs');
	    const lib = require("../library.js");
        
        // Set important variables
        var username = user.username;

        // Pick a random worlde starting word for the day
        var link = "https://www.nytimes.com/games/wordle/index.html" + "\nhttps://wordleunlimited.org/";
        var wordleList = lib.readFile("./data/imported/wordle.txt").split("\n");
        var leWord = wordleList[lib.rand(0, wordleList.length - 1)];
        
        // Send output
        outputEmbed = new Discord.EmbedBuilder()
            .setColor("#0099ff")
            .setTitle("@ " + username)
            .setDescription(link + "\nHere is your random starting word: **" + leWord + "**");

        message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false }});
        
	},
};