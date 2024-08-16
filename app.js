// Invite links:
// New invite link with slash command scope: https://discord.com/api/oauth2/authorize?client_id=445030573904363540&permissions=321600&scope=bot%20applications.commands
// Test branch invite link: https://discord.com/api/oauth2/authorize?client_id=1063139030545485905&permissions=321600&scope=bot%20applications.commands

// Require dependencies:
    // Discord.js is the required main Discord library
    // FS is for filesystem operations like reading from files and writing to files
    // lib is my own library of functions
    // mysql2/promise is for connecting to the local database
const Discord = require('discord.js');
fs = require('fs');
lib = require("./library.js");
mysql = require('mysql2/promise');
globalVars = JSON.parse(lib.readFile("./globalVariables.json"));

// Load important configs
var {token, prefix, testToken, testPrefix, SQLiv, hashedSQLpass, isTestBranch} = require('./config.json');

// Change some values if the bot is on the test branch
var appName = "nyexbot";
if(isTestBranch){
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
    password: SQLpassword,
    database: "nyexbot",
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0
});

// Create a new bot client with the necessary parameters and Discord intents
Intents = Discord.GatewayIntentBits;
Partials = Discord.Partials;
ActionRowBuilder = Discord.ActionRowBuilder;
ButtonBuilder = Discord.ButtonBuilder;
StringSelectMenuBuilder = Discord.StringSelectMenuBuilder;
const client = new Discord.Client({ intents: [Intents.MessageContent, Intents.Guilds, Intents.GuildMessages, Intents.DirectMessages], partials: [Partials.Channel] });

// Make some collections to put the commands and their cooldowns into
client.commands = new Discord.Collection();
client.cooldowns = new Discord.Collection();

// Add all js files in the commands folder to the collection so they can be executed dynamically later
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
    
	// Set a new item in the collection with the key as the command name and the value as the exported module containing the actual code
	client.commands.set(command.name, command);
}

// When the client is ready, run this code
// This event will only trigger once after the bot has successfully started
client.once('ready', async () => {
    // Log bot start time
    console.log(Date() + '  |  ' + appName + ' has been started');

    // Set presence
	client.user.setPresence({
        status: 'online',
        activities: [{
            name: 'all messages',
            type: 'WATCHING',
        }]
    });
    
    // Deploy slash commands - Currently commented out and unused because it's poopy and useless and annoying to work on
    // It's probably best to make a collection object for this later if I work on it again. Maybe the definitions for the slash commands can be put into the command files that already exist as extra module exports
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
	
	    const command = await client.guilds.cache.get(globalVars.mainServerId)?.commands.create(data);
    }
    */
    
    // Uncomment this and edit the ID to make the bot leave a specific server on startup
    // client.guilds.cache.get("ID").leave();
});

// Log it when the bot gets rate-limited by Discord for sending messages too quickly
client.rest.on('rateLimited', console.log);

// Prepare some variables for the boss code
var ranks = ["D", "C", "B", "A", "S", "SS"];
var chances = [23, 30, 20, 14, 9, 4];   // The chances for each rank of boss to be chosen, out of 100

// If the bot joins a server, add it to the list of servers and send a joining message
client.on("guildCreate", guild => {
    var serverList = lib.readFile("./data/serverlist.txt");
    serverList += "\n" + guild.id + " (" + guild.name + ")";
    lib.saveFile("./data/serverlist.txt", serverList);
    
    // Make config files for new servers
    if(!fs.existsSync("./data/configs/" + guild.id)){
        fs.mkdirSync("./data/configs/" + guild.id);
        lib.saveFile("./data/configs/" + guild.id + "/channel.txt", "Undefined");
        lib.saveFile("./data/configs/" + guild.id + "/prefix.txt", prefix);
        lib.saveFile("./data/configs/" + guild.id + "/updates.txt", "Undefined");
    }

    // Joining message
    guild.systemChannel.send("Thank you for inviting me to this server! Some quick tips for server admins & mods:\nUse `,set prefix [prefix]` to change the command prefix!\nUse `,set channel` in the channel where you want me to post my global announcements (for example when I'm updated or when a boss spawns)!");
});

// If the bot leaves a server, set the channel config for that server to Undefined and remove the server from the list
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

