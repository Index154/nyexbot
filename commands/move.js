var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'move',
	usages: ['', '[area name]'],
	descriptions: ['Moves you to a random area', 'Moves you to the specified area'],
    shortDescription: 'Change your area',
    weight: 5,
	aliases: ['mv', 'goto'],
	addendum: 'You can only use this command to move to regular areas',
    addendum: [
        '- See `{prefix}area` for related information'
    ],
    category: 'misc',
	
	execute(message, user, args, prefix) {
	    var allArgs = args.join(" ");
        
        // Set important variables
        var dir = "userdata/" + user.id;
        
        // Get current area
        var area = parseInt(lib.readFile(dir + "/area.txt"));
        
        // If the user is in a realm, move them back into the Hub
        if(area > 13){
            message.reply({ content: "You forcefully left the Realm and have been returned to the Hub!", allowedMentions: { repliedUser: false }});
            lib.saveFile(dir + "/area.txt", "0");
            return;
        }
        
        // Set list of available areas
        var area_list_raw = lib.readFile("data/area_names.txt");
        var area_list_lower = area_list_raw.toLowerCase();
        var area_list = area_list_raw.split(",");
        
        // If the user included an input, attempt to match it to an area
        if(allArgs !== ""){
            allArgs = allArgs.toLowerCase();
            if(area_list_lower.includes(allArgs)){
                var split = area_list_lower.split(allArgs);
				var left_side = split[0].replace(/[^,]/g, "");
				var key = left_side.length;
				var area_name = area_list[key].toLowerCase();
				
				// If the area is a realm (ID higher than 13) then don't allow moving there
				if(key > 13){
				    message.reply({ content: "\u274C That area could not be found!\nPlease try again!", allowedMentions: { repliedUser: false }});
				    return;
				}
				
				// Move the user to the area if they aren't already there
				if(area != key){
				    lib.saveFile(dir + "/area.txt", key);
                    var outputEmbed = new Discord.EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle("You moved to the " + area_name)
                        .setThumbnail(lib.getAreaImage(key, area_name));
				    message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false } });
				}else{
				    message.reply({ content: "\u274C You are already in this area!", allowedMentions: { repliedUser: false }});
				}
            }else{
                message.reply({ content: "\u274C That area could not be found!\nPlease try again!", allowedMentions: { repliedUser: false }});
            }
            
        }else{
            // The user didn't specify an area so move them to a random one
            var new_area = lib.rand(1,13);
            if(new_area == area){
                if(new_area == 13){
                    new_area = 1;
                }else{
                    new_area++;
                }
            }
            
            var area_name = area_list[new_area].toLowerCase();
            lib.saveFile(dir + "/area.txt", new_area);

            var outputEmbed = new Discord.EmbedBuilder()
                .setColor('#0099ff')
                .setTitle("You were moved to the " + area_name)
                .setThumbnail(lib.getAreaImage(new_area, area_name));
            message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false } });
        }
	},
};