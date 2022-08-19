var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'craft',
	usages: ['[item name]', 'confirm'],
	descriptions: ['Checks the crafting recipe for an item and whether you are able to create it', 'Confirms the crafting process. This needs to be used after the above variant of the command'],
    shortDescription: 'Craft items',
    category: 'items',
	
	execute(message, user, args) {
	    allArgs = args.join(" ").toLowerCase();
	    var adc  = require('adc.js');
        
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
        
        // Check if the user tried to confirm a crafting process
        var item_array = lib.readFile("data/items.txt").split(";\n");
        var buttons = [];
        if(allArgs == "confirm"){
            // If there is no valid crafting queue, stop the command
            var craft_queue = lib.readFile(dir + "/crafting_queue.txt");
            if(!lib.exists(craft_queue)){
                message.reply({ content: "@ __**" + username + "**__ \u274C Use `" + prefix + "craft [item name]` while having the necessary ingredients to start a crafting prompt first!", allowedMentions: { repliedUser: false }});
                return;
            }
            
            // Do the crafting
            var craft_data = craft_queue.split("|");
            var reward = craft_data[0];
            if(craft_data[1].includes(":")){
                var ingredients = craft_data[1].split(":");
            }else{
                var ingredients = [craft_data[1]];
            }
            
            // Determine reward item type
            var item_array = lib.readFile("data/items.txt").split(";\n");
            var reward_item = item_array[reward];
            var reward_data = reward_item.split("|");
        
            if(reward_data[10] != "Weapon" && reward_data[10] != "Tool" && reward_data[10] != "Defense"){
                // It is an item
                var reward_type = "item";
            }else{
                var reward_type = "equipment";
            }
            
            // Remove the required items from the user's inventory / materials
            var materials = lib.readFile(dir + "/materials.txt").split(",");
            var inventory = lib.readFile(dir + "/inventory.txt");
            var stats = lib.readFile(dir + "/stats.txt").split("|");
            var inventory_array = inventory.split(",");
            var ability_extra = "";
            for(o = 0; o < ingredients.length; o++){
                var ingredient_info = ingredients[o].split(",");
                var source = ingredient_info[0];
                var item_data = item_array[source].split("|");
                var no_remove = false;
                
                // If the user is eligible for Craftsman abilities, check for activation
                if(stats[0] == "Craftsman"){
                    var ability_rand = lib.rand(1, 100);
                    if(parseInt(stats[10]) >= 50){
                        if(ability_rand <= 6){
                            no_remove = true;
                            ability_extra += "\n[" + item_data[0] + "]";
                        }
                    }else if(parseInt(stats[10]) >= 30){
                        if(ability_rand <= 4){
                            no_remove = true;
                            ability_extra += "\n[" + item_data[0] + "]";
                        }
                    }
                }
                
                // Determine inventory to remove from
                if(item_data[10] == "Material"){
                    // The item is in the materials inventory
                    var source_inv = materials;
                }else if(item_data[10] == "Weapon" || item_data[10] == "Tool" || item_data[10] == "Defense"){
                    // The item is equipped so there's no need to remove anything
                    no_remove = true;
                }else{
                    // The item is in the inventory
                    var source_type = "inventory";
                    var source_inv = inventory_array;
                }

                if(!no_remove){
                    // Remove all items with the same ID in a loop
                    for(i = 0; i < parseInt(ingredient_info[1]); i++){
                        var remov_key = source_inv.indexOf(source);
                        source_inv.splice(remov_key, 1);
                    }
                }
            }
            lib.saveFile(dir + "/materials.txt", materials.join(","));
            inventory = inventory_array.join(",");
            
            // Give the user their reward
            if(reward_type == "item"){
                // The reward is an item - Add it to the inventory
                if(inventory !== ""){
                    inventory = inventory + ",";
                }
                inventory = inventory + reward;
                equip_out_2 = "";
            }else{
                // The crafted item is equippable. Start equip prompt
                // Get new item's type
                var new_item = item_array[reward];
                var new_item_data = new_item.split("|");
                var new_type = new_item_data[10];
                if(new_type == "Defense"){new_type = "Defensive equipment";}
                // Save the new equipment
                lib.saveFile(dir + "/new_equip.txt", reward);
                
				// Generate a new modifier if this is not an equipment upgrade
				if(craft_data[2].includes("Upgrade")){
					var oldModifiers = lib.readFile(dir + "/equip_modifiers.txt").split("\n");
					var modifier = "";
					if(new_type == "Weapon"){modifier = oldModifiers[0];}else
					if(new_type == "Defense"){modifier = oldModifiers[1];}else
					if(new_type == "Tool"){modifier = oldModifiers[2];}
				}else{
					var user_stats = lib.readFile(dir + "/stats.txt").split("|");
					var modifier = lib.generateModifier(user_stats[6]);
					lib.saveFile(dir + "/new_modifier.txt", modifier);
				}
				reward_data[0] = modifier.split("|")[0] + reward_data[0];
				
                // Define buttons
                var button1 = new MessageButton()
        			.setCustomId(user.id + "|equip")
        			.setLabel('Equip')
        			.setStyle('SUCCESS')
                var button2 = new MessageButton()
        			.setCustomId(user.id + "|compare")
        			.setLabel('Compare')
        			.setStyle('PRIMARY')
        		var button3 = new MessageButton()
        			.setCustomId(user.id + "|equip convert")
        			.setLabel('Convert')
        			.setStyle('DANGER')
        		buttons = [button1, button2, button3];
                
                // Change some output stuff
                equip_out_2 = " - Use `" + prefix + "equip` to replace your current " + new_type + " with this item!\nUse `" + prefix + "compare` to compare the two\nUse `" + prefix + "equip convert` to convert it into Scrap";
            }
            
            // Save inventory
            lib.saveFile(dir + "/inventory.txt", inventory);
            
            // Output after crafting
            lib.saveFile(dir + "/crafting_queue.txt", "");
            if(ability_extra !== ""){
                ability_extra = "\nThanks to your Craftsman abilities the following items have __not__ been consumed:" + ability_extra;
            }
            // Output
            if(buttons.length > 0){
                // Button output
                var row = new MessageActionRow().addComponents(buttons);
                message.reply({ content: "@ __**" + username + "**__, you successfully crafted the **" + reward_data[0] + "!**" + equip_out_2 + ability_extra, allowedMentions: { repliedUser: false }, components: [row] });
            }else{
                // Normal output
                message.reply({ content: "@ __**" + username + "**__, you successfully crafted the **" + reward_data[0] + "!**" + equip_out_2 + ability_extra, allowedMentions: { repliedUser: false } });
            }
            return;
        }
        
        // Check if the user's input matches a craftable item. If yes then get its data
        var recipes = lib.readFile("data/recipes.txt").split(";\n");
        //Go through all the craftable item names and merge them into a list for searching through
        var key_count = recipes.length;
        var item_names2 = "";
        for(y = 0; y < key_count; y++){
            var recipe = recipes[y].split("|");
            var item = item_array[recipe[0]].split("|");
            var item_name = item[0];
            
            if(y > 0){
                item_names2 = item_names2 + "|";
            }
            item_names2 = item_names2 + item_name;
        }
        
        var item_names_lower = item_names2.toLowerCase();
        item_names_lower = "|" + item_names_lower + "|";
        if (item_names_lower.includes(allArgs)) {
            // First try searching for exact matches only. If there is no exact match, search for any matches
            var key = 0;
			if(item_names_lower.includes("|" + allArgs + "|")){
			    var item_names_array = item_names_lower.split("|");
				key = item_names_array.indexOf(allArgs);
			}else{
				var split = item_names_lower.split(allArgs);
				var left_side = split[0].replace(/[^|]/g, "");
				key = left_side.length;
			}
			key--;
        }else{
            message.reply({ content: "\u274C That item could not be found in the recipe database!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // The item's data has been retrieved
        var result_recipe = recipes[key];
        var recipe_data = result_recipe.split("|");
        var result_key = recipe_data[0];
        var result_item = item_array[result_key].split("|");
        
        // Obtain ingredient data
        if(recipe_data[1].includes(":")){
            var ingredients = recipe_data[1].split(":");
        }else{
            var ingredients = [recipe_data[1]];
        }
        
        // Check how many of the required materials the user has (see below)
        var inventory = lib.readFile(dir + "/inventory.txt");
        var equipment = lib.readFile(dir + "/equipment.txt");
        var materials = lib.readFile(dir + "/materials.txt");
        var equipment_keys = equipment.split(",");
        var item_keys = [];
        if(materials !== undefined && materials !== ""){
            if(inventory !== "" && inventory !== undefined){
                inventory = inventory + "," + materials;
            }else{
                inventory = materials;
            }
        }
        if(inventory.includes(",")){
            item_keys = (equipment + "," + inventory).split(",");
        }else if(inventory !== ""){
            item_keys = [equipment_keys[0], equipment_keys[1], equipment_keys[2], inventory];
        }else{
            item_keys = [equipment_keys[0], equipment_keys[1], equipment_keys[2]];
        }
        
		// Add the previous modifier to the name if this is an equipment upgrade
		if(recipe_data[2].includes("Upgrade")){
			var oldModifiers = lib.readFile(dir + "/equip_modifiers.txt").split("\n");
			var modifier = "";
			if(recipe_data[2].includes("Weapon")){modifier = oldModifiers[0].split("|");}else
			if(recipe_data[2].includes("Defense")){modifier = oldModifiers[1].split("|");}else
			if(recipe_data[2].includes("Tool")){modifier = oldModifiers[2].split("|");}
			result_item[0] = modifier[0] + result_item[0];
		}
		
        // Create output embed
        var outputEmbed = new Discord.MessageEmbed()
        	.setColor('#0099ff')
        	.setTitle("[" + result_item[0] + "] crafting recipe");
        
        var ingredient_info = "";
        var ingredient_info_2 = "";
        var craftable = true;
        for(p = 0; p < ingredients.length; p++){
            var ingredient_data = ingredients[p].split(",");
            // Check if the user has it in the first place
            if(("," + equipment + "," + inventory + ",").includes("," + ingredient_data[0] + ",")) {
                // Count the ingredient
                var counted = new adc(item_keys).count();
                var count = counted[ingredient_data[0]];
            }else{
                var count = 0;
            }
            // Check if the user has enough of the item
            if(count < parseInt(ingredient_data[1])){
                craftable = false;
            }
            
            // Format output embed fields
            var ingredient_item_data = item_array[ingredient_data[0]].split("|");
            var ingredient_name = ingredient_item_data[0];
            ingredient_info = ingredient_info + "\n" + ingredient_name;
            ingredient_info_2 = ingredient_info_2 + count + "/" + ingredient_data[1] + "\n";
        }
        
        // Finalize embed fields
        outputEmbed
            .addFields( 
                { name: "Required ingredients", value: ingredient_info, inline: true },
                { name: "Owned / Needed", value: ingredient_info_2, inline: true }
            );
		
        // If the user is able to craft the item, ask for confirmation and save important values temporarily
        var confirmation = "";
        if(craftable){
            // Create button
            var button1 = new MessageButton()
    			.setCustomId(user.id + "|craft confirm")
    			.setLabel('Confirm')
    			.setStyle('SUCCESS')
    		buttons = [button1];
            
            lib.saveFile(dir + "/crafting_queue.txt", result_key + "|" + recipe_data[1] + "|" + recipe_data[2]);
            outputEmbed
                .setFooter({ text: "Use \"" + prefix + "craft confirm\" or press the button to craft it!" });
        }
        
        // Prepare ability variables
        var abilities = lib.readFile("data/abilities.txt").split("######################################\n");
		
		// Further differentiate between item types and add item details to the output
		var stat_names = ["Filler", "Attack", "Speed", "Capture Efficiency", "Monster Luck", "Item Luck", "Greater Item Luck", "Type Bonus"];
		// Modify embed
		outputEmbed
        	.setDescription(result_item[9])
        	.addFields( { name: "\u200B", value: "\u200B", inline: true } );
		if(result_item[10] == "Weapon"){
		    outputEmbed
            	.addFields( { name: 'Type', value: "Weapon", inline: true } );
		    // Add ability if needed
            var itemAbilities = abilities[0].split(";\n");
            var abilityName = itemAbilities[parseInt(result_item[11])];
            if(abilityName != "None"){
                outputEmbed
                    .addFields( { name: 'Ability', value: abilityName, inline: true } );
            }
		    // Add additional fields to the embed
		    outputEmbed
            	.addFields(
            		{ name: 'Attack', value: result_item[1], inline: true },
            		{ name: 'Speed', value: result_item[2], inline: true }
            	);
            	
            for(o = 3; o < 8; o++){
                if(parseInt(result_item[o]) !== 0){
                    if(o == 7){
                        // Special kind of field for type bonus
                        outputEmbed
                            .addFields( { name: 'Type Bonus', value: result_item[7] + ' against [' + result_item[8] + ']', inline: true } );
                    }else{
                        outputEmbed
                            .addFields( { name: stat_names[o], value: result_item[o], inline: true } );
                    }
                }
            }
		}else if(result_item[10] == "Defense"){
			// Add additional fields to the embed
			var weight = "Medium";
			if(result_item[2] > result_item[1] * 2){weight = "Light";}
			else if(result_item[2] * 2 < result_item[1]){weight = "Heavy";}
		    outputEmbed
            	.addFields( { name: 'Type', value: "Defensive equipment", inline: true } );
            // Add ability if needed
            var itemAbilities = abilities[1].split(";\n");
            var abilityName = itemAbilities[parseInt(result_item[11])];
            if(parseInt(abilityName) !== 0){
                outputEmbed
            	    .addFields( { name: 'Ability Modifier', value: abilityName, inline: true } );
            }
            outputEmbed
            	.addFields(
            		{ name: 'Defense', value: result_item[1], inline: true },
            		{ name: 'Weight', value: weight + " (+" + result_item[2] + " Speed)", inline: true }
            	)
            
            for(o = 3; o < 8; o++){
                if(parseInt(result_item[o]) !== 0){
                    if(o == 7){
                        // Special kind of field for type bonus
                        outputEmbed
                            .addFields( { name: 'Type Bonus', value: result_item[7] + ' against [' + result_item[8] + ']', inline: true } );
                    }else{
                        outputEmbed
                            .addFields( { name: stat_names[o], value: result_item[o], inline: true } );
                    }
                }
            }
		}else if(result_item[10] == "Tool"){
			// Add additional fields to the embed
		    outputEmbed
            	.addFields( { name: 'Type', value: "Divine Tool", inline: true } );
            // Add ability
            var itemAbilities = abilities[2].split(";\n");
            var abilityName = itemAbilities[parseInt(result_item[11])];
            outputEmbed
            	.addFields( { name: 'Ability Activation', value: abilityName, inline: true } );
            	
            for(o = 1; o < 8; o++){
                if(parseInt(result_item[o]) !== 0){
                    if(o == 7){
                        // Special kind of field for type bonus
                        outputEmbed
                            .addFields( { name: 'Type Bonus', value: result_item[7] + ' against [' + result_item[8] + ']', inline: true } );
                    }else{
                        outputEmbed
                            .addFields( { name: stat_names[o], value: result_item[o], inline: true } );
                    }
                }
            }
		}else{
			// It is a consumable (possibly a special one though)
			// Add additional fields to the embed
		    outputEmbed
            	.addFields(
            		{ name: 'Type', value: "Consumable", inline: true},
            	);
            	
            for(o = 1; o < 8; o++){
                if(parseInt(result_item[o]) !== 0){
                    if(o == 7){
                        // Special kind of field for type bonus
                        outputEmbed
                            .addFields( { name: 'Type Bonus', value: result_item[7] + ' against [' + result_item[8] + ']', inline: true } );
                    }else{
                        outputEmbed
                            .addFields( { name: stat_names[o], value: result_item[o], inline: true } );
                    }
                }
            }
            var item_subinfo = result_item[10].split(",");
            if(result_item[10].includes("Ability") || result_item[10].includes("Vortex") || result_item[10].includes("Realm") || result_item[10].includes("Stasis") || result_item[10].includes("Mindwipe") || result_item[10].includes("Shifter")){
                // Do nothing for some special items
            }else{
                // Add use duration / charge amount otherwise
                if(result_item[10].includes("Charge")){
                    var use_display = "Charge Amount";
                }else{
                    var use_display = "Use Duration";
                }
                outputEmbed
                    .addFields( { name: use_display, value: item_subinfo[1], inline: true } );
            }
            
            // Add default selling price
            outputEmbed
                .addFields( { name: "Price", value: result_item[11] + " Gold", inline: true } );
            
		}
		
		// Add compare button for equipment
		if(result_item[10] == "Tool" || result_item[10] == "Weapon" || result_item[10] == "Defense"){
		    var compButton = new MessageButton()
    			.setCustomId(user.id + "|compare " + result_item[0])
    			.setLabel('Compare')
    			.setStyle('PRIMARY')
    		buttons.push(compButton);
		}
        
        // Output
        if(buttons.length > 0){
            // Button output
            var row = new MessageActionRow().addComponents(buttons);
            message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false }, components: [row]});
        }else{
            // Normal output
            message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false }});
        }
        
	},
};