// Boss spawning function
function trySpawnBoss(message){

    // Determine whether a world boss should spawn or not
    var worldboss = lib.readFile("./data/worldboss.txt");
    // If this is the test branch or there already is an active boss then stop
    if(!isTestBranch && worldboss === ""){
        // Random event math
        var bossRoll = lib.rand(1, globalVars.bossRate);
        if(bossRoll <= 1){
            // Spawn a boss! Determine the rank first
            var rankRand = lib.rand(1, 100);
            var addPrevious = 0;
            var rank = "";
            for(y = 0; y < 6 && rank === ""; y++){
                if(rankRand <= (chances[y] + addPrevious)){
                    rank = ranks[y];
                }
                addPrevious = addPrevious + chances[y];
            }
            lib.saveFile("./data/worldboss.txt", rank);

            var outputEmbed = new Discord.EmbedBuilder()
                .setColor('#0099ff')
                .setTitle("Worldboss notification")
                .setDescription("**A world boss (rank " + rank + ") has spawned!**\nUse the command `wb` to deal damage to it!");
            
            lib.notifyAll("0", message, outputEmbed, "bosses");
        }
    }
}

// Listen for interactions (this includes slash commands, button presses and menu selections)
client.on('interactionCreate', interaction => {
    // Define some necessary variables. "Rename" some of them so the code is closer to the message event code further below
    var user = interaction.user;
    message = interaction;
    message.author = message.user;
    // Remove special characters from usernames to prevent weird stuff and formatting issues
    user.username = user.username.replace(/\_/g, "").replace(/\*/g, "").replace(/\|/g, "").replace(/\~/g, "").replace(/[\r\n]/gm, "");
    
    // On the test branch: Ignore all messages that weren't sent by the bot admin
    if(isTestBranch && user.id != globalVars.adminUserId) return;
    
    // Process the actual interaction now
    // For interactive elements which should trigger a command when clicked I fill the customId field with three values: The ID of the user the interaction element is restricted to (or "any" for all users), the command that should be executed when the element is clicked and whether it's an interaction that should lead to the original message being edited
	var commandName = "";
	if(interaction.isStringSelectMenu()){
        // The interaction came from a selection menu (only used in the class command)
	    var interactionData = interaction.customId.split("|");
	    if(interactionData[0] != "any" && interactionData[0] != user.id) return;
        // For these elements the command arguments are found in the values of the selected menu option
	    var args = [interaction.values[0].trim()];
		commandName = interactionData[1];
	}
	else if(interaction.isButton()){
        // The interaction came from a button (most common)
        // Ignore buttons of special types used for paged embed navigation. Those interactions are handled by the collectors from the respective library functions instead
	    if(interaction.customId === 'previousbtn' || interaction.customId === 'randbtn' || interaction.customId === 'nextbtn' || interaction.customId === 'rerollbutton') return;
		var interactionData = interaction.customId.split("|");
		if(interactionData[0] != "any" && interactionData[0] != user.id) return;
        // Event button behavior
        if(interaction.customId.includes("|event|")){
            lib.randomEvent(interaction, user);
            return;
        }
        // Special "fix" for reminder buttons that may need a lot of text in the executed command which would not fit into the customId property
        if(interactionData[1].includes("customCommand")){interactionData[1] = interactionData[1].slice(0, -13) + interaction.message.content.split("\n")[1]}
		var args = interactionData[1].split(" ");
		commandName = args[0];
		args.splice(0, 1);
	}
	else if (interaction.isCommand()){
        // The interaction came from a slash command (lol)
		commandName = interaction.commandName;
		var options = interaction.options._hoistedOptions;
		var args = "";
		for(i = 0; i < options.length; i++){
			args += options[i].value;
		}
		args = args.trim().split(/ +/);
	}
	
    // Check if the server the interaction was used in has a custom command prefix and load it
    commandPrefix = prefix;     // Idk why I used a new variable for this
    if(message.guildId !== null){
        if(fs.existsSync("./data/configs/" + message.guildId)){
           commandPrefix = lib.readFile("./data/configs/" + message.guildId + "/prefix.txt");
        }
    }

	// Find a command in the collection with a name or alias matching the string obtained from the interaction
	const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
	if (!command) return;

    // Implement the command cooldown
	try {
        // Create a collection of collections of cooldown timestamps for each command, stored in the client
		const { cooldowns } = client;
		if (!cooldowns.has(command.name)) {
			cooldowns.set(command.name, new Discord.Collection());
		}
		const now = Date.now();
		const timestamps = cooldowns.get(command.name);
        // Use the default cooldown of 1 second if nothing else has been explicitly defined
		const cooldownAmount = (command.cooldown || 1) * 1000;
		if (timestamps.has(user.id)) {
            // If there is an existing timestamp for the user in the collection then make them wait
			const expirationTime = timestamps.get(user.id) + cooldownAmount;
			if (now < expirationTime) {
				const timeLeft = (expirationTime - now) / 1000;
                output = `\n\u274C Please wait ${timeLeft.toFixed(1)} more second(s) before using \`${command.name}\` again!\n\u2800\n\u2800\n\u2800\n\u2800`;

                // If the command was called using a special button then edit the original message instead of sending a new one
                if(lib.exists(message.message) && message.customId.includes("embedEdit")){
                    message.deferUpdate();
                    message.message.embeds[0].data.description = output;
                    message.message.edit({ embeds: [message.message.embeds[0]]});
                    return;
                }

				return message.reply({ content: `@ __**` + user.username + `**__` + output, allowedMentions: { repliedUser: false }});
			}
		}
        // Set a new timestamp for the user and for this command
		timestamps.set(user.id, now);
        // Remove the timestamp after the cooldown has expired
		setTimeout(() => timestamps.delete(user.id), cooldownAmount);
		
        // Create a new user folder with default files if there is none yet
        if (!fs.existsSync("userdata/" + user.id) && command.name != "help" && (command.category == "main" || command.category == "info" || command.category == "items" || command.category == "userinfo" || command.category == "tasks" || command.category == "misc" || command.category == "settings")){
            lib.createUserFiles(message, user, commandPrefix);
            return;
        }

		// Execute the command
		command.execute(message, user, args, commandPrefix);
	} catch (error) {
        // Error handling
		lib.error(message, error, "");
	}
	
});

