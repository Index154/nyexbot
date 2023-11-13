var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'tenor',
	usages: ['', '[text]'],
	descriptions: ['Posts a random gif from tenor, found by entering a random search term', 'Posts a random gif from tenor using the argument as a search term'],
    shortDescription: 'Random gifs from Tenor',
    weight: 60,
	aliases: ['ten', 'gif'],
    category: 'variety',
	
	execute(message, user, args, prefix) {
	    fs = require('fs');
	    const lib = require("../library.js");
        
        // Set important variables
        var username = user.username;
        var dir = "userdata/" + user.id;
        
        // If there is no argument, pick a random search term from the nick words list
        if(args.length < 1){
            var words = lib.readFile("../nyextest/data/imported/words.txt");
            var words = words.split("\n#####################################################\n").join("\n");
            var wordList = words.split("\n");

            args[0] = wordList[lib.rand(0, wordList.length - 1)] + " " + wordList[lib.rand(0, wordList.length - 1)];
            args[0] = args[0].replace(/ /g, "-");
            
        }
        var allArgs = args.join(" ");

        // Encode allArgs for HTML
        // TODO...

        // Fetch the page and post the result
        var url = "https://tenor.com/search/" + allArgs + "-gifs";
        getGif(url, allArgs);

        async function submitTenorError(url){
            var errors = lib.readFile("../nyextest/data/imported/TenorErrors.txt").split("\n");
            var errorToSave = url;

            if(!errors.includes(errorToSave)){
                errors.push(errorToSave);
                lib.saveFile("../nyextest/data/imported/TenorErrors.txt", errors.join("\n"));
            }
            
        }

        async function getGif(url, allArgs){

            // Fetch the page
            var body = await lib.getHTML(url);

            // Extract all the gifs from the result page
            var reg = "GifListItem clickable.*?\<\/figure\>";
            reg = new RegExp(reg, "g");
            var gifFigures = body.match(reg);
            if(!lib.exists(gifFigures)){
                gifFigures = "No gifs found...";
                submitTenorError(url);
            }else{
                
                for(i = 0; i < gifFigures.length; i++){
                    gifFigures[i] = lib.decodeHTMLEntity(gifFigures[i]
                        .replace(/GifListItem clickable.*?\<img src="/, "")
                        .replace(/".*\<\/figure\>/, "")
                        );
                    gifFigures[i] = "Result for the search term **" + allArgs.replace(/\-/g, " ") + "**\n" + gifFigures[i];

                    // Remove bad results
                    if(gifFigures[i].includes("/assets/img")){
                        gifFigures.splice(i, 1);
                        i--;
                    }
                }
            }

            // Pick random result from those found
            var randKey = lib.rand(0, gifFigures.length - 1);

            // Output (paged embed with all gifs)
            lib.createPagedMessage(gifFigures, gifFigures[randKey], randKey, message);

        }

	},
};