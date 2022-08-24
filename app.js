﻿// New link with slash command scope: https://discord.com/api/oauth2/authorize?client_id=445030573904363540&permissions=321600&scope=bot%20applications.commands
// Require dependencies
const Discord = require('discord.js');
fs = require('fs');
lib = require("./library.js");
mysql = require('mysql2/promise');
maintenance = false;

// Connect to MySQL database
con = mysql.createPool({
    host: "localhost",
    user: "root",
    ***REMOVED***
    database: "nyexbot",
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0
});

// Create a new Discord client, also set some variables
const {token, prefix} = require('./config.json');
Intents = Discord.Intents;
MessageActionRow = Discord.MessageActionRow;
MessageButton = Discord.MessageButton;
MessageSelectMenu = Discord.MessageSelectMenu;
const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES], partials: ["CHANNEL"] });
client.commands = new Discord.Collection();
client.cooldowns = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Add commands to the Collection for executing them dynamically later...
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
    
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	client.commands.set(command.name, command);
}

// When the client is ready, run this code
// This event will only trigger one time after logging in
client.once('ready', async () => {
    // Set presence
	console.log(Date() + '   |   Bot has been started');
	client.user.setPresence({
        status: 'online',
        activities: [{
            name: 'all messages',
            type: 'WATCHING',
        }]
    })
    
    // Deploy slash commands (WIP)
    for(i = 0; i < 1; i++){
        const data = {
    		name: 'captures',
    		description: 'Displays your captures',
    		options: [
    		{
    			name: 'monster_name',
    			description: 'Search for a monster by name (or use "random" for random result)',
    			type: 'STRING',
    		}
    		],
    	};
	
	    const command = await client.guilds.cache.get('516031666456887312')?.commands.create(data);
    }
    
    // Leave a specific server if necessary
    // client.guilds.cache.get("ID").leave();
});

// Log rate limiting
client.on('rateLimit', console.log);

// Load some stuff for the boss code
var bossChance = 8000;   // 1 out of x
var min = Math.ceil(1);
var ranks = ["D", "C", "B", "A", "S", "SS"];
var chances = [23, 30, 20, 14, 9, 4];

// If the bot joins a server, add it to the list of servers and send a joining message
client.on("guildCreate", guild => {
    var serverList = lib.readFile("./data/serverlist.txt");
    serverList += "\n" + guild.id + " (" + guild.name + ")";
    lib.saveFile("./data/serverlist.txt", serverList);
    // Join message
    guild.systemChannel.send("Thank you for inviting me to this server! Some quick tips for server admins & mods:\nUse `,set prefix [prefix]` to change the command prefix!\nUse `,set channel` in the channel where you want me to post my global announcements (for example when I'm updated or when a boss spawns)!");
});

// If the bot leaves a server, set the channel config there to Undefined and remove the server from the list
client.on("guildDelete", guild => {
    // Check if the server had a config folder and update it
    var serverID = guild.id;
    if(fs.existsSync("./data/configs/" + serverID)){
        lib.saveFile("./data/configs/" + serverID + "/channel.txt", "Undefined");
    }
    // Remove it from the server list
    var serverList = lib.readFile("./data/serverlist.txt").split("\n");
    for(i = 0; i < serverList.length; i++){
        if(serverList[i].includes(guild.id)){
            serverList.splice(i, 1);
        }
    }
    lib.saveFile("./data/serverlist.txt", serverList.join("\n"));
});

