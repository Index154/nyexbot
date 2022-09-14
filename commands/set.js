var { prefix } = require('../config.json');
const Discord = require('discord.js');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'set',
	usages: ['updates', 'channel', 'prefix [text]'],
	descriptions: ["Enables or disables whether you will receive announcements in DMs", "Sets the current channel as the server's NyexBot announcement channel", "Sets a new server-side prefix for the bot"],
    shortDescription: 'Set the server prefix or announcements channel or enable update DMs',
    weight: 5,
	addendum: 'Announcement channel and prefix can only be controlled by users with the permission "Manage Server".\nAnnouncements include update and worldboss notices',
    category: 'settings',
	
	execute(message, user, args) {

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

        // Special use case: updates for DM control
        if(args[0] == "updates"){
            // Get current setting
            var updateSetting = lib.readFile(dir + "/dmupdates.txt");

            // Switch the setting
            if(updateSetting == "yes"){
                updateSetting = "no";
                message.reply({ content: "You will no longer receive update and boss announcements in DMs!", allowedMentions: { repliedUser: false }});
            }else{
                updateSetting = "yes";
                message.reply({ content: "From now on you will receive update and boss announcements in DMs!", allowedMentions: { repliedUser: false }});
            }

            lib.saveFile(dir + "/dmupdates.txt", updateSetting);
            return;
        }

        // No matching argument error
        if(args[0] != "prefix" && args[0] != "channel"){
            message.reply({ content: "\u274C Please make sure the first argument is either `updates`, `prefix` or `channel`!", allowedMentions: { repliedUser: false }});
            return;
        }

        // Stop if the command is not being executed in a server
        if(message.guild === null){
            message.reply({ content: "\u274C This command can only be used in servers!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // If the user doesn't have server admin rights, stop the command
        (message.client.guilds.cache.get(message.guildId)).members.fetch(user.id).then((member) => {
            if(!member.permissions.has(Discord.Permissions.FLAGS.MANAGE_GUILD)){
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