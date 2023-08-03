// New link with slash command scope: https://discord.com/api/oauth2/authorize?client_id=445030573904363540&permissions=321600&scope=bot%20applications.commands
// Test branch invite link: https://discord.com/api/oauth2/authorize?client_id=1063139030545485905&permissions=321600&scope=bot%20applications.commands
// Require dependencies
const Discord = require('discord.js');
fs = require('fs');
lib = require("./library.js");
mysql = require('mysql2/promise');
var {token, prefix, testToken, testPrefix, SQLiv, hashedSQLpass} = require('./config.json');

// Change some values if the bot is on the test branch
const branch = lib.readFile("./isTestBranch.txt");
var appName = "nyexbot";
if(branch == "YES"){
    prefix = testPrefix;
    token = testToken;
    appName = "testapp";
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
Intents = Discord.GatewayIntentBits;
Partials = Discord.Partials;
ActionRowBuilder = Discord.ActionRowBuilder;
ButtonBuilder = Discord.ButtonBuilder;
StringSelectMenuBuilder = Discord.StringSelectMenuBuilder;
const client = new Discord.Client({ intents: [Intents.MessageContent, Intents.Guilds, Intents.GuildMessages, Intents.DirectMessages], partials: [Partials.Channel] });
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
	console.log(Date() + '  |  ' + appName + ' has been started');
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
client.rest.on('rateLimited', console.log);

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
    message.author = message.user;
    user.username = user.username.replace(/\_/g, "").replace(/\*/g, "").replace(/\|/g, "").replace(/\~/g, "").replace(/[\r\n]/gm, "");
    
    // On the test branch: Only react to the bot owner
    if(branch == "YES" && user.id != "214754022832209921") return;

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
	if(interaction.isStringSelectMenu()){
	    var interactionData = interaction.customId.split("|");
	    if(interactionData[0] != "any" && interactionData[0] != user.id) return;
	    var args = [interaction.values[0].trim()];
		commandName = interactionData[1];
	}
	else if(interaction.isButton()){
	    if(interaction.customId === 'previousbtn' || interaction.customId === 'randbtn' || interaction.customId === 'nextbtn' || interaction.customId === 'rerollbutton') return;
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
	
    // Check if the server has a custom prefix and load it
    commandPrefix = prefix;
    if(message.guildId !== null){
        if(fs.existsSync("./data/configs/" + message.guildId)){
           commandPrefix = lib.readFile("./data/configs/" + message.guildId + "/prefix.txt");
        }
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
		command.execute(message, user, args, commandPrefix);
	} catch (error) {
		lib.error(message, error, "");
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
        if(fs.existsSync("./data/configs/" + message.guildId)){
           commandPrefix = lib.readFile("./data/configs/" + message.guildId + "/prefix.txt");
        }
    }
    
    // If the message was sent in the updates channel on the main server and is not a minor patch then crosspost it to all other configured announcement channels (except the one on the main server)
    // Also send it to all signed-up users in DMs
    if(branch != "YES" && message.channel.id == "731236740974510100" && !message.content.toLowerCase().includes("[minor patch]")){
        // Define embed
        var updateEmbed = new Discord.EmbedBuilder()
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
    
    /*
    // If the message is part of the bad messages list then react to it
    var badMessages = lib.readFile("./data/bad_messages.txt").split("\n");
    for(i = 0; i < badMessages.length; i++){
        if(message.content.toLowerCase().trim() == badMessages[i]){
            message.react("<:laghu:1072954386935975956>");
        }
    }
    */

    // If the message was sent by a bot or doesn't start with the prefix, stop
    if (!message.content.startsWith(commandPrefix) || user.bot) return;

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
	    command.execute(message, user, args, commandPrefix);
    } catch (error) {
	    lib.error(message, error, "");
	}

});

// Login to Discord with token
client.login(token);

