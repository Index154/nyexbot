// New link with slash command scope: https://discord.com/api/oauth2/authorize?client_id=445030573904363540&permissions=321600&scope=bot%20applications.commands
// Test branch invite link: https://discord.com/api/oauth2/authorize?client_id=1063139030545485905&permissions=321600&scope=bot%20applications.commands
// Require dependencies
const Discord = require('discord.js');
fs = require('fs');
lib = require("./library.js");
mysql = require('mysql2/promise');
var {token, prefix, testToken, testPrefix, SQLiv, hashedSQLpass} = require('./config.json');
maintenance = false;

// Change some values if the bot is on the test branch
const branch = lib.readFile("./isTestBranch.txt");
if(branch == "YES"){
    prefix = testPrefix;
    token = testToken;
}

// Decrypt database password
const crypto = require('crypto');
var algorithm = 'aes-256-ctr';
var SQLsecretKey = "Iu8pe2kdN0w75vpAHUK5qisRb4RoFfvW";
var decipher = crypto.createDecipheriv(algorithm, SQLsecretKey, Buffer.from(SQLiv, 'hex'));
var decrpyted = Buffer.concat([decipher.update(Buffer.from(hashedSQLpass, 'hex')), decipher.final()]);
var SQLpassword = decrpyted.toString();

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
    /*
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
    */
    
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
    
    // On the test branch: Only react to the bot owner
    if(branch == "YES" && user.id != "214754022832209921") return;
    
    // Maintenance mode: Only allow Index to use the bot!
    if(maintenance){
        if(user.id != "214754022832209921"){
            message.reply({ content: "\u274C The bot is currently undergoing maintenance. Please try again later", allowedMentions: { repliedUser: false }});
            return;
        }
    }

    // Check whether a world boss should spawn or not
    var worldboss = lib.readFile("./data/worldboss.txt");
    if(branch != "YES" && worldboss === ""){
        var wResult = Math.floor(Math.random() * (Math.floor(bossChance) - min + 1)) + min;
        if(wResult <= min){
            // Spawn a boss with a random rank!
            var rankRand = lib.rand(1, 100);
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
                    var serverPrefix = lib.readFile("./data/configs/" + files[i] + "/prefix.txt");
                    var channelID = lib.readFile("./data/configs/" + files[i] + "/channel.txt");
                    if(channelID !== "Undefined"){
                        client.channels.cache.get(channelID).send("**A world boss (rank " + rank + ") has spawned!**\nUse the command `" + serverPrefix + "wb` to deal damage to it and become eligible for rewards!");
                    }
                }
            });

            // Also alert the signed-up users in DMs
            fs.readdir("./userdata", (err, files) => {
                for(x = 0; x < files.length; x++){
                    // Check if a user wants to receive announcements in DMs
                    var userDMSetting = lib.readFile("./userdata/" + files[x] + "/dmupdates.txt");
                    if(userDMSetting == "yes"){
                        client.users.fetch(files[x], false).then((tempUser) => {
                            tempUser.send("**A world boss (rank " + rank + ") has spawned!**\nUse the command `.wb` to deal damage to it and become eligible for rewards!");
                        });
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
	    
	    // Create submission message
        var outputEmbed = new Discord.MessageEmbed()
        	.setColor('#fc0303')
        	.setTitle(error.toString())
        	.setDescription("```\nCause of error:\n" + user.tag + " (" + user.id + ")" + " used this interaction:\n" + message.customId + "```")
        	.setFooter({ text: "Sent from server with ID " + message.guild + "\n" + message.createdAt });
        
        // Notify about the error
        if(branch == "YES"){
            message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false } });
        }else{
            message.reply({ content: "@ __**" + user.username + "**__```glsl\n# An error has occurred!```All relevant details have automatically been sent to the main server for further investigation", allowedMentions: { repliedUser: false }});
            if(!maintenance){client.channels.cache.get("859477509178654792").send({ embeds: [outputEmbed] });}
        }
	}
	
});

