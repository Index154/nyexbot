var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'inspire',
	usages: [''],
	descriptions: ['Generate a random creature configuration for inspiration'],
    shortDescription: 'Creature idea generator',
    weight: 100,
	aliases: ['insp'],
    category: 'variety',
	
	execute(message, user, args, prefix) {
	    fs = require('fs');
	    const lib = require("../library.js");
        
        // Set important variables
        var username = user.username;
        var dir = "userdata/" + user.id;
        
        // Define options
        var movementTypes = ["Terrestrial", "Flying", "Burrowing", "Swimming"];
        var behaviors = ["aggressive", "peaceful", "skittish", "lazy", "curious"];
        var sizes = ["rat-sized", "cat-sized", "dog-sized", "horse-sized", "truck-sized", "house-sized", "mountain-sized"];
        var animalTypes = ["bird", "mammal", "fish", "reptile", "amphibian", "arthropod", "invertebrate", "elemental", "machine"];
        var specialFeatures = ["extra limbs", "reduced limbs", "spikey / sharp parts", "ranged attacks", "magic", "unique sensing abilities"];

        // Determine result
        var movementType = movementTypes[lib.rand(0, movementTypes.length - 1)];
        var behavior = behaviors[lib.rand(0, behaviors.length - 1)];
        var size = sizes[lib.rand(0, sizes.length - 1)];
        var animalType = animalTypes[lib.rand(0, animalTypes.length - 1)];
        var specialFeature = specialFeatures[lib.rand(0, specialFeatures.length - 1)];

        // Output
        message.reply({ content: movementType + " " + behavior + " " + size + " " + animalType + " with " + specialFeature, allowedMentions: { repliedUser: false }});

	},
};