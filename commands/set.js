var { prefix } = require('../config.json');
const { PermissionsBitField, ButtonBuilder, EmbedBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
	name: 'set',
	usages: ['', 'updates', 'commandmode', 'monstermode', 'channel', 'channelupdates', 'prefix [text]'],
	descriptions: ["Posts an embed with buttons for you to change some personal settings with", "Choose which announcements you'd like to receive in DMs", "Enables or disables the single-message command mode", "Enables or disables the funny monster mode", "Sets the current channel as the server's channel for various bot announcements and notifications", "Choose which types of announcements should be posted to the announcement channel", "Sets a new server-side prefix for the bot"],
    shortDescription: 'Set the server prefix or announcements channel or enable update DMs',
    weight: 5,
    addendum: [
        '- Announcement channel and prefix can only be controlled by users with the permission "Manage Server"',
        '- Announcements include update and worldboss notices'
    ],
    category: 'settings',
	
	execute(message, user, args, prefix) {

        // Set important variables
        var username = user.username;
        var dir = "userdata/" + user.id;

        // Permission check function
        function hasPerms(){
            if(!(message.client.guilds.cache.get(message.guildId)).members.cache.get(user.id).permissions.has(PermissionsBitField.Flags.ManageGuild)){
                message.reply({ content: "\u274C This command can only be used by those with the permission \"Manage Server\"!", allowedMentions: { repliedUser: false }});
                return false;
            }else{
                return true;
            }
        }

        // Bring up notification selection menu...
        if(args[0] == "updates" || args[0] == "channelupdates"){
            var channelSet = "";
            var embedTitle = "Your DM notifications";
            var settingsPath = "";
            var desc = "";
            var setChannelButton = null;
            if(args[0] == "channelupdates"){
                // Only in servers
                if(message.guild === null){
                    message.reply({ content: "\u274C You can only change channel notification settings in servers!", allowedMentions: { repliedUser: false }});
                    return;
                }
                // No server folder found
                if(!fs.existsSync("./data/configs/" + message.guildId)){
                    message.reply({ content: "\u274C Server config folder is missing!", allowedMentions: { repliedUser: false }});
                    return;
                }else{
                    // No server settings found
                    if(!fs.existsSync("./data/configs/" + message.guildId + "/updates.txt")){
                        message.reply({ content: "\u274C Server update config is missing!", allowedMentions: { repliedUser: false }});
                        return;
                    }
                }

                // Check for permissions
                if(!hasPerms()){ return; }

                updateChannel = lib.readFile("./data/configs/" + message.guildId + "/channel.txt");
                if(updateChannel != "Undefined"){
                    updateChannel = message.client.channels.cache.get(updateChannel).name;
                }
                desc += "__Current notification channel:__ **" + updateChannel + "**";
                settingsPath = "./data/configs/" + message.guildId + "/updates.txt";
                embedTitle = "Server announcement channel notifications";
                channelSet = "channel";
                setChannelButton = new ButtonBuilder()
                    .setCustomId(user.id + "|set channel")
                    .setLabel("Make this the update channel")
                    .setStyle(1);
            }else{
                settingsPath = dir + "/dmupdates.txt";
            }

            // Get current settings
            var settingsList = ["updates", "bosses", "shinies"];
            var settingsText = ["Update notifications", "World boss spawn and defeat notifications", "Shiny fight and capture notifications"];
            var settings = lib.readFile(settingsPath).split("|");

            // Change a setting
            if(args.length > 1 && settingsList.includes(args[1])){
                var idx = settingsList.indexOf(args[1]);
                if(settings[idx] == "On"){
                    settings[idx] = "Off";
                }else{
                    settings[idx] = "On";
                }
            }

            // Format description
            for(x = 0; x < settings.length; x++){
                if(desc != ""){ desc += "\n"; }
                desc += "- " + settingsText[x] + ": **" + settings[x] + "**";
            }
            var outputEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(embedTitle)
                .setDescription(desc);
            var states = {"On": [4, "Disable"], "Off": [3, "Enable"]};
            var button1 = new ButtonBuilder()
                .setCustomId(user.id + "|set " + channelSet + "updates updates")
                .setLabel(states[settings[0]][1] + ' update notifs')
                .setStyle(states[settings[0]][0]);
            var button2 = new ButtonBuilder()
                .setCustomId(user.id + "|set " + channelSet + "updates bosses")
                .setLabel(states[settings[1]][1] + ' boss notifs')
                .setStyle(states[settings[1]][0]);
            var button3 = new ButtonBuilder()
                .setCustomId(user.id + "|set " + channelSet + "updates shinies")
                .setLabel(states[settings[2]][1] + ' shiny notifs')
                .setStyle(states[settings[2]][0]);
            var buttons = [button1, button2, button3];
            if(setChannelButton != null){ buttons.push(setChannelButton); }
            var row = new ActionRowBuilder().addComponents(buttons);

            // Save settings & output
            lib.saveFile(settingsPath, settings.join("|"));
            if(lib.exists(message.message)){
                // Edit existing message
                message.deferUpdate();
                message.message.edit({ embeds: [outputEmbed], components: [row] });
            }else{
                // Post new message
                message.reply({ embeds: [outputEmbed], components: [row], allowedMentions: { repliedUser: false } });
            }
            return;
        }

        // Toggle command mode
        if(args[0] == "commandmode"){
            // Get current setting
            var commandmode = lib.readFile(dir + "/commandmode.txt");

            // Switch the setting
            if(commandmode != "single"){
                commandmode = "single";
                message.reply({ content: "@ __**" + username + "**__: " + "Switched to single command mode. Certain buttons will make the bot edit the message they are attached to instead of replying with a new message", allowedMentions: { repliedUser: false }});
            }else{
                commandmode = "classic";
                message.reply({ content: "@ __**" + username + "**__: " + "Switched to classic command mode. Every button press will result in the bot replying with a new message", allowedMentions: { repliedUser: false }});
            }

            lib.saveFile(dir + "/commandmode.txt", commandmode);
            return;
        }

        // Toggle monster mode
        if(args[0] == "monstermode"){
            // Get current setting
            var monstermode = lib.readFile(dir + "/monster_mode.txt");

            // Switch the setting
            if(monstermode != "funny"){
                // Randomize the monsters
                var monsters = lib.readFile("./data/monsters/monsters.txt");
                var monsterGroups = monsters.split("#################################################################################\n");
                
                // Loop through every group and modify it
                for(i = 0; i < monsterGroups.length; i++){
                    var monsterList = monsterGroups[i].split(";\n");
                    
                    // Prepare attribute collections
                    var names = [];
                    var images = [];
                    for(y = 0; y < monsterList.length - 1; y++){
                        // Extract all attributes from this rank's monsters
                        var monsterData = monsterList[y].split("|");
                        names.push(monsterData[0]);
                        images.push(monsterData[5]);
                    }
                    
                    // Randomly generate each monster anew using the extracted attributes
                    for(z = 0; z < monsterList.length - 1; z++){
                        var monsterData = monsterList[z].split("|");
                        var nameLength = lib.rand(0, 2);
                        if(nameLength === 1){
                            // Pick 3 names and combine them
                            var name1 = names[lib.rand(0, names.length - 1)];
                            var name2 = names[lib.rand(0, names.length - 1)];
                            var name3 = names[lib.rand(0, names.length - 1)];
                            var newName = name1.substring(0, name1.length / 3) + name2.substring(name2.length, name2.length / 3) + name3.substring(name3.length, name3.length / 3);
                            monsterData[0] = newName;
                        }else{
                            // Pick 2 names and combine them
                            var name1 = names[lib.rand(0, names.length - 1)];
                            var name2 = names[lib.rand(0, names.length - 1)];
                            var newName = name1.substring(0, name1.length / 2) + name2.substring(name2.length, name2.length / 2);
                            monsterData[0] = newName;
                        }
                        
                        // Pick random image
                        var newImg = images[lib.rand(0, images.length - 1)];
                        monsterData[5] = newImg;
                        
                        // Finalize monster
                        monsterList[z] = monsterData.join("|");
                    }
                    
                    // Finalize rank
                    monsterGroups[i] = monsterList.join(";\n");
                }
                
                // Save new monster list
                lib.saveFile("./data/monsters/monsters_alt.txt", monsterGroups.join("#################################################################################\n"));
                
                // User stuff
                monstermode = "funny";
                message.reply({ content: "@ __**" + username + "**__: " + "Activated funny monster mode. All monster names and images will be randomized", allowedMentions: { repliedUser: false }});
            }else{
                monstermode = "normal";
                message.reply({ content: "@ __**" + username + "**__: " + "Deactivated funny monster mode. All monsters are back to normal", allowedMentions: { repliedUser: false }});
            }

            lib.saveFile(dir + "/monster_mode.txt", monstermode);
            return;
        }

        // No argument. Create an embed with buttons
        if(args[0] != "prefix" && args[0] != "channel"){
            // Build buttons
            var button1 = new ButtonBuilder()
                .setCustomId("any|set updates")
                .setLabel('Set notifications')
                .setStyle(1)
            var button2 = new ButtonBuilder()
                .setCustomId("any|set commandmode")
                .setLabel('Toggle command mode')
                .setStyle(1)
            var button3 = new ButtonBuilder()
                .setCustomId("any|set monstermode")
                .setLabel('Toggle monster mode')
                .setStyle(1)
            var row = new ActionRowBuilder().addComponents([button1, button2, button3]);

            var outputEmbed = new EmbedBuilder()
                .setTitle("@ __**" + username + "**__")
                .setDescription("You may toggle the following settings:\n- Notifications: You can choose to be notified about world bosses, shiny interactions and bot updates in DMs\n- Command mode: If single mode is enabled, pressing certain buttons will make the bot edit the message the buttons are attached to instead of posting a new message\n- Monster mode: If funny mode is enabled, all monster names will be randomized (images will not work)")
                .setFooter({ text: "See `" + prefix + "help set` for how to change server-wide settings" });
            
            message.reply({ embeds: [outputEmbed], components: [row], allowedMentions: { repliedUser: false } });
            return;
        }

        // Stop if the command is not being executed in a server
        if(message.guild === null){
            message.reply({ content: "\u274C This setting can only be changed in servers!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // If the user doesn't have server admin rights, stop the command
        if(!hasPerms()){ return; }
        
        // Save the second argument as the new prefix or save the channel
        var change_path = "data/configs/" + message.guildId + "/prefix.txt";
        if(args[0] == "channel"){
            change_path = "data/configs/" + message.guildId + "/channel.txt";
            args[1] = message.channel.id;
        }else{
            if(args[1] === "" || args[1] === null || args[1] === undefined){
                message.reply({ content: "\u274C Please define a prefix!", allowedMentions: { repliedUser: false }});
                return;
            }
        }
        
        // If there is no folder for the server yet, create the files
        var guilddir = "data/configs/" + message.guildId;
        if(!fs.existsSync(guilddir)){
            fs.mkdirSync(guilddir);
            lib.saveFile(guilddir + "/prefix.txt", ",");
            lib.saveFile(guilddir + "/channel.txt", "Undefined");
        }
        
        // Change the thing
        message.reply({ content: "The server's " + args[0] + " has successfully been changed to " + args[1], allowedMentions: { repliedUser: false }});
        lib.saveFile(change_path, args[1]);
        
	},
};