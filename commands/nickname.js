var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'nickname',
	usages: [''],
	descriptions: ['Generates a random weird nickname. Add a number argument to generate more than one at a time'],
	aliases: ['nick'],

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
        
        // Set starting variables
        var words = lib.readFile("./data/imported/words.txt");
        var output = "";
        var type = "none";
        var count = 1;
        var dailyFlag = false;
        
        // Get daily art argument if it exists
        if(lib.exists(args[0])){
            if(args[0] == "dailyart"){
                args.splice(0, args.length);
                
                // If the daily art has already been generated, load it and stop early
                var d = new Date();
                var day = Math.floor(d.getTime() / 86400000);
                var saved = lib.readFile("./data/imported/dailyart.txt").split("|");
                if(parseInt(saved[0]) == day){
                    output = saved[1];
                    
                    // Define embed
                    var outputEmbed = new Discord.MessageEmbed()
                        .setColor("#0099ff")
                        .setTitle("Here you go:")
                        .setDescription(output)
                    
                    //Send output
                    message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false }});
                    return;
                }
                
                var styles = ["Painting (Paul Cezanne)", "Painting (Claude Monet)", "Painting (Van Gogh)", "Painting (Huang Gongwang)", "Photorealistic (Unreal Engine)", "Pencil Sketch", "Black & White 3D", "Watercolor", "Japanese Art", "Acrylic Art", "Minimalistic Art", "Painting (Oil Painting)", "Hotpot Art 1", "Hotpot Art 2", "Hotpot Art 3", "Photorealistic (Volumetric Lighting)", "Photorealistic (Photo taken on an IPhone)", "Photorealistic (Photo taken with Fujifilm Superia)"];
                var styleRand = lib.rand(0, styles.length - 1);
                var chosenStyle = styles[styleRand];
                dailyFlag = true;
                output = "https://hotpot.ai/art-maker\n" + chosenStyle + "\n";
            }
        }
        
        // Get count argument if it exists
        if(lib.exists(args[0])){
            if(!isNaN(args[0])){
                if(parseInt(args[0]) > 20 || parseInt(args[0]) < 1){
                    // Bad number
                    message.reply({ content: "\u274C You may only generate between 1 and 20 nicknames at a time!", allowedMentions: { repliedUser: false }});
                    return;
                }
                count = parseInt(args[0]);
                args.splice(0, 1);
            }
        }
        
        // Get type argument if it exists
        if(lib.exists(args[0])){
            args[0] = args[0].toLowerCase();
            if(args[0] == "type1" || args[0] == "type2" || args[0] == "type3" || args[0] == "type4"){
                type = args[0];
                args.splice(0, 1);
            }
        }
        
        // Split word list
        var wordLists = words.split("#####################################################\n");
        var adjectives = wordLists[0].split(";;\n");
        var nouns = wordLists[1].split(";;\n");
        var mhwTitles = wordLists[2].split(";;\n");
        var userWords = wordLists[3].split(";;\n");
        
        // Go through a loop generating random nicknames
        for(i = 0; i < count; i++){
            // Set starting variables
            var modifier = " ";
            var bonus = "";
            var randNum = lib.rand(1, 100);
            // If the user included one of the keywords, set the word pool for every loop
            if(type == "type1"){
                randNum = 6;
            }else if(type == "type2"){
                randNum = 66;
            }else if(type == "type3"){
                randNum = 61;
            }else if(type == "type4"){
                randNum = 1;
            }
            
            // Determine result
            if(randNum >= 50){
                if(randNum >=65){
                    var chosenList = adjectives;
                }else{
                    var chosenList = nouns;
                    modifier = " of ";
                    bonus = "(s)";
                }
            }else{
                if(randNum <= 5){
                    var chosenList = userWords;
                }else{
                    var chosenList = mhwTitles;
                }
            }
            
            // Add the chosen result to the command output
            var selectedWord = chosenList[lib.rand(0, chosenList.length - 1)];
            var selectedWord2 = nouns[lib.rand(0, nouns.length - 1)];
            // Replace one of the words in the output with the user's input. Also save the user's input to the special word list if it is new
            if(lib.exists(args[0])){
                args[0] = args[0].toLowerCase().replace("_", " ");
                args[0] = args[0].charAt(0).toUpperCase() + args[0].slice(1);
                var replaceRand = lib.rand(1, 2);
                if(replaceRand == 1){
                    selectedWord = args[0];
                }else{
                    selectedWord2 = args[0];
                }
                
                if(!userWords.includes(args[0])){
                    lib.saveFile("./data/imported/words.txt", words + ";;\n" + args[0]);
                }
            }
            if(i > 0){
                output = output + "\n";
            }
            output = output + selectedWord + modifier + selectedWord2 + bonus;

        }
        
        // Save daily
        if(dailyFlag){
            lib.saveFile("./data/imported/dailyart.txt", day + "|" + output)
        }
        
        // Define embed
        var outputEmbed = new Discord.MessageEmbed()
            .setColor("#0099ff")
            .setTitle("Here you go:")
            .setDescription(output)
        
        //Send output
        message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false }});
        
	},
};