// Listen for interactions
client.on('interactionCreate', interaction => {
    var user = interaction.user;
    message = interaction;
    user.username = user.username.replace(/\_/g, "").replace(/\*/g, "").replace(/\|/g, "").replace(/\~/g, "").replace(/[\r\n]/gm, "");
    // Maintenance mode: Only allow Index to use the bot!
    if(maintenance){
        if(user.id != "214754022832209921"){
            message.reply({ content: "\u274C The bot is currently undergoing maintenance. Please try again later", allowedMentions: { repliedUser: false }});
            return;
        }
    }

    // Check whether a world boss should spawn or not
    var worldboss = lib.readFile("./data/worldboss.txt");
    if(worldboss === ""){
        var wResult = Math.floor(Math.random() * (Math.floor(bossChance) - min + 1)) + min;
        if(wResult <= min){
            // Spawn a boss with a random rank!
            var rankRand = Math.floor(Math.random() * (Math.floor(100) - min + 1)) + min
            var add_previous = 0;
            var rank = "";
            for(y = 0; y < 6 && rank === ""; y++){
                if(rankRand <= (chances[y] + add_previous)){
                    rank = ranks[y];
                }
                add_previous = add_previous + chances[y];
            }
            lib.saveFile("./data/worldboss.txt", rank);
            
            // Alert users about the boss in all configured channels
            fs.readdir("./data/configs", (err, files) => {
                for(i = 0; i < files.length; i++){
                    var channelID = lib.readFile("./data/configs/" + files[i] + "/channel.txt");
                    if(channelID !== "Undefined"){
                        client.channels.cache.get(channelID).send("**A world boss (rank " + rank + ") has spawned!**\nUse the command `wb` to deal damage to it and become eligible for rewards!");
                    }
                }
            });
            
        }
    }
    
	var commandName = "";
	if(interaction.isSelectMenu()){
	    var interactionData = interaction.customId.split("|");
	    if(interactionData[0] != "any" && interactionData[0] != user.id) return;
	    var args = [interaction.values[0].trim()];
		commandName = interactionData[1];
	}
	else if(interaction.isButton()){
	    if(interaction.customId === 'previousbtn' || interaction.customId === 'randbtn' || interaction.customId === 'nextbtn' || interaction.customId === 'nickbutton') return;
		var interactionData = interaction.customId.split("|");
		if(interactionData[0] != "any" && interactionData[0] != user.id) return;
		var args = interactionData[1].split(" ");
		commandName = args[0];
		args.splice(0, 1);
	}
	else if (interaction.isCommand()){
		commandName = interaction.commandName;
		var options = interaction.options._hoistedOptions;
		var args = "";
		for(i = 0; i < options.length; i++){
			args += options[i].value;
		}
		args = args.trim().split(/ +/);
	}
	
	// Check for commands and try to execute them
	const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
	if (!command) return;
	try {
		// Implement command cooldown if it exists
		const { cooldowns } = client;
		if (!cooldowns.has(command.name)) {
			cooldowns.set(command.name, new Discord.Collection());
		}
		const now = Date.now();
		const timestamps = cooldowns.get(command.name);
		const cooldownAmount = (command.cooldown || 1) * 1000;
		if (timestamps.has(user.id)) {
			const expirationTime = timestamps.get(user.id) + cooldownAmount;
		
			if (now < expirationTime) {
				const timeLeft = (expirationTime - now) / 1000;
				return message.reply({ content: `@ __**` + user.username + `**__\n\u274C Please wait ${timeLeft.toFixed(1)} more second(s) before using \`${command.name}\` again!`, allowedMentions: { repliedUser: false }});
			}
		}
		timestamps.set(user.id, now);
		setTimeout(() => timestamps.delete(user.id), cooldownAmount);
		
		// Execute command
		command.execute(message, user, args);
	} catch (error) {
		console.error("\nUser: " + user.username + "\nTrigger: " + message.customId + "\nServer: " + message.guild + "\nTime: " + message.createdAt);
		console.error(error);
		message.reply({ content: "@ __**" + user.username + "**__```glsl\n# An error has occurred!```All relevant details have automatically been sent to the main server for further investigation", allowedMentions: { repliedUser: false }})
	    
	    // Create submission message
        var outputEmbed = new Discord.MessageEmbed()
        	.setColor('#fc0303')
        	.setTitle(error.toString())
        	.setDescription("```\nCause of error:\n" + user.tag + " (" + user.id + ")" + " used this interaction:\n" + message.customId + "```")
        	.setFooter({ text: "Sent from server with ID " + message.guild + "\n" + message.createdAt });
        
        // Send the error text to the main server
        client.channels.cache.get("859477509178654792").send({ embeds: [outputEmbed] });
	}
	
});

