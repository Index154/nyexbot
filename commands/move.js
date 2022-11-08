var { prefix } = require('../config.json');

module.exports = {
	name: 'move',
	usages: ['', '[area name]'],
	descriptions: ['Moves you to a random area', 'Moves you to the specified area'],
    shortDescription: 'Change your area',
    weight: 5,
	aliases: ['mv', 'goto'],
	addendum: 'You can only use this command to move to regular areas',
    category: 'misc',
	
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
        var dir = "userdata/" + user.id;
        
        // If the user isn't registered yet, stop the command
        if(!fs.existsSync(dir)){
            message.reply({ content: "\u274C Use `" + prefix + "encounter` first to create an account!", allowedMentions: { repliedUser: false }});
            return;
        }
        
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
				var area_name = area_list[key];
				
				// If the area is a realm (ID higher than 13) then don't allow moving there
				if(key > 13){
				    message.reply({ content: "\u274C That area could not be found!\nPlease try again!", allowedMentions: { repliedUser: false }});
				    return;
				}
				
				// Move the user to the area if they aren't already there
				if(area != key){
				    lib.saveFile(dir + "/area.txt", key);
				    message.reply({ content: "You moved to the " + area_name, allowedMentions: { repliedUser: false }});
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
            
            var area_name = area_list[new_area];
            lib.saveFile(dir + "/area.txt", new_area);
            message.reply({ content: "You were moved to the " + area_name, allowedMentions: { repliedUser: false }});
        }
	},
};