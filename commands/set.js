var { prefix } = require('../config.json');
const { PermissionsBitField, ButtonBuilder, EmbedBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
	name: 'set',
	usages: ['', 'updates', 'commandmode', 'monstermode', 'channel', 'prefix [text]'],
	descriptions: ["Posts an embed with buttons for you to change some personal settings with", "Enables or disables whether you will receive announcements in DMs", "Enables or disables the single-message command mode", "Enables or disables the funny monster mode", "Sets the current channel as the server's NyexBot announcement channel", "Sets a new server-side prefix for the bot"],
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

        // Toggle updates for DM control
        if(args[0] == "updates"){
            // Get current setting
            var updateSetting = lib.readFile(dir + "/dmupdates.txt");

            // Switch the setting
            if(updateSetting == "yes"){
                updateSetting = "no";
                message.reply({ content: "@ __**" + username + "**__: " + "You will no longer receive update and boss announcements in DMs!", allowedMentions: { repliedUser: false }});
            }else{
                updateSetting = "yes";
                message.reply({ content: "@ __**" + username + "**__: " + "From now on you will receive update and boss announcements in DMs!", allowedMentions: { repliedUser: false }});
            }

            lib.saveFile(dir + "/dmupdates.txt", updateSetting);
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
                .setLabel('Toggle DM updates')
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
                .setDescription("You may toggle the following settings:\n- DM updates: If enabled, you will be notified about world bosses and bot updates in DMs\n- Command mode: If single mode is enabled, pressing certain buttons will make the bot edit the message the buttons are attached to instead of posting a new message\n- Monster mode: If funny mode is enabled, all monster names and images will be randomized")
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
        (message.client.guilds.cache.get(message.guildId)).members.fetch(user.id).then((member) => {
            if(!member.permissions.has(PermissionsBitField.Flags.ManageGuild)){
                message.reply({ content: "\u274C This command can only be used by those with the permission \"Manage Server\"!", allowedMentions: { repliedUser: false }});
                return;
            }else{
                // Get the server ID for later
                var serverID = message.guildId;
                
                // Save the second argument as the new prefix or save the channel
                var change_path = "data/configs/" + serverID + "/prefix.txt";
                if(args[0] == "channel"){
                    change_path = "data/configs/" + serverID + "/channel.txt";
                    args[1] = message.channel.id;
                }else{
                    if(args[1] === "" || args[1] === null || args[1] === undefined){
                        message.reply({ content: "\u274C Please define a prefix!", allowedMentions: { repliedUser: false }});
                        return;
                    }
                }
                
                // If there is no folder for the server yet, create the files
                var guilddir = "data/configs/" + serverID;
                if(!fs.existsSync(guilddir)){
                    fs.mkdirSync(guilddir);
                    lib.saveFile(guilddir + "/prefix.txt", ",");
                    lib.saveFile(guilddir + "/channel.txt", "Undefined");
                }
                
                // Change the thing
                message.reply({ content: "The server's " + args[0] + " has successfully been changed to " + args[1], allowedMentions: { repliedUser: false }});
                lib.saveFile(change_path, args[1]);
            }
        });
        
	},
};