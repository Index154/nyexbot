var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'tenor',
	usages: ['', '[text]'],
	descriptions: ['Posts a random gif from tenor, found by entering a random search term', 'Posts a random gif from tenor using the argument as a search term'],
    shortDescription: 'Random gifs from Tenor',
    weight: 24,
	aliases: ['ten', 'gif'],
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
        var dir = "userdata/" + user.id;
        
        // If there is no argument, pick a random search term from the nick words list
        if(args.length < 1){
            var words = lib.readFile("../nyextest/data/imported/words.txt");
            var words = words.split("\n#####################################################\n").join("\n");
            var wordList = words.split("\n");

            args[0] = wordList[lib.rand(0, wordList.length - 1)] + " " + wordList[lib.rand(0, wordList.length - 1)];
            args[0] = args[0].replace(" ", "-");
            
        }
        var allArgs = args.join(" ");

        // Encode allArgs for HTML
        // TODO...

        // Fetch the page and post the result
        var url = "https://tenor.com/search/" + allArgs + "-gifs";
        getGif(url, allArgs);

        async function submitTenorError(url, customString){
            var errors = lib.readFile("../nyextest/data/imported/TenorErrors.txt").split("\n");
            var errorToSave = url + " | " + customString;

            if(!errors.includes(errorToSave)){
                errors.push(errorToSave);
                lib.saveFile("../nyextest/data/imported/TenorErrors.txt", errors.join("\n"));
            }
            
        }

        async function getGif(url, allArgs){

            try {

                // HTML decoding function
                var decodeHtmlEntity = function(str) {
                    return str.replace(/&quot;/g, "\"").replace(/&amp;/g, "&").replace(/&#(\d+);/g, function(match, dec) {
                        return String.fromCharCode(dec);
                    });
                };

                // Fetch the page
                var response = await fetch(url);
                var body = await response.text();

                // Extract all the gifs from the result page
                var reg = "GifListItem clickable.*?\<\/figure\>";
                reg = new RegExp(reg, "g");
                var gifFigures = body.match(reg);
                if(!lib.exists(gifFigures)){
                    gifFigures = "No gifs found...";
                    submitTenorError(url, "None");
                }else{
                    /*
                    var gifFigures = decodeHtmlEntity(gifFigures[lib.rand(0, gifFigures.length - 1)]
                        .replace(/GifListItem clickable.*?\<img src="/, "")
                        .replace(/".*\<\/figure\>/, "")
                        );
                    */

                    for(i = 0; i < gifFigures.length; i++){
                        gifFigures[i] = decodeHtmlEntity(gifFigures[i]
                            .replace(/GifListItem clickable.*?\<img src="/, "")
                            .replace(/".*\<\/figure\>/, "")
                            );

                        gifFigures[i] = "Result for the search term **" + allArgs + "**\n" + gifFigures[i];
                    }
                }

                // Pick random result from those found
				var randKey = lib.rand(0, gifFigures.length - 1);

                // Output (paged embed with all gifs)
                lib.createPagedNightEmbed(gifFigures, gifFigures[randKey], randKey, message);
                
            }
            catch(exception){
                message.reply({ content: "\u274C There was an error fetching the gif from " + url + "!\n```javascript\n" + exception + "```", allowedMentions: { repliedUser: false }});
                console.log("Error fetching gif from " + url);
                console.log(exception);
            }

        }

	},
};