// Main-branch exclusive functions
if(branch != "YES"){

    // Log to know the bot is still alive every 5 minutes
    var stillAlive = setInterval(function() {
        console.log("Still alive! " + Date());
    }, 300 * 1000);

    // Check reminders once per minute
    var reminderCheck = setInterval(async function() {

        var d = new Date();
        var currentEpoch = Math.floor(d.getTime() / 1000);
        var maxTimestamp = currentEpoch + 30;
    
        // Query database table for reminders matching the current timestamp +/- 30 seconds
        var [rows] = await con.execute({sql: `
            SELECT reminderId, text, userId, channelId, timestamp, repeating
            FROM reminders
            WHERE timestamp BETWEEN 0 AND ${maxTimestamp};
        `, rowsAsArray: false });
    
        // Loop through all the activated reminders
        for(i = 0; i < rows.length; i++){
    
            // If the reminder is set to repeat then update it with a new notification time. Otherwise delete it from the database
            var repeatingInfo = "";
            if(lib.exists(rows[i].repeating)){
                
                // If the repeating interval is a multiple of years then account for leap days
                var newTimestamp = currentEpoch + rows[i].repeating;
                if(rows[i].repeating % 31536000 == 0){ newTimestamp = currentEpoch + lib.correctLeapDays(rows[i].repeating); }
                repeatingInfo = "\n(Repeating in " + lib.secondsToTime(rows[i].repeating) + ")";
    
                var [rowsB] = await con.execute({sql: `
                    UPDATE reminders
                    SET timestamp = ${newTimestamp}
                    WHERE reminderId = ${rows[i].reminderId};
                `, rowsAsArray: false });
    
            }else{
                var [rowsC] = await con.execute({sql: `
                    DELETE
                    FROM reminders
                    WHERE reminderId = ${rows[i].reminderId};
                `, rowsAsArray: false });
            }
    
            // Send a notification for every result that was found. Send it in DMs if the original channel can't be identified
            var reminderMessage = `<@${rows[i].userId}>` + " - This is your reminder with the ID " + rows[i].reminderId + ":\n" + rows[i].text + repeatingInfo;
            var channel = await client.channels.cache.get(rows[i].channelId);
            if(channel == undefined){
                var tempUser = await client.users.fetch(rows[i].userId, false);
                tempUser.send({ content: reminderMessage });
            }else{
                channel.send({ content: reminderMessage });
            }
        
        }
    
    }, 60 * 1000);

    // Check logs every 6 hours
    var logCheck = setInterval(async function(){

        // Get error log
        var log = lib.readFile("/root/.pm2/logs/app-error.log");
        if(!lib.exists(log)){log = "Empty";}
        log = log.split("\n");
        
        // If the log isn't empty, post the content to Discord and empty the file
        if(log.length > 1){
            
            // If the log contains too many lines, split it into multiple messages
            var linesPerMessage = 70;
            for(i = 0; i < log.length - 1; i++){

                var tempMessage = "";
                if( ((i + 1) % linesPerMessage) == 0 || i == log.length - 1 ){
                    client.channels.cache.get("1136023345373122560").send("```js\n" + tempMessage + "```");
                    tempMessage = "";
                }

            }

            // Clear log file
            lib.saveFile("/root/.pm2/logs/app-error.log", "");

        }

    }, 6 * 60 * 1000);

}

// Check for new posts online every 30 minutes
var newsCheck = setInterval(async function() {

    // Define list of sites to check and the HTML elements to check for changes
    var siteList = [
        {name: "Uno Makoto", alias: 'UNO', ***REMOVED***}, 
        {name: "Zheng", alias: 'ZHG', ***REMOVED***},
        {name: "Capcom", alias: 'CAP', ***REMOVED***},
        {name: "Mikansu", alias: 'MIK', ***REMOVED***},
        {name: "Solo Leveling", alias: 'SOLO', ***REMOVED***},
        {name: "Canan", alias: 'CAN', ***REMOVED***},
        {name: "Fanatic F", alias: 'FF', ***REMOVED***},
        {name: "Azur Lane", alias: 'AZL', ***REMOVED***},
        {name: "YuGiOh", alias: 'YGO', ***REMOVED***},
        {name: "Ninapai", alias: 'NINP', ***REMOVED***},
        {name: "Genshin", alias: "GSH", ***REMOVED***}
    ];
    var updateList = [];
    var savePath = "../nyextest/data/sitedata/";

    // Go through the site list
    for(i = 0; i < siteList.length; i++){

        // Fetch site body
        var body = await lib.getHTML(siteList[i].link);
        var reg = new RegExp(siteList[i].pattern, "g");
        var results = await body.match(reg);

        // Compare the first found pattern match to the previously saved one
        var filePath = savePath + siteList[i].name + ".txt";
        var previousResult = lib.readFile(filePath);
        if(!lib.exists(previousResult)){previousResult = "None";}
        if(!lib.exists(results) || results.length < 1){
            lib.error("", "newsCheck() Error: No pattern match found for site " + siteList[i].alias, "");
        }
        else if(results[0] != previousResult){
            // Add this list to the updated sites list
            updateList.push("<" + siteList[i].link + ">");

            // Save the pattern match for the next comparison
            lib.saveFile(filePath, results[0]);
        }

    }

    // Notify about the changes
    if(updateList.length > 0){
        updateList = updateList.join("\n");
        // Send message in my channel or DM me
        client.channels.cache.get("516288921127092234").send("**Update(s) found!**\n" + updateList);
    }
    
}, 30 * 60 * 1000);