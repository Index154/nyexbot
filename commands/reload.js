module.exports = {
	name: 'reload',
	usages: [''],
	descriptions: ['Reloads a command, activating any changes made to the code since the latest reload or restart'],
    shortDescription: 'Reload commands',
	aliases:["rl","rld"],
    category: 'admin',
	
	execute(message, user, args) {
		if (!args.length) return message.reply({ content: `\u274C You didn't specify a command to reload!`, allowedMentions: { repliedUser: false }});
        const commandName = args[0].toLowerCase();
        const command = message.client.commands.get(commandName)
            || message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
            
        if (!command) return message.reply({ content: `\u274C There is no command with name or alias \`${commandName}\`!`, allowedMentions: { repliedUser: false }});
        
        delete require.cache[require.resolve(`./${command.name}.js`)];
        
        try {
        	const newCommand = require(`./${command.name}.js`);
        	message.client.commands.set(newCommand.name, newCommand);
        } catch (error) {
            console.log(Date() + '   |   Reload called by ' + user.tag + " in " + message.channel + " with message: " + message.content);
        	console.error(error);
        	message.reply({ content: `\u274C There was an error while reloading the command \`${command.name}\`:\n\`${error.message}\``, allowedMentions: { repliedUser: false }});
        }

        message.reply({ content: `\`${command.name}\` was reloaded!`, allowedMentions: { repliedUser: false }});

    },
};