// Listen for messages
client.on('messageCreate', async message => {
	var user = message.author;
    user.username = user.username.replace(/\_/g, "").replace(/\*/g, "").replace(/\|/g, "").replace(/\~/g, "");

    // Check whether a world boss should spawn or not
    var worldboss = lib.readFile("./data/worldboss.txt");
    if(worldboss === ""){
        var wResult = Math.floor(Math.random() * (Math.floor(bossChance) - min + 1)) + min;
        if(wResult <= min){
            // Spawn a boss with a random rank!
            var rankRand = Math.floor(Math.random() * (Math.floor(100) - min + 1)) + min
            var add_previous = 0;
            var rank = "";
            for(y = 0; y < 6 && rank === ""; y++){
                if(rankRand <= (chances[y] + add_previous)){
                    rank = ranks[y];
                }
                add_previous = add_previous + chances[y];
            }
            lib.saveFile("./data/worldboss.txt", rank);
            
            // Alert users about the boss in all configured channels
            fs.readdir("./data/configs", (err, files) => {
                for(i = 0; i < files.length; i++){
                    var channelID = lib.readFile("./data/configs/" + files[i] + "/channel.txt");
                    if(channelID !== "Undefined"){
                        client.channels.cache.get(channelID).send("**A world boss (rank " + rank + ") has spawned!**\nUse the command `wb` to deal damage to it and become eligible for rewards!");
                    }
                }
            });
            
        }
    }
    
    // Check if the server has a custom prefix and load it
    commandPrefix = prefix;
    if(message.guild !== null){
        var serverID = message.guildId;
        if(fs.existsSync("./data/configs/" + serverID)){
           commandPrefix = lib.readFile("./data/configs/" + serverID + "/prefix.txt");
        }
    }
    
    // If the message was sent in the updates channel on the main server and is not a minor patch then crosspost it to all other configured announcement channels (except the one on the main server)
    if(message.channel.id == "731236740974510100" && !message.content.toLowerCase().includes("[minor patch]")){
        fs.readdir("./data/configs", (err, files) => {
            for(i = 0; i < files.length; i++){
                var channelID = lib.readFile("./data/configs/" + files[i] + "/channel.txt");
                if(channelID !== "Undefined" && channelID !== "516038839949852695"){
                    client.channels.cache.get(channelID).send("__**Update:**__ " + message.content.trim());
                }
            }
        });
    }
    
    // If the message was sent by a bot or doesn't start with the prefix, stop
    if (!message.content.startsWith(commandPrefix) || user.bot) return;

    // Maintenance mode: Only allow Index to use the bot!
    if(maintenance){
        if(user.id != "214754022832209921"){
            message.reply({ content: "\u274C The bot is currently undergoing maintenance. Please try again later", allowedMentions: { repliedUser: false }});
            return;
        }
    }

    // Turn the message into an array of values seperated by whitespace, remove the prefix and save the command itself as a seperate variable
    const args = message.content.slice(commandPrefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    // Check for commands and try to execute them
	const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
	if (!command) return;
    try {
        // Implement command cooldown if it exists
        const { cooldowns } = client;
        if (!cooldowns.has(command.name)) {
        	cooldowns.set(command.name, new Discord.Collection());
        }
        const now = Date.now();
        const timestamps = cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 1) * 1000;
        if (timestamps.has(user.id)) {
        	const expirationTime = timestamps.get(user.id) + cooldownAmount;
        
        	if (now < expirationTime) {
        		const timeLeft = (expirationTime - now) / 1000;
        		return message.reply({ content: `\u274C Please wait ${timeLeft.toFixed(1)} more second(s) before using \`${command.name}\` again!`, allowedMentions: { repliedUser: false }});
        	}
        }
        timestamps.set(user.id, now);
        setTimeout(() => timestamps.delete(user.id), cooldownAmount);
        
        // Execute command
	    command.execute(message, user, args);
    } catch (error) {
	    console.error("\nUser: " + user.username + "\nTrigger: " + message.content + "\nServer: " + message.guild + "\nTime: " + message.createdAt);
	    console.error(error);
		message.reply({ content: "@ __**" + user.username + "**__```glsl\n# An error has occurred!```All relevant details have automatically been sent to the main server for further investigation", allowedMentions: { repliedUser: false }})
	    
	    // Create submission message
        var outputEmbed = new Discord.MessageEmbed()
        	.setColor('#fc0303')
        	.setTitle(error.toString())
        	.setDescription("```\nCause of error:\n" + user.tag + " (" + user.id + ")" + " sent this message:\n" + message.content + "```")
        	.setFooter({ text: "Sent from server with ID " + message.guild + "\n" + message.createdAt });
        
        // Send the error text to the main server
        if(!maintenance){client.channels.cache.get("859477509178654792").send({ embeds: [outputEmbed] });}
        
	}

});

// Login to Discord with your app's token
client.login(token);

// Log to know the bot is still alive
var stillAlive = setInterval(function() {
    console.log("Still alive! " + Date());
}, 300 * 1000);