// Listen for messages
// TODO: Add / update comments here as well
client.on('messageCreate', async message => {
	var user = message.author;
    user.username = user.username.replace(/\_/g, "").replace(/\*/g, "").replace(/\|/g, "").replace(/\~/g, "");

    // On the test branch: Only react to the bot owner
    if(isTestBranch && user.id != globalVars.adminUserId) return;
    
    // Check if the server has a custom prefix and load it
    commandPrefix = prefix;
    if(message.guild !== null){
        if(fs.existsSync("./data/configs/" + message.guildId)){
           commandPrefix = lib.readFile("./data/configs/" + message.guildId + "/prefix.txt");
        }
    }

    // Try to spawn a boss only for non-bot messages and non-commands
    if (!message.content.startsWith(commandPrefix) && !user.bot) trySpawnBoss(message);
    
    // If the message was sent in the updates channel on the main server and is not a minor patch then crosspost it to all other configured announcement channels (except the one on the main server)
    // Also send it to all signed-up users in DMs
    if(!isTestBranch && message.channel.id == globalVars.updateChannelId && !message.content.toLowerCase().includes("[minor patch]")){
        // Define embed
        var updateEmbed = new Discord.EmbedBuilder()
                .setTitle("New bot update")
                .setDescription(message.content.trim());

        lib.notifyAll("0", message, updateEmbed, "updates");
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
        
        // Create a new user folder with default files if there is none yet
        if (!fs.existsSync("userdata/" + user.id) && command.name != "help" && (command.category == "main" || command.category == "info" || command.category == "items" || command.category == "userinfo" || command.category == "tasks" || command.category == "misc" || command.category == "settings")){
            lib.createUserFiles(message, user, commandPrefix);
            return;
        }

        // Execute command
	    command.execute(message, user, args, commandPrefix);
    } catch (error) {
	    lib.error(message, error, "");
	}

});

// Log into Discord with the bot token
client.login(token);

