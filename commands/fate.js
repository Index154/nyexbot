var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'fate',
	usages: [''],
	descriptions: ['Tells you about the objects that are important to your destiny!'],
    shortDescription: 'Generate your destiny',
    weight: 45,
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
        
        // Set important variables
        var username = user.username;
        var output = "";

        // Define possible fate options
        var fates = {
            isaac: {path: "./data/imported/isaac/isaacitems.txt", title: "Isaac item"},
            isaacPocket: {path: "./data/imported/isaac/isaacpockets.txt", title: "Isaac pocket item"},
            isaacTrinket: {path: "./data/imported/isaac/isaactrinkets.txt", title: "Isaac trinket"},
            isaacCharacter: {path: "./data/imported/isaac/isaaccharacters.txt", title: "Isaac character"}
        };
        
        // Pick a fate, determine its result and add it to the output
        output += "\nYour " + fates.isaacCharacter.title + " of destiny is ||" + lib.getFate(user.id, fates.isaacCharacter.path) + "||!";
        output += "\nYour " + fates.isaac.title + " of destiny is ||" + lib.getFate(user.id, fates.isaac.path) + "||!";
        output += "\nYour " + fates.isaacTrinket.title + " of destiny is ||" + lib.getFate(user.id, fates.isaacTrinket.path) + "||!";
        output += "\nYour " + fates.isaacPocket.title + " of destiny is ||" + lib.getFate(user.id, fates.isaacPocket.path) + "||!";
        
        // Output
        message.reply({ content: "__**" + username + "**__:" + output, allowedMentions: { repliedUser: false }});
        return;
	},
};