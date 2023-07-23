var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'help',
	descriptions: ['Displays a list of commands', 'Displays the details of a command'],
    shortDescription: 'See commands and their details',
    weight: 5,
	usages: ['', '[command name]'],
    category: 'info',
	
	execute(message, user, args) {
        const { commands } = message.client;

        // Check if the server has a custom prefix and load it
        if(message.guild !== null){
            var serverID = message.guildId;
            if(fs.existsSync("./data/configs/" + serverID)){
                prefix = lib.readFile("./data/configs/" + serverID + "/prefix.txt");
            }
        }

        if (!args.length) {
            var names = [];
            var categories = [];
            var descriptions = [];
            var weights = [];
            var combined = [];

            /*
            function onlyUnique(value, index, self) {
                return self.indexOf(value) === index;
            }
            */

            // Get all command names and their categories into arrays
            names.push(commands.map(command => command.name));
            names = names[0];
            descriptions.push(commands.map(command => command.shortDescription));
            descriptions = descriptions[0];
            categories.push(commands.map(command => command.category));
            categories = categories[0];
            weights.push(commands.map(command => command.weight));
            weights = weights[0];

            // Throw error if the names, weights and categories don't match in number
            if(names.length != categories.length || names.length != descriptions.length || names.length != weights.length){
                // Error
                message.reply({ content: "\u274C Error: Command, category and description counts do not match!", allowedMentions: { repliedUser: false }});
                return;
            }

            // Combine the names, descriptions, weights and categories into a single object array
            for(i = 0; i < names.length; i++){
                combined[i] = {name: names[i], description: descriptions[i], weight: weights[i], category: categories[i]};
            }
            // Sort the object array
            combined.sort((a, b) => {
                return a.weight - b.weight;
            });

            // Set the list of categories in correct order and modified display names
            //var uniqueCategories = categories.filter(onlyUnique);
            var uniqueCategories = ["main", "tasks", "userinfo", "items", "info", "misc", "settings", "variety", "minigames", "admin"];
            var categoryNames = ["\u2757 Main commands", "\uD83D\uDDD2 Recurring tasks", "\uD83D\uDC64 User information", "\uD83D\uDC8E Item interactions", "ℹ️ General information", "\uD83D\uDECD Miscellaneous", "⚙️ Settings / Feedback", "\u2753 Unrelated / Fun commands", "\uD83C\uDFAE Other minigames", "\uD83D\uDD27 Admin commands"];
            
            // Assemble different versions of the same embed for each page
            var categoriesPerPage = [3, 2, 2, 3];
            var categoryTracker = 0;
            var embeds = [];
            for(x = 0; x < 4; x++){

                var embedTemplate = new Discord.EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle("Command list:")
                    .setDescription("You can use `" + prefix + "help [command name]` to get further info about a specific command!" + "\n\nIf you are interested in future update plans for the bot then join the main server: https://discord.gg/Sz72qan\nIf you have a problem with the bot then please use the command `" + prefix + "submit`!");

                // Add commands as multiple fields
                for(i = 0; i < categoriesPerPage[x]; i++){

                    var categoryCommands = "";
                    for(o = 0; o < names.length; o++){
                        if(combined[o].category == uniqueCategories[categoryTracker]){
                            categoryCommands += "`" + combined[o].name + "` - " + combined[o].description + "\n";
                        }
                    }

                    // Add empty field to create inline order
                    /*if(i != 0 && i % 2 == 0){
                        outputEmbed.addFields(
                            { name: '\u200b', value: '\u200b', inline: false }
                        );
                    }*/

                    embedTemplate.addFields(
                        { name: categoryNames[categoryTracker], value: categoryCommands, inline: false }
                    );
                    categoryTracker++;
                }

                embeds[x] = embedTemplate;
            }

            // Output
            lib.createSimplePagedEmbed(message, embeds);
            return;
        }
	    
		const name = args[0].toLowerCase();
        const command = commands.get(name)
            || commands.find(cmd => cmd.aliases && cmd.aliases.includes(name));
        
        if (!command) {
        	return message.reply('\u274C That\'s not a valid command!');
        }
        
        var output = "";
        output += `**Command name:** ${command.name}`;
        if (command.aliases) output += `\n**Aliases:** ${command.aliases.join(', ')}`;
        output += "\n**Functions:**";
        for(i = 0; i < command.usages.length; i++){
            if(command.usages[i] !== ""){command.usages[i] = " " + command.usages[i];}
            output += "\n`" + prefix + command.name + command.usages[i] + "` => " + command.descriptions[i];
        }
        if (command.addendum) output += "\n\n**Further information:**\n" + command.addendum.join("\n").replace(/{prefix}/g, prefix);
        
        message.reply({ content: output, allowedMentions: { repliedUser: false }});

	},
};