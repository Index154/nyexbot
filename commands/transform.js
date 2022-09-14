var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'transform',
	usages: ['', '[item name]', 'weapon/defense/tool'],
	descriptions: ['Shows you a list of possible item rerolls and their Scrap prices', 'Attempts to reroll a selected item into a different item of the same type and quality', 'Attempts to reroll the selected equipment item'],
    shortDescription: 'Reroll equipment and vortexes',
    weight: 35,
	aliases: ['tf'],
    category: 'items',
	
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
        var username = user.username;
        var dir = "userdata/" + user.id;
        
        // If the user isn't registered yet, stop the command
        if(!fs.existsSync(dir)){
            message.reply({ content: "\u274C Use `" + prefix + "encounter` first to create an account!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // Set scrap prices
        var vortexPrices = [15, 25, 35];
        var equipPrices = [10, 15, 20, 25, 35, 45];
        
        // If there was no input, send a generic message with price information
	    if(args.length === 0 || args[0] === undefined){
	        // Assemble only a basic embed
    	    var outputEmbed = new Discord.MessageEmbed()
            	.setColor('#0099ff')
            	.setTitle("Transformation Info")
            	.setDescription("Below is a list of item types that can be transformed (rerolled) along with their respective scrap costs.")
            	.addFields(
            		{ name: 'Vortex Prices', value: "Common: " + vortexPrices[0] + "\nRare: " + vortexPrices[1] + "\nUltra rare: " + vortexPrices[2], inline: true },
            		{ name: 'Equipment Prices', value: "D-tier: " + equipPrices[0] + "\nC-tier: " + equipPrices[1] + "\nB-tier: " + equipPrices[2] + "\nA-tier: " + equipPrices[3] + "\nS-tier: " + equipPrices[4] + "\nSS-tier: " + equipPrices[5], inline: true }
            	)
            	.setFooter({ text: "Use \"" + prefix + "tf [item name]\" to transform an item!" });
            
            // Output
		    message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false }});
	        return;
	    }
        
        // Get a full list of all the user's items
        var inventory = lib.readFile(dir + "/inventory.txt");
        var equipment = lib.readFile(dir + "/equipment.txt");
        var equipment_array = equipment.split(",");
        var items = lib.readFile("data/items.txt");
        var item_array = items.split(";\n");
        var no_items = false;
        if(inventory.includes(",")){
            var inventory_array = inventory.split(",");
            var item_keys = (equipment + "," + inventory).split(",");
        }else if(inventory !== "" && inventory !== undefined){
            var inventory_array = [inventory];
            item_keys = equipment.split(",");
            item_keys[item_keys.length] = inventory;
        }else{
            item_keys = equipment.split(",");
        }
        
        // Go through the item names and join them into a list
        var item_names = "";
		var key_count = item_keys.length;
		for(i = 0; i < key_count; i++){
			var loop_key = item_keys[i];
			var selected_item = item_array[loop_key];
			var item_values = selected_item.split("|");
			var item_name = item_values[0];
			
			if(i > 0){
				item_names = item_names + "|";
			}
			item_names = item_names + item_name;
		}

	    // Check if the search can be matched to an item in the user's possession
	    allArgs = allArgs.toLowerCase();
        var item_names_lower = item_names.toLowerCase();
        item_names_lower = "|" + item_names_lower + "|";
		if(item_names_lower.includes(allArgs) || allArgs == "weapon" || allArgs == "defense" || allArgs == "tool"){
		    // If the argument was "weapon", "defense" or "tool", pick the corresponding item
		    var equip_flag = false;
		    if(allArgs == "weapon" || allArgs == "defense" || allArgs == "tool"){
			    var equipTypes = {"weapon": 0, "defense": 1, "tool": 2};
			    var key = equipTypes[allArgs] + 1;
			    var result_key = equipment_array[key - 1];
			    equip_flag = true;
			}else{
                // First try searching for exact matches. If there is no match, search for any matches
                var key = 0;
                if(item_names_lower.includes("|" + allArgs + "|")){
                    var item_names_array = item_names_lower.split("|");
                	key = item_names_array.indexOf(allArgs);
                }else{
                	var split = item_names_lower.split(allArgs);
                	var left_side = split[0].replace(/[^|]/g, "");
                	key = left_side.length;
                }
    			
    			var result_key = 0;
    			if(key > 3){
    				// It's a consumable item
    				result_key = inventory_array[key - 4];
    			}else{
    				// The item is equipped
    				result_key = equipment_array[key - 1];
    				equip_flag = true;
    			}
			}
			// The item's data has been retrieved!
			var item_data = item_array[result_key].split("|");
            
            // Check if the item can be transformed
            var transformed = 0;
            var price = 0;
            if(item_data[0].includes("Vortex")){
                // Special Vortex transform prevention
                if(item_data[0].includes("Special Vortex")){
                    message.reply({ content: "\u274C Special Vortexes cannot be transformed!", allowedMentions: { repliedUser: false }});
                    return;
                }
                
                // Unique case for Vortexes: Run the code for the appropriate type of Unstable Vortex
                // Determine rarity
                if(item_data[0].includes("(Ultra rare)")){
                    item_data_2 = 2;
                    price = vortexPrices[2];
                }else if(item_data[0].includes("(Rare)")){
                    item_data_2 = 1;
                    price = vortexPrices[1];
                }else{
                    item_data_2 = 0;
                    price = vortexPrices[0];
                }
                
                // Get loot data
                var vortex_loot_groups = lib.readFile("data/vortex_loot.txt").split(";\n");
                var vortex_loot_subgroups = vortex_loot_groups[item_data_2].split("|");
                var drop_counts = vortex_loot_subgroups[0].split(",");
                var common_drops =vortex_loot_subgroups[1].split(",");
                var rare_drops = vortex_loot_subgroups[2].split(",");
                var veryrare_drops = vortex_loot_subgroups[3].split(",");
                var veryrare_chance = parseInt(vortex_loot_subgroups[5]);
                var rare_chance = parseInt(vortex_loot_subgroups[4]) + veryrare_chance;
                
                // Determine result
                var roll_count = lib.rand(drop_counts[0], drop_counts[1]);
                var drops = [];
                for(j = 0; j < roll_count; j++){
                    var rarity_roll = lib.rand(1, 100);
                    if(rarity_roll <= veryrare_chance){
                        var drop_pool = veryrare_drops;
                    }else if(rarity_roll <= rare_chance){
                        var drop_pool = rare_drops;
                    }else{
                        var drop_pool = common_drops;
                    }
                    var drop_roll = lib.rand(0, drop_pool.length - 1);
                    drops[j] = drop_pool[drop_roll];
                }
                transformed = drops[0];
                
            }else if(equip_flag){

                // Load item transformation pool
                if(result_key == "0" || result_key == "1" || result_key == "2"){
                    // Starting equipment, cannot be rerolled
                    message.reply({ content: "\u274C Starting equipment cannot be transformed!", allowedMentions: { repliedUser: false }});
                    return;
                }
                var tf_raw = lib.readFile("data/transform_pools.txt");
                var tf_types = tf_raw.split("#############################################\n");
                // Use a different type pool depending on what key the original item had
                var tf_rarities = tf_types[key - 1].split("|\n");
                // Find out which rarity the original item is part of and use it as the rerolling pool and to determine the price
                var tf_pool = ""
                for(x = 0; x < 6 && tf_pool === ""; x++){
                    if(tf_rarities[x].includes("," + result_key + ",")){
                        tf_pool = tf_rarities[x].split(",");
                        price = equipPrices[x];
                    }
                }
                // Remove the original item as well as the (empty) first and last elements from the array to prepare for the random selection
                tf_pool.splice(0,1);
                tf_pool.splice(tf_pool.length - 1, 1);
                tf_pool.splice(tf_pool.indexOf(result_key), 1);
                
                // Determine the transformation result!
                var tf_rand = lib.rand(0, tf_pool.length - 1);
                transformed = tf_pool[tf_rand];
                
            }else{
                message.reply({ content: "\u274C This item cannot be transformed!", allowedMentions: { repliedUser: false }});
                return;
            }
            
            // Check if the user has enough scrap
            var scrapAmount = lib.readFile(dir + "/scrap.txt");
            if(scrapAmount !== undefined && scrapAmount !== ""){
                scrapAmount = parseInt(scrapAmount);
            }else{
                scrapAmount = 0;
            }
            
            if(scrapAmount < price){
                message.reply({ content: "\u274C You don't have enough scrap to transform this item!\n(" + scrapAmount + "/" + price + ")", allowedMentions: { repliedUser: false }});
                return;
            }
            
            // Alter the user's scrap amount
            scrapAmount = scrapAmount - price;
            lib.saveFile(dir + "/scrap.txt", scrapAmount);
            
            // Fetch modifiers
    		var newModifier = "|0|0|0|0|0|0";
    		var oldModifiers = lib.readFile(dir + "/equip_modifiers.txt").split("\n");
            
            //Remove the item from the user's inventory and give them their new item
            var stat_comparison = "";
            var modifier = "";
            if(!equip_flag){
                // The item is consumable
                // Replace the item directly
                inventory_array[inventory_array.indexOf(result_key)] = transformed;
                lib.saveFile(dir + "/inventory.txt", inventory_array);
                modifier = ["", ""];
            }else{
                // The item is equippable. Replace the user's equipped item and show them the stat changes that occurred!
                // Replace value in equipment array
                if(key == 1){
                    var old_item_key = equipment_array[0];
                    var old_item_key_2 = equipment_array[1];
                    var old_item_key_3 = equipment_array[2];
                    modifier = oldModifiers[0].split("|");
                    oldModifiers[0] = newModifier;
                    equipment_array[0] = transformed;
                }else if(key == 2){
                    var old_item_key = equipment_array[1];
                    var old_item_key_2 = equipment_array[0];
                    var old_item_key_3 = equipment_array[2];
                    modifier = oldModifiers[1].split("|");
                    oldModifiers[1] = newModifier;
                    equipment_array[1] = transformed;
                }else{
                    var old_item_key = equipment_array[2];
                    var old_item_key_2 = equipment_array[0];
                    var old_item_key_3 = equipment_array[1];
                    modifier = oldModifiers[2].split("|");
                    oldModifiers[2] = newModifier;
                    equipment_array[2] = transformed;
                }
                // Save the new equipment
                lib.saveFile(dir + "/equipment.txt", equipment_array.join(","));
                lib.saveFile(dir + "/equip_modifiers.txt", oldModifiers.join("\n"));
                
                // Compare item stats between the two items
                var stats = lib.readFile(dir + "/stats.txt").split("|");
                var old_item = item_array[old_item_key];
                var old_item_data = old_item.split("|");
                var new_item_data = item_array[transformed].split("|");
                
                var attack_dif = parseInt(new_item_data[1]) - parseInt(old_item_data[1]) - parseInt(modifier[1]);
                var speed_dif = parseInt(new_item_data[2]) - parseInt(old_item_data[2]) - parseInt(modifier[2]);
                var cap_dif = parseInt(new_item_data[3]) - parseInt(old_item_data[3]) - parseInt(modifier[3]);
                var mluck_dif = parseInt(new_item_data[4]) - parseInt(old_item_data[4]) - parseInt(modifier[4]);
                var iluck_dif = parseInt(new_item_data[5]) - parseInt(old_item_data[5]) - parseInt(modifier[5]);
                var gluck_dif = parseInt(new_item_data[6]) - parseInt(old_item_data[6]) - parseInt(modifier[6]);
                
                var stat_diffs = [0, attack_dif, speed_dif, cap_dif, mluck_dif, iluck_dif, gluck_dif];
                var stat_names = ["Filler", "Attack/Defense", "Speed", "Capture Efficiency", "Monster Luck", "Item Luck", "Greater Item Luck", "Unnamed"];
                
                // Create stat comparison field
        		stat_comparison = "```diff";
        		for(y = 1; y < 7; y++){
                    // Add stat differences if they exist
                    if(stat_diffs[y] !== 0 || parseInt(modifier[y]) !== 0){
                        if(modifier[y] > 0){modifier[y] = "+" + modifier[y];}
                        var plus_extra = "";
                        if(stat_diffs[y] >= 0){plus_extra = "+";}
                        if(parseInt(modifier[y]) === 0){
                            stat_comparison = stat_comparison + "\n" + stat_names[y] + ":\n" + plus_extra + stat_diffs[y];
                        }else{
                            stat_comparison = stat_comparison + "\n" + stat_names[y] + ":\n" + plus_extra + stat_diffs[y] + " (" + modifier[y] + ")";
                        }
                    }
        		}

        		// Add ability if it is different
        		var abilityRaw = lib.readFile(dir + "/ability.txt").split("|");
        		old_item_data[11] = abilityRaw[key - 1];
        		if(new_item_data[11] != old_item_data[11]){
        		    var abilityTitles = ["Ability", "Ability Modifier", "Ability Activation"];
        		    // Get new and old ability names
        		    var abilities = lib.readFile("data/abilities.txt").split("######################################\n");
        		    var abilityNames = abilities[key - 1].split(";\n");
        		    var abilityTitle = abilityTitles[key - 1];
        		    var oldAbility = abilityNames[parseInt(old_item_data[11])];
        		    var newAbility = abilityNames[parseInt(new_item_data[11])];
        		    if(parseInt(oldAbility) === 0){oldAbility = "None";}
        		    if(parseInt(newAbility) === 0){newAbility = "None";}
        		    stat_comparison = stat_comparison + "\n" + abilityTitle + ":\n" + oldAbility + " => " + newAbility;
        		}
        		stat_comparison = "\nYour stats have thus changed in the following ways:" + stat_comparison + "```";
        		
        		// Recalculate the user's stats
                // Remove old item's values from the user's stats and add the new ones
                for(y = 1; y < 7; y++){
                    var base = parseInt(stats[y]);
                    var minus = parseInt(old_item_data[y]) + parseInt(modifier[y]);
                    var plus = parseInt(new_item_data[y]);
                    stats[y] = base - minus + plus;
                }
                
                // Save stats
                lib.saveFile(dir + "/stats.txt", stats.join("|"));
                
                // Overwrite ability and reset cooldown if an ability has changed
                key--;
                if(new_item_data[11] != old_item_data[11]){
                    var abilityRaw = lib.readFile(dir + "/ability.txt").split("|");
                    abilityRaw[key] = new_item_data[11];
                    // Update cooldown (evaluate if the old or new abilities apply for each type)
                    var abilityList = lib.readFile("data/ability_conditions.txt").split("\n");
                    var abilityVariants = abilityList[parseInt(abilityRaw[0])].split(";;");
                    if(parseInt(abilityRaw[1]) < 3){var abilityVariant = abilityVariants[parseInt(abilityRaw[1])].split("|");}
                    else{var abilityVariant = abilityVariants[0].split("|");}
                    var abilityCondition = parseInt(abilityVariant[parseInt(abilityRaw[2])]);
                    // Save to files
                    var d = new Date();
                    lib.saveFile(dir + "/ability_timestamp.txt", Math.floor(d.getTime() / 60000));
                    lib.saveFile(dir + "/ability.txt", abilityRaw.join("|"));
                    lib.saveFile(dir + "/ability_cd.txt", abilityCondition);
                }
                
            }
            
            //Output
            var transformed_data = item_array[transformed].split("|");
            message.reply({ content: "You transformed your **[" + modifier[0] + item_data[0] + "]** into **[" + transformed_data[0] + "]** in exchange for **" + price + "** scrap!" + stat_comparison, allowedMentions: { repliedUser: false }});
            
		}else{
		    message.reply({ content: "\u274C That item could not be found!", allowedMentions: { repliedUser: false }});
		}

	},
};