// Listen for messages
client.on('messageCreate', async message => {
	var user = message.author;
    user.username = user.username.replace(/\_/g, "").replace(/\*/g, "").replace(/\|/g, "").replace(/\~/g, "");

    // On the test branch: Only react to the bot owner
    if(branch == "YES" && user.id != "214754022832209921") return;

    // Check whether a world boss should spawn or not
    var worldboss = lib.readFile("./data/worldboss.txt");
    if(branch != "YES" && worldboss === ""){
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
                    var serverPrefix = lib.readFile("./data/configs/" + files[i] + "/prefix.txt");
                    var channelID = lib.readFile("./data/configs/" + files[i] + "/channel.txt");
                    if(channelID !== "Undefined"){
                        client.channels.cache.get(channelID).send("**A world boss (rank " + rank + ") has spawned!**\nUse the command `" + serverPrefix + "wb` to deal damage to it and become eligible for rewards!");
                    }
                }
            });

            // Also alert the signed-up users in DMs
            fs.readdir("./userdata", (err, files) => {
                for(x = 0; x < files.length; x++){
                    // Check if a user wants to receive announcements in DMs
                    var userDMSetting = lib.readFile("./userdata/" + files[x] + "/dmupdates.txt");
                    if(userDMSetting == "yes"){
                        client.users.fetch(files[x], false).then((tempUser) => {
                            tempUser.send("**A world boss (rank " + rank + ") has spawned!**\nUse the command `.wb` to deal damage to it and become eligible for rewards!");
                        });
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
    // Also send it to all signed-up users in DMs
    if(branch != "YES" && message.channel.id == "731236740974510100" && !message.content.toLowerCase().includes("[minor patch]")){
        // Define embed
        var updateEmbed = new Discord.MessageEmbed()
                .setTitle("New bot update")
                .setDescription(message.content.trim());

        fs.readdir("./data/configs", (err, files) => {
            for(i = 0; i < files.length; i++){
                var channelID = lib.readFile("./data/configs/" + files[i] + "/channel.txt");
                if(channelID !== "Undefined" && channelID !== "516038839949852695"){
                    client.channels.cache.get(channelID).send({ embeds: [updateEmbed] });
                }
            }
        });

        fs.readdir("./userdata", (err, files) => {
            for(x = 0; x < files.length; x++){
                // Check if a user wants to receive announcements in DMs
                var userDMSetting = lib.readFile("./userdata/" + files[x] + "/dmupdates.txt");
                if(userDMSetting == "yes"){
                    client.users.fetch(files[x], false).then((tempUser) => {
                        tempUser.send({ embeds: [updateEmbed] });
                    });
                }
            }
        });
    }
    
    // If the message is part of the bad messages list then react to it
    var badMessages = lib.readFile("./data/bad_messages.txt").split("\n");
    for(i = 0; i < badMessages.length; i++){
        if(message.content.toLowerCase().trim() == badMessages[i]){
            message.react("<:laghu:1072954386935975956>");
        }
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
	    
	    // Create submission message
        var outputEmbed = new Discord.MessageEmbed()
        	.setColor('#fc0303')
        	.setTitle(error.toString())
        	.setDescription("```\nCause of error:\n" + user.tag + " (" + user.id + ")" + " sent this message:\n" + message.content + "```")
        	.setFooter({ text: "Sent from server with ID " + message.guild + "\n" + message.createdAt });
        
        // Notify about the error
        if(branch == "YES"){
            message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false } });
        }else{
            message.reply({ content: "@ __**" + user.username + "**__```glsl\n# An error has occurred!```All relevant details have automatically been sent to the main server for further investigation", allowedMentions: { repliedUser: false }});
            if(!maintenance){client.channels.cache.get("859477509178654792").send({ embeds: [outputEmbed] });}
        }        
	}

});

// Login to Discord with your app's token
client.login(token);

// Log to know the bot is still alive
var stillAlive = setInterval(function() {
    console.log("Still alive! " + Date());
}, 300 * 1000);