var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'help',
	descriptions: ['Displays a list of commands', 'Displays the details of a command'],
    shortDescription: 'See commands and their details',
	usages: ['', '[command name]'],
    category: 'info',
	
	execute(message, user, args) {
	    var names = [];
        var categories = [];
        var descriptions = [];
        const { commands } = message.client;

        // Check if the server has a custom prefix and load it
        if(message.guild !== null){
            var serverID = message.guildId;
            if(fs.existsSync("./data/configs/" + serverID)){
                prefix = lib.readFile("./data/configs/" + serverID + "/prefix.txt");
            }
        }

        if (!args.length) {
            /*
            function onlyUnique(value, index, self) {
                return self.indexOf(value) === index;
            }
            */

            // Get all command names and their categories into arrays
            names.push(commands.map(command => command.name));
            names = names[0];
            categories.push(commands.map(command => command.category));
            categories = categories[0];
            descriptions.push(commands.map(command => command.shortDescription));
            descriptions = descriptions[0];
            //var uniqueCategories = categories.filter(onlyUnique);
            var uniqueCategories = ["main", "tasks", "userinfo", "items", "info", "misc", "settings", "variety", "minigames", "admin"];
            var categoryNames = ["\u2757 Main commands", "\uD83D\uDDD2 Recurring tasks", "\uD83D\uDC64 User information", "\uD83D\uDC8E Item interactions", "\u2139 General information", "\uD83D\uDECD Miscellaneous", "\u2699 Settings / Feedback", "\u2753 Unrelated / Fun commands", "\uD83C\uDFAE Other minigames", "\uD83D\uDD27 Admin commands"];

            // Throw error if the names and categories don't match in number
            if(names.length != categories.length || names.length != descriptions.length){
                // Error
                message.reply({ content: "\u274C Error: Command, category and description counts do not match!", allowedMentions: { repliedUser: false }});
                return;
            }
            
            // Assemble a basic embed
    	    var outputEmbed = new Discord.MessageEmbed()
            	.setColor('#0099ff')
            	.setTitle("Command list:")
            	.setDescription("Visit https://indexnight.com/rpg_info.php for in-depth explanations of everything there is to know about the game!\nIf you are interested in directly interacting with the bot's creator or want to know future update plans then join the main server: https://discord.gg/Sz72qan\nIf you have a problem with the bot then please use the command `" + prefix + "submit`!")
                .setFooter({ text: `You can send \"${prefix}help [command name]\" to get info on a specific command!` });
            
            // Add commands as multiple fields
            for(i = 0; i < uniqueCategories.length; i++){
                var categoryCommands = "";
                for(x = 0; x < names.length; x++){
                    if(categories[x] == uniqueCategories[i]){
                        categoryCommands += "`" + names[x] + "` - " + descriptions[x] + "\n";
                    }
                }

                outputEmbed.addFields(
            		{ name: categoryNames[i], value: categoryCommands, inline: true }
                );
            }

            // Output
		    return message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false }});
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
        if (command.addendum) output += "\n**Further information:** " + command.addendum;
        
        message.reply({ content: output, allowedMentions: { repliedUser: false }});

	},
};