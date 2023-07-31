var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'fate',
	usages: ['isaac', 'pokemon'],
	descriptions: ['', ''],
    addendum: ['Tells you about the objects that are important to your destiny!'],
    shortDescription: 'Generate your destiny',
    weight: 130,
    category: 'variety',
	
	execute(message, user, args, prefix) {
	    fs = require('fs');
	    const lib = require("../library.js");
        var input = args.join(" ").toLowerCase();
        
        // Set important variables
        var username = user.username;
        var output = "";

        // Define possible fate options
        var basePath = "./data/imported/fates/";
        var fates = {
            isaac: {path: basePath + "isaac/isaacitems.txt", title: "Isaac item"},
            isaacPocket: {path: basePath + "isaac/isaacpockets.txt", title: "Isaac pocket item"},
            isaacTrinket: {path: basePath + "isaac/isaactrinkets.txt", title: "Isaac trinket"},
            isaacCharacter: {path: basePath + "isaac/isaaccharacters.txt", title: "Isaac character"},
            pokemon: {path: basePath + "pokemon/pokemon.txt", title: "Pokemon"}
        };
        
        // Pick a fate, determine its result and add it to the output
        var allowedArguments = ["`isaac`, `pokemon`"];
        if(input == "isaac"){
            output += "\nYour " + fates.isaacCharacter.title + " of destiny is ||" + lib.getFate(user.id, fates.isaacCharacter.path) + "||!";
            output += "\nYour " + fates.isaac.title + " of destiny is ||" + lib.getFate(user.id, fates.isaac.path) + "||!";
            output += "\nYour " + fates.isaacTrinket.title + " of destiny is ||" + lib.getFate(user.id, fates.isaacTrinket.path) + "||!";
            output += "\nYour " + fates.isaacPocket.title + " of destiny is ||" + lib.getFate(user.id, fates.isaacPocket.path) + "||!";
        }else if(input == "pokemon"){
            output += "\nYour " + fates.pokemon.title + " of destiny is ||" + lib.getFate(user.id, fates.pokemon.path) + "||!";
        }else{
            // Default output. List all options
            message.reply({ content: "__**" + username + "**__ \u274C Please include one of these arguments: " + allowedArguments, allowedMentions: { repliedUser: false }});
            return;
        }
        
        // Output
        message.reply({ content: "__**" + username + "**__:" + output, allowedMentions: { repliedUser: false }});
        return;
	},
};