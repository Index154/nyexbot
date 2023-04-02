var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'submit',
	usages: ['[text]'],
	descriptions: ['Sends your feedback or bug report to the main server for the developer to see'],
    shortDescription: 'Send feedback',
    weight: 10,
	cooldown: 60,
	aliases: ['sub'],
    addendum: [
        '- Has an increased cooldown of one minute',
        '- The submitted message is sent to a special channel on the main server of the bot'
    ],
    category: 'settings',
	
	execute(message, user, args) {
	    var allArgs = args.join(" ");
        
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
        
        // If the user isn't registered yet, stop the command
        if(!fs.existsSync(dir)){
            message.reply({ content: "\u274C Use `" + prefix + "encounter` first to create an account!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        if(args.length < 1){
            message.reply({ content: "\u274C Please include your feedback or bug report after the command name!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // Create submission message
        var outputEmbed = new Discord.MessageEmbed()
        	.setColor('#0099ff')
        	.setTitle("Submission by __" + user.tag + "__\n(ID: " + user.id + ")")
        	.setDescription("```\n" + allArgs + "```")
        	.setFooter({ text: "Sent from server with ID " + message.guild + "\n" + message.createdAt });
        
        // Send the submitted text to the main server
        message.client.channels.cache.get("859477509178654792").send({ embeds: [outputEmbed] });
        
        // Send confirmation to the user
        message.reply({ content: "Your feedback or bug report has been submitted!\nYou may make another submission after the one-minute cooldown has passed", allowedMentions: { repliedUser: false }});
        
	},
};