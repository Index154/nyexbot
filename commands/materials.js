var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'materials',
	usages: ['', '[material name]', 'favorite [material name]', 'convert [number] [material name]', 'convert all'],
	descriptions: ['Shows a list of all your materials and your Scrap amount', "Shows a material's Scrap value, description and amount held", 'Favorites or unfavorites a material', 'Converts a specified amount of a chosen material into Scrap. Defaults to one if no number is given', 'Converts all your unfavorited materials into Scrap. This requires confirmation in the form of using the same command again'],
    shortDescription: 'Check your materials and manage them',
    weight: 10,
	aliases: ['mats', 'mat'],
    category: 'items',
	
	execute(message, user, args) {
	    var adc  = require('adc.js');
	    var allArgs = args.join(" ");
        
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
        
         // If the user isn't registered yet, stop the command
        if(!fs.existsSync(dir)){
            message.reply({ content: "\u274C Use `" + prefix + "encounter` first to create an account!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // Get a full list of all the user's items
        var inventory = lib.readFile(dir + "/materials.txt");
        var items = lib.readFile("data/items.txt");
        var items_array = items.split(";\n");
        var no_items = false;
        if(inventory === "" || inventory === undefined || inventory == "0"){
            // The user has no materials
            var item_keys = [];
            no_items = true;
        }else if(inventory.includes(",")){
            var item_keys = inventory.split(",");
        }else{
            var item_keys = [inventory];
        }
        
        // Get scrap amount
        var scrap_amount = lib.readFile(dir + "/scrap.txt");
        if(scrap_amount === undefined || scrap_amount === ""){
            scrap_amount = 0;
        }
        
        // Go through the item names and join them into a list
        var item_names = "";
		var item_names2 = "";
		var key_count = item_keys.length;
		var fav_mats = lib.readFile(dir + "/fav_mats.txt");
		var icon_array = {D: "<:real_black_circle:856189638153338900>", C: "\uD83D\uDD35", B: "\uD83D\uDFE2", A: "\uD83D\uDD34", S: "\uD83D\uDFE1", SS: "\uD83D\uDFE0"};
		for(i = 0; i < key_count; i++){
			var loop_key = item_keys[i];
			var selected_item = items_array[loop_key];
			var item_values = selected_item.split("|");
			var item_name = item_values[0];
			
			// Check if the material ID is in the favorites list and add an icon to its name (the one used for the list output) if it is
            if(fav_mats.includes("," + loop_key + ",")){
                item_name = "\u2B50" + item_name;
            }else{
                // Add rank icon
                item_name = icon_array[item_values[12]] + item_name;
            }
			
			if(i > 0){
				item_names2 = item_names2 + "|";
				item_names = item_names + " | ";
			}
			item_names2 = item_names2 + item_name;
			item_names = item_names + item_name;
		}
        
        // Check if the user gave an input. If so, look for it in their inventory and give out its info if possible. Or favorite or convert if necessary
        if(args.length > 0){
            allArgs = allArgs.toLowerCase();
            
            // If they have no materials, then stop early
            if(no_items === true){
                message.reply({ content: "\u274C You have no materials!\nUse `" + prefix + "materials` without arguments to view your Scrap amount!", allowedMentions: { repliedUser: false }});
                return;
            }
            
            // If the first argument is "favorite" and there is at least one other argument then the user is trying to favorite an item
            var fav_flag = false;
            if((args[0] == "favorite" || args[0] == "fav") && args.length > 1){
                // Remove the favorite argument
                args.splice(0,1);
                allArgs = args.join(" ");
                fav_flag = true;
            }
            
            // If the first argument is "convert" and there is at least one other argument then the user is trying to convert an item
            var convert_flag = false;
            if((args[0] == "convert" || args[0] == "conv") && args.length > 1){
                // Remove the convert argument
                args.splice(0,1);
                allArgs = args.join(" ");
                convert_flag = true;

                // If the second argument is a number, use it as the amount to convert
                var count = 1;
                var first_arg = args[0].replace(/[^0-9]/g, "");
                if(first_arg !== ""){
                    count = parseInt(first_arg);
                    args.splice(0,1);
                    allArgs = args.join(" ");
                }
            }
            
            // If the user is a Craftsman, check for abilities and prepare the modifier
            var stats = lib.readFile(dir + "/stats.txt").split("|");
            var crafter_mod = 1;
            if(stats[0] == "Craftsman"){
                if(parseInt(stats[10]) >= 50){
                    crafter_mod = 1.25;
                }else if(parseInt(stats[10]) >= 30){
                    crafter_mod = 1.15;
                }
            }
            
            // If the user is trying to convert all materials into scrap then ask for confirmation first
            if(convert_flag && args[0] == "all"){
                var confirmed = lib.readFile(dir + "/confirm_conv.txt");
                if(confirmed == "no"){
                    // Create button
                    var button1 = new MessageButton()
            			.setCustomId(user.id + "|materials convert all")
            			.setLabel('Confirm')
            			.setStyle('PRIMARY')
            		var row = new MessageActionRow().addComponents([button1]);
                    
                    lib.saveFile(dir + "/confirm_conv.txt", "yes");
                    message.reply({ content: "Are you sure you want to convert all your unfavorited materials?\nUse the same command again or press the button to confirm", allowedMentions: { repliedUser: false }, components: [row]});
                    return;
                }else{
                    // Do the all-conversion
                    // First count all duplicate IDs
                    var itemCounts = new adc(item_keys).count();
                    // Function for removing duplicate array values
                    function onlyUnique(value, index, self) {
                        return self.indexOf(value) === index;
                    }
                    var uniq_keys = item_keys.filter(onlyUnique);
                    
                    // Loop through all unique IDs and scrap them by their counted amount UNLESS they are favorited
                    var value = 0;
                    var totalCount = 0;
                    for(u = 0; u < uniq_keys.length; u++){
                        if(!fav_mats.includes("," + uniq_keys[u] + ",")){
                            var item_info = items_array[uniq_keys[u]].split("|");
    				        var matValue = Math.ceil(crafter_mod * parseInt(item_info[11]));
    				        count = itemCounts[uniq_keys[u]];
    				        totalCount += count;
                            value += matValue * count;
                            
                            // Remove the item/s from the user's material inventory
                            for(i = 0; i < count; i++){
                                item_keys.splice(item_keys.indexOf(uniq_keys[u]), 1);
                            }
                        }
                    }
                    
                    // Give them their scrap and save everything
                    scrap_amount = parseInt(scrap_amount) + value;
                    lib.saveFile(dir + "/scrap.txt", scrap_amount);
                    lib.saveFile(dir + "/materials.txt", item_keys.join(","));
                    lib.saveFile(dir + "/confirm_conv.txt", "no");
                    
                    // If the user wasted their time, let them know
                    if(totalCount === 0){
                        message.reply({ content: "\u274C You have no eligible materials to convert!", allowedMentions: { repliedUser: false }});
                        return;
                    }
                    
                    // Output
                    message.reply({ content: "@ __**" + username + "**__, you successfully converted **" + totalCount + "** materials into a sum of **" + value + "** Scrap!\nYour total Scrap amount is now **" + scrap_amount + "**!", allowedMentions: { repliedUser: false }});
                    return;
                }
            }
            
			// Check if the search can be matched to an item in the user's possession
			var item_names_lower = item_names2.toLowerCase();
			item_names_lower = "|" + item_names_lower + "|";
			if(item_names_lower.includes(allArgs) && allArgs !== ""){
				// First try searching for exact matches. If there is no match, search  for any matches
				var key = 0;
				if(item_names_lower.includes("|" + allArgs + "|")){
				    var item_names_array = item_names_lower.split("|");
					key = item_names_array.indexOf(allArgs);
				}else{
					var split = item_names_lower.split(allArgs);
					var left_side = split[0].replace(/[^|]/g, "");
					key = left_side.length;
				}
				
				var result_key = item_keys[key - 1];
				// The item's data has been retrieved!
				var item_info = items_array[result_key].split("|");
				var value = Math.ceil(crafter_mod * parseInt(item_info[11]));
				
				// If the user is trying to favorite the item then favorite or unfavorite it
				if(fav_flag){
				    var fav_extra = "favorited!";
				    var fav_match = "," + result_key + ",";
				    if(fav_mats.includes(fav_match)){
				        // Remove the favorite
				        fav_mats = fav_mats.replace(fav_match, "");
				        fav_extra = "removed from your favorites!";
				    }else{
				        // Add the favorite
				        fav_mats += fav_match;
				    }
				    lib.saveFile(dir + "/fav_mats.txt", fav_mats);
				    message.reply({ content: "The material item **[" + item_info[0] + "]** has been " + fav_extra, allowedMentions: { repliedUser: false }});
				}else
				// If the user is trying to convert the item then remove it (or check if the user has enough of the item, given that they are trying to convert more than one)
				if(convert_flag){
				    // If the user specified an item count, attempt to scrap it multiple times, otherwise stop
                    if(count > 1){
                        // Check if the user has the item often enough
                        var counted = new adc(item_keys).count();
                        var amount = counted[result_key];
                        if(amount >= count){
                            value = value * count;
                        }else{
                            message.reply({ content: "\u274C You don't have enough materials!", allowedMentions: { repliedUser: false }});
                            return;
                        }
                    }
                    
                    // Remove the item/s from the user's material inventory
                    for(i = 0; i < count; i++){
                        item_keys.splice(item_keys.indexOf(result_key), 1);
                    }
                    lib.saveFile(dir + "/materials.txt", item_keys.join(","));
                    // Give them their scrap
                    scrap_amount = parseInt(scrap_amount) + value;
                    lib.saveFile(dir + "/scrap.txt", scrap_amount);
                    
                    // Conversion output
                    message.reply({ content: "You successfully converted **[" + item_info[0] + "] x " + count + "** into **" + value + "** Scrap!\nYour total Scrap amount is now **" + scrap_amount + "**!", allowedMentions: { repliedUser: false }});
                    
				}else{
				    // The user is viewing an item
				    
				    // Further differentiate between item types and alter the output message
    				// Create output embed
    				var outputEmbed = new Discord.MessageEmbed()
                        	.setColor('#0099ff')
                        	.addField("Type", "Material")
                        	.addField("Value", item_info[11])
                        	.setTitle(item_info[0])
                        	.setDescription(item_info[9]);
                            
                    // Set item count and add it to the output
    				var itemCounts = new adc(item_keys).count();
    				outputEmbed
                        .addFields( { name: "Amount", value: itemCounts[result_key].toString(), inline: true } );    
    				
    				// Output
    				message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false }});
				}

			}else{
				// Error, item not found
				message.reply({ content: "\u274C That item could not be found!\nPlease try again", allowedMentions: { repliedUser: false }});
				return;
			}
            
        }else{
            // There was no input

            // First count all duplicates
            var item_array = item_names.split(" | ");
            var itemCounts = new adc(item_array).count();
            // Function for removing duplicate array values
            function onlyUnique(value, index, self) {
                return self.indexOf(value) === index;
            }
            var uniq_array = item_array.filter(onlyUnique);
            uniq_array = uniq_array.sort();
            
            // Combine the two arrays (names and counts)
            var materials = [];
            for(j = 0; j < uniq_array.length; j++){
                var name = uniq_array[j];
                if(name.substring(0, 1) == "0"){
                    name = name.substring(1);
                }
                materials[j] = name + " x " + itemCounts[uniq_array[j]];
            }
            
            // If the user has no materials, replace the empty value
            if(no_items){
                materials[0] = "None";
            }
            
			// Create paged embed and send it
			var paginationArray = materials;
			var elementsPerPage = 15;
			var fieldTitle = "Scrap Amount: " + scrap_amount;
			var embedTemplate = new Discord.MessageEmbed()
				.setColor('#0099ff')
            	.setTitle(username + "'s Materials")
			lib.createPagedEmbed(paginationArray, elementsPerPage, embedTemplate, fieldTitle, message);
                
        }
        
	},
};