var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'scp',
	usages: ['', '[number]'],
	descriptions: ['Posts the link to a random SCP', 'Posts the link to the selected SCP'],
    shortDescription: 'Look at an SCP',
    weight: 23,
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

        // Important setting variables
        var maxSCP = 6000;
        var SCP = 0;
        
        // See if there was an input or not
        var allArgs = args.join(" ");
        if(lib.exists(allArgs)){
            // If there was an input, check if it is a number between 0 and maxSCP, then use it
            SCP = parseInt(allArgs.replace(/[^0-9]/g, ""));
            if(SCP < 1 || SCP > maxSCP){
                // Error: Number outside of allowed range!
                message.reply({ content: "\u274C " + SCP + " is not an allowed number! It must be between 1 and " + maxSCP + " (inclusive)", allowedMentions: { repliedUser: false }});
                return;
            }
        }else{
            // There was no input. Select a random SCP
            SCP = lib.rand(1, maxSCP);
        }

        // Determine which series the SCP belongs to (to know which link has to be used later)
        var seriesURL = "https://scp-wiki.wikidot.com/scp-series";
        var seriesChosen = false;
        var seriesIncrement = 1000;
        for(i = 0; !seriesChosen; i++){
            if(SCP < seriesIncrement){
                seriesChosen = true;
                series = "-" + (i + 1);
                if(i == 0){series = "";}
                seriesURL += series;
            }else{
                seriesIncrement += 1000;
            }
        }

        // Process the SCP number, converting it into a string and doing a zero-fill
        var targetLength = 4;
        if(SCP < 1000){targetLength = 3;}

        SCP = SCP.toString();
        while(SCP.length < targetLength){
            SCP = "0" + SCP;
        }

        // Fetch the SCP and post the result
        getSCP(SCP, seriesURL);

        async function submitSCPError(SCPNumber, customString){
            var errors = lib.readFile("../nyextest/data/imported/SCPErrors.txt").split("\n");
            var errorToSave = SCPNumber + " | " + customString;

            if(!errors.includes(errorToSave)){
                errors.push(errorToSave);
                lib.saveFile("../nyextest/data/imported/SCPErrors.txt", errors.join("\n"));
            }
            
        }

        async function getSCP(SCPNumber, seriesURL) {
            try {
                // HTML decoding function
                var decodeHtmlEntity = function(str) {
                    return str.replace(/&quot;/g, "\"").replace(/&amp;/g, "&").replace(/&#(\d+);/g, function(match, dec) {
                        return String.fromCharCode(dec);
                    });
                };

                // Get the name
                var response = await fetch(seriesURL);
                var body = await response.text();
                var SCPLink = "https://scp-wiki.wikidot.com/scp-" + SCPNumber;
                var reg = "\<a href=\"\/scp-" + SCPNumber + "\"\>.*?\<\/a\> - .*?\<\/li\>";
                reg = new RegExp(reg, "g");
                var title = body.match(reg);
                if(!lib.exists(title)){
                    title = "No title found...";
                    submitSCPError(SCPNumber, "title");
                }else{
                    title = decodeHtmlEntity(title[0].replace(/\<a href=\"\/scp-.*?\"\>/g, "").replace(/\<\/a\>/g, "").replace(/\<\/li\>/g, "").replace(/\<.*?\>/g, ""));
                    if(title.length > 255){
                        title = title.substring(0, 250) + "...";
                    }
                }

                // Get the body of the SCP article
                response = await fetch(SCPLink);
                body = await response.text();

                // Extract the description
                reg = "\<p\>\<strong\>Description:\<\/strong\> .*?\<\/p\>";
                reg = new RegExp(reg, "g");
                var description = body.match(reg);
                if(!lib.exists(description)){
                    description = "No description found...";
                    submitSCPError(SCPNumber, "description");
                }else{
                    description = decodeHtmlEntity(description[0].replace(/\<sup class.*?\<\/sup\>/, "").replace(/\<p\>\<strong\>Description:/g, "").replace(/\<\/strong\> /g, "").replace(/\<\/p\>/g, "").replace(/\<.*?\>/g, ""));
                    if(description.length > 300){
                        description = description.substring(0, 300) + "...";
                    }
                }

                // Button
                var button = new MessageButton()
                    .setLabel("Full article")
                    .setStyle("LINK")
                    .setURL(SCPLink);
                var row = new MessageActionRow().addComponents([button]);

                // Embed
                var outputEmbed = new Discord.MessageEmbed()
                    .setColor("#ffffff")
                    .setTitle(title)
                    .setDescription(description);

                // Output
                message.reply({ embeds: [outputEmbed], components: [row], allowedMentions: { repliedUser: false } });

            }
            catch(exception){
                message.reply({ content: "\u274C There was an error fetching SCP-" + SCPNumber + "!\n```javascript\n" + exception + "```", allowedMentions: { repliedUser: false }});
                console.log("Error fetching SCP-" + SCPNumber + ":");
                console.log(exception);
            }
        }
	},
};