var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'help',
	descriptions: ['Displays a list of commands', 'Displays the details of a command'],
	usages: ['', '[command name]'],
	
	execute(message, user, args) {
	    const data = [];
        const { commands } = message.client;

        // Check if the server has a custom prefix and load it
        if(message.guild !== null){
            var serverID = message.guildId;
            if(fs.existsSync("./data/configs/" + serverID)){
                prefix = lib.readFile("./data/configs/" + serverID + "/prefix.txt");
            }
        }

        if (!args.length) {
            data.push(commands.map(command => command.name));
            var newData = data[0];
            var halfwayThrough = Math.floor(newData.length / 2)
            
            var arrayFirstHalf = newData.slice(0, halfwayThrough);
            var arrayFirst = arrayFirstHalf.join("\n");
            var arraySecondHalf = newData.slice(halfwayThrough, newData.length);
            var arraySecond = arraySecondHalf.join("\n");
            
            // Assemble a basic embed
    	    var outputEmbed = new Discord.MessageEmbed()
            	.setColor('#0099ff')
            	.setTitle("Command list:")
            	.setDescription("Visit https://indexnight.com/rpg_info.php for in-depth explanations of everything there is to know about the game!\nIf you are interested in directly interacting with the bot's creator or want to know future update plans then join the main server: https://discord.gg/Sz72qan\nIf you have a problem with the bot then please use the command `" + prefix + "submit`!")
            	.addFields(
            		{ name: 'Column 1', value: arrayFirst, inline: true },
            		{ name: "Column 2", value: arraySecond, inline: true }
                )
                .setFooter({ text: `You can send \"${prefix}help [command name]\" to get info on a specific command!` });
            
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