// Scan media folders for new files every 30 minutes
var mediaScanInterval = 10 * 60;
if(isTestBranch){mediaScanInterval = 10;}
var mediaScan = setInterval(async function(){

    // Define folder paths
    var scanPath = "./media_temp/";
    var targetPath = "../artificial-index/media/";
    var subFolders = ['clips', 'images', 'journal', 'rpg_monsters'];

    // Scan each folder for new files
    for(i = 0; i < subFolders.length; i++){

        var sqlCommand = "insert into entries (entryTypeId, entryName, content) values";
        var sqlCommandValues = "";

        var files = await fs.readdirSync(scanPath + subFolders[i]);
        for(x = 0; x < files.length; x++){
            if(files[x] != ".gitignore"){
                // Move the file (modify name as well)
                var newName = files[x].toLowerCase().replace(/ /g, "_").replace(/'/g, "");
                fs.rename(scanPath + subFolders[i] + "/" + files[x], targetPath + subFolders[i] + "/" + newName, (error) => {if (error){console.log(error);}});

                // Prepare the SQL command for adding it to the database (only for image, clip and journal entries)
                if(subFolders[i] != "rpg_monsters"){
                    if(sqlCommandValues != ""){sqlCommandValues += ", ";}
                    sqlCommandValues += `(${i + 1}, '${newName}', 'https://artificial-index.com/media/${subFolders[i]}/${newName}')`;
                }
            }
        }

        // Execute SQL command, adding detected images to the database
        if(sqlCommandValues != ""){
            sqlCommand = sqlCommand + sqlCommandValues + ";";
            var [rows] = await con.execute({sql: sqlCommand, rowsAsArray: false });
        }
    }

}, mediaScanInterval * 1000);

// Main-branch exclusive functions
if(!isTestBranch){

    // Log the bot's status every 5 minutes in case I need to retrace its exact uptime for troubleshooting someday
    var stillAlive = setInterval(function() {
        console.log("Still alive! " + Date());
    }, 300 * 1000);

    // Trigger and update reminders once per minute
    var reminderCheck = setInterval(async function() {
        var d = new Date();
        var currentEpoch = Math.floor(d.getTime() / 1000);
    
        // Query the database table for reminders that are at least 30 seconds in the past (some will be matched 30 seconds too early and some 30 seconds too late but whatever. I don't want to make it check them more often than once per minute)
        var maxTimestamp = currentEpoch + 30;
        var [rows] = await con.execute({sql: `
            SELECT reminderId, text, userId, channelId, timestamp, repeating
            FROM reminders
            WHERE timestamp BETWEEN 0 AND ${maxTimestamp};
        `, rowsAsArray: false });
    
        // Loop through all the reminders that were found and have to be triggered
        for(i = 0; i < rows.length; i++){
    
            // If the reminder is set to repeat then update it with a new notification time. Otherwise delete it from the database
            var buttons = [];
            var repeatingInfo = "";
            if(lib.exists(rows[i].repeating)){
                
                // If the repeating interval is a multiple of years then account for leap days
                var newTimestamp = currentEpoch + rows[i].repeating;
                if(rows[i].repeating % 31536000 == 0){ newTimestamp = currentEpoch + lib.correctLeapDays(rows[i].repeating); }
                else if(rows[i].repeating % 2592000 == 0 || rows[i].repeating % 2678400 == 0 || rows[i].repeating % 2419200 == 0 || rows[i].repeating % 2505600 == 0){
                    // If it is a multiple of months then keep it on the same date every month instead of sticking to a specific number of days
                    newTimestamp = currentEpoch + lib.getSameDayInMonth(rows[i].repeating);
                }
                repeatingInfo = "\n(Repeating in " + lib.secondsToTime(newTimestamp - currentEpoch) + ")";
    
                // Update the reminder
                var [rowsB] = await con.execute({sql: `
                    UPDATE reminders
                    SET timestamp = ${newTimestamp}
                    WHERE reminderId = ${rows[i].reminderId};
                `, rowsAsArray: false });

                // Add button for deleting the reminder
                var button = new ButtonBuilder()
                    .setCustomId(rows[i].userId + "|remind delete " + rows[i].reminderId + "|normal")
                    .setLabel('Delete reminder')
                    .setStyle(4)
                buttons.push(button);
    
            }else{
                // Delete the reminder
                var [rowsC] = await con.execute({sql: `
                    DELETE
                    FROM reminders
                    WHERE reminderId = ${rows[i].reminderId};
                `, rowsAsArray: false });

                // Add buttons for repeating this reminder once
                var button1 = new ButtonBuilder()
                    .setCustomId(rows[i].userId + "|remind 10mins customCommand|normal")
                    .setLabel('\uD83D\uDD01 10m')
                    .setStyle(2)
                var button2 = new ButtonBuilder()
                    .setCustomId(rows[i].userId + "||remind 1h customCommand|normal")
                    .setLabel('\uD83D\uDD01 1h')
                    .setStyle(2)
                var button3 = new ButtonBuilder()
                    .setCustomId(rows[i].userId + "|remind 1d customCommand|normal")
                    .setLabel('\uD83D\uDD01 1d')
                    .setStyle(2)
                    
                buttons.push(button1);
                buttons.push(button2);
                buttons.push(button3);

            }
            
            var row = new ActionRowBuilder().addComponents(buttons);

            // Send a notification for every result that was found. Send it in DMs if the original channel of the reminder can't be identified
            var reminderMessage = `<@${rows[i].userId}>` + " - This is your reminder with the ID " + rows[i].reminderId + ":\n" + rows[i].text + repeatingInfo;
            var channel = await client.channels.cache.get(rows[i].channelId);
            if(channel == undefined){
                var tempUser = await client.users.fetch(rows[i].userId, false);
                tempUser.send({ content: reminderMessage, components: [row] });
            }else{
                channel.send({ content: reminderMessage, components: [row] });
            }
        
        }
    
    }, 60 * 1000);

    // Check the error log every 6 hours and send errors to my private channel for analysis
    var logCheck = setInterval(async function(){

        // Get the error log
        var log = lib.readFile("/root/.pm2/logs/app-error.log");
        if(!lib.exists(log)){log = "Empty";}
        altLog = log;
        
        // If the log isn't close to empty, post the content to Discord and empty the file
        // Any serious error will be more than a few lines long
        if(log.length > 5){

            // Save the text to the backup log file where all the errors are kept for the future
            var backupLog = lib.readFile("../nyextest/data/imported/logBackup.log");
            lib.saveFile("../nyextest/data/imported/logBackup.log", backupLog + "\n" + log);
            
            // If the log contains too many characters, split it into multiple messages. The actual character limit defined by Discord is 2000
            var charsPerMessage = 1980;
            var tempMessage = "";
            for(; log.length > 0; ){

                if(log.length > charsPerMessage){
                    tempMessage = log.slice(0, charsPerMessage) + "...";
                    log = "..." + log.slice(charsPerMessage, log.length);
                }else{
                    tempMessage = log;
                    log = "";
                }
                tempMessage = tempMessage.split("```").join("`");
                client.channels.cache.get(globalVars.logChannelId).send("```js\n" + tempMessage + "```");

            }

            // Clear the main error log file
            lib.saveFile("/root/.pm2/logs/app-error.log", "");

        }

    }, 60 * 1000); // 6 * 60 * 60 * 1000

}

// Define list of sites to check in the newsCheck function later as well as the HTML element patterns to extract from them
siteList = [
    {alias: 'UNO', link: "436febd1d2a7c039ed1f22759a8b8aaca5c1e239596affaea498b214ffa81f1de68c04309f", pattern: "\<li class=\"pages\"\>Pages:.*?\<\/li\>"}, 
    {alias: 'ZHG', link: "436febd1d2a7c039f6072675c7cbc5bdf3c1b5281869fbbae68da81defe94e4dbb84416ec31df176fee36f43c18aa8ed084f2336c517f69a", pattern: "\<div class=\"image-list.*?\<a id=\".*?\""},
    //{alias: 'CAP', link: "436febd1d2a7c039f3053d3e979e9ba6e4d4b7261760fbb1e69eaf00fff44a58bdd1506fd400a460ecec60529a", pattern: "\<ul class=\"productLists\"\>.*?figure class"},      // Cloudfront block
    //{alias: 'MIK', link: "436febd1d2a7c039ef17277f9a90c5b6fe96fc201879f7a3e788b308a2b61c12e78c00", pattern: "\<div class=\"card-list__items\"\>.*?\<\/div\>"},
    //{alias: 'SOLO', link: "436febd1d2a7c039fd172460869a98b6a5daf52c597efbb0a198b342a3f64345f3d55477d505be6ba4a2655fd8c5bf", pattern: "\<div class=\"inline_block col-d-20 col-t-33 .*?\<\/div\>"},
    //{alias: 'CAN', link: "436febd1d2a7c039f7072175969a82ebe5c0fb20587ef7edf79bfd5df6fa121a818917708d0ab66ba2e1", pattern: "\<a href=\"\/view\/.*?\<\/a\>"},
    //{alias: 'FF', link: "436febd1d2a7c039e71b67759ad18fa9f8d0ee24586ef1afe79eb208b1ed4058f18c02398146b677b7e6655cd0", pattern: "\<div class=\"c-postedArticle-info.*?\<\/p\>"},
    //{alias: 'AZL', link: "436febd1d2a7c039e5083f62989e85a0a5d2f5341b6cf5a3a6d3aa1dffee4641b7966364d30cb9719cc16347c6", pattern: "\<h2\>\<span class=\"mw-headline\".*?\<\/span\>"},
    //{alias: 'YGO', link: "436febd1d2a7c039e61e2f75909685a2e8d6f52d586ef1afe79aa100b5ea005ebfdb5d64c406a72aa0ee745498cbbde10a4f3135d85fff94ba7ed97d", pattern: "\<article class=\"latest-article-container.*?\<\/article\>"},
    {alias: 'NINP', link: "436febd1d2a7c039ef17277f9a90c5b6fe96fc20186ff1bae788b308a2b61713ea8e0433895a", pattern: "\<div class=\"card-list__items\"\>.*?\<\/div\>"}
    //{alias: "GSH", link: "436febd1d2a7c039e31724639c9685e8e2d4ea201579b0a4a993a402bdb74c45b3964668db00f853a6fd7559dac2", pattern: "id=\"Version_History\".*?id=\"Maintenance\""},
    //{alias: 'MANIC-1', link: "436febd1d2a7c039e71a647e9d9c84b3e2ddff2e5867eeed8694a705a4b4624bacdc", pattern: "\<div class=\"p-live-body p-live2 g-live-.*?\>"},
    //{alias: 'MANIC-2', link: "436febd1d2a7c039e71a647e9d9c84b3e2ddff2e5867eeed8694a705a4b4624bacdc", pattern: "\<div class=\"g-video g-item-odd g-item-first from_video\"\>.*?\<img"}
];

// Decrypt site URLs
// Also has code for encrypting in case I need it again
for(i = 0; i < siteList.length; i++){
    // Encryption code
    /*var cipher = crypto.createCipheriv(algorithm, SQLsecretKey, Buffer.from(SQLiv, 'hex'));
    var encrypted = Buffer.concat([cipher.update("URL HERE"), cipher.final()]).toString('hex');
    console.log(encrypted);*/

    var nDecipher = crypto.createDecipheriv(algorithm, SQLsecretKey, Buffer.from(SQLiv, 'hex'));
    var nDecrypted = Buffer.concat([nDecipher.update(Buffer.from(siteList[i].link, 'hex')), nDecipher.final()]).toString();
    //console.log(nDecrypted);
    siteList[i].link = nDecrypted;
}

// A feature for me personally: Check for updates to specific websites every 30 minutes and alert me about them
var newsCheck = setInterval(async function() {

    var updateList = [];
    var savePath = "../nyextest/data/sitedata/";

    // Go through the site list
    for(i = 0; i < siteList.length; i++){

        // Fetch the site body, only returning the HTML text matching the defined pattern
        var body = await lib.getHTML(siteList[i].link);
        var reg = new RegExp(siteList[i].pattern, "g");
        var results = await body.match(reg);

        // Compare the first pattern match to the one that was saved most recently
        var filePath = savePath + siteList[i].alias + ".txt";
        let errorPath = savePath + "errors" + siteList[i].alias + ".txt";
        var previousResult = lib.readFile(filePath);
        if(!lib.exists(previousResult)){previousResult = "None";}
        if(!lib.exists(results) || results.length < 1){
            // Update error counter
            let errorCount = parseInt(lib.readFile(errorPath));
            lib.saveFile(errorPath, errorCount + 1);
            // If there have been 20 consecutive errors, add them to the actual error log
            if(errorCount + 1 >= 20) lib.error("", "newsCheck() Error: No pattern match found for site " + siteList[i].alias, " at least 20 times in a row");
        }
        else {
            // Clear the error counter since there was no error
            lib.saveFile(errorPath, "0");

            if(results[0] != previousResult){
                // Add this list to the updated sites list
                updateList.push("<" + siteList[i].link + ">");

                // Save the pattern match result to a file for the next comparison
                lib.saveFile(filePath, results[0]);
            }
        }

    }

    // Notify me about the list of updated sites in my private channel
    if(updateList.length > 0){
        updateList = updateList.join("\n");
        client.channels.cache.get("516288921127092234").send("**Update(s) found!**\n" + updateList);
    }
    
}, 30 * 60 * 1000);