var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'elden',
	usages: [''],
	descriptions: ['Generates a random message that could be made in Elden Ring'],
    shortDescription: 'Generate an Elden Ring message',
    category: 'variety',

	execute(message, user, args) {
	    fs = require('fs');
	    const lib = require("../library.js");
        
        // Check if the server has a custom prefix and load it
        if(message.guild !== null){
            var serverID = message.guildId;
            if(fs.existsSync("./data/configs/" + serverID)){
                prefix = lib.readFile("./data/configs/" + serverID + "/prefix.txt");
            }
        }
        
        // Load templates, words and conjunctions
        var everything = lib.readFile("./data/imported/eldenWords.txt");
        everything = everything.split("\n#########################################\n");
        var templates = everything[0].split("\n");
        var conjunctions = everything[1].split("\n");
        var words = everything[2].split("\n");
        var locations = everything[3].split("\n");

        // Determine message format
        var rand = lib.rand(1, 100);
        var hasTwoParts = false;
        if(rand <= 60){hasTwoParts = true;}

        // Determine message location
        var location = locations[lib.rand(0, locations.length - 1)];

        // Determine appraisals
        var appraisals = lib.rand(0, 100);
        if(appraisals > 50){appraisals = lib.rand(0, 9999);}

        // Determine first part of the message
        var eldenMessage = templates[lib.rand(0, templates.length - 1)].replaceAll('PLACEHOLDER', words[lib.rand(0, words.length - 1)]);

        // Determine second part if necessary
        if(hasTwoParts){
            eldenMessage += conjunctions[lib.rand(0, conjunctions.length - 1)].replaceAll('LINEBREAK', '\n') + templates[lib.rand(0, templates.length - 1)].replaceAll('PLACEHOLDER', words[lib.rand(0, words.length - 1)]);
        }

        // Build embed and send it
        var outputEmbed = new Discord.MessageEmbed()
            .setColor("#ffc300")
            .setTitle("You find a message " + location + ":")
            .setDescription(eldenMessage)
            .setFooter({text: "Appraisals: " + appraisals});
        
        //Send output
        message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false }});
        
	},
};