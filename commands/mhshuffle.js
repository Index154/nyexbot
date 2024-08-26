var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'mhshuffle',
	usages: [''],
	descriptions: ['Makes up a random Monster Hunter hunt by mixing various names together'],
    shortDescription: 'Get a random monhun monster name',
    weight: 47,
    aliases: ['mhs'],
    category: 'variety',
	
	execute(message, user, args, prefix) {
	    fs = require('fs');
	    const lib = require("../library.js");
        
        // Create name part lists
        var weaponParts = [["Great", "Long", "Dual", "Sword", "Lance", "Hammer", "Gun", "Charge", "Switch", "Bow", "Light", "Heavy", "Insect", "Hunting"], [" ", " ", " ", " ", " ", " ", " and ", " and ", " Bow "], ["Sword", "Blades", "Shield", "Lance", "Hammer", "Blade", "Axe", "Bow", "Gun", "Bowgun", "Glaive", "Horn"]];
        var fullNames = lib.readFile("./data/imported/monsterNames.txt").toLowerCase().split("\n");
        var parts = [ [], [], [] ];
        var extras = [];
        for(i = 0; i < fullNames.length; i++){
            let n = fullNames[i].split(",");
            if(n.length == 2 && n[1] == ""){
                extras.push(n[0]);
            }else{
                for(x = 0; x < n.length; x++){
                    if(n[x] != ""){
                        if(x == n.length - 1){
                            parts[2].push(n[x]);
                        }else if(x > 0){
                            parts[1].push(n[x]);
                        }else{
                            parts[x].push(n[x]);
                        }
                    }
                }
            }
        }

        // Random monster name
        var output = "";
        var lengthOptions = [2, 2, 3, 3, 3, 4, 4, 4, 4, 4];
        var partCount = lengthOptions[lib.rand(0, lengthOptions.length - 1)];
        if(lib.rand(1, 100) <= 15) {
            output = extras[lib.rand(0, extras.length - 1)];
        }
        for(x = 0; x < partCount; x++){
            if(partCount == 4 && x == 2){
                output += parts[1][lib.rand(0, parts[1].length - 1)];
            }else if((partCount == 2 && x == 1) || x == 3){
                output += parts[2][lib.rand(0, parts[2].length - 1)];
            }else{
                output += parts[x][lib.rand(0, parts[x].length - 1)];
            }
        }

        // Uppercase postprocess
        var letters = Array.from(output);
        var previousLetter = "!";
        for(e = 0; e < letters.length; e++){
            if(previousLetter == " " || previousLetter == "-" || e == 0) letters[e] = letters[e].toUpperCase();
            previousLetter = letters[e];
        }
        output = letters.join("").replace("- ", " ").replace(" -", "-");

        // Random weapon name
        var weapon = weaponParts[0][lib.rand(0, weaponParts[0].length - 1)] + weaponParts[1][lib.rand(0, weaponParts[1].length - 1)] + weaponParts[2][lib.rand(0, weaponParts[2].length - 1)];

        // Make full sentence including weapon
        output = "You should hunt **" + output + "** using the **" + weapon + "**!";

        // Build embed
        var outputEmbed = new Discord.EmbedBuilder()
            .setColor("#c22d23")
            .setTitle("Let's go hunting")
            .setDescription(output);
        
        //Send output
        message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false }});

	},
};