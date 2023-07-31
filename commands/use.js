var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'use',
	usages: ['[item name]', '[amount] [vortex, buff or charge item name]'],
	descriptions: ['Uses an item from your inventory', 'Uses multiple vortexes, charge items or buffing items of the same type from your inventory. For unstable vortexes you can\'t use more than 10 at once'],
    shortDescription: 'Use items',
    weight: 5,
    addendum: [
        '- Most items will grant temporary buffs or debuffs to your stats. Some unique items also have special effects',
        '- Only consumable items from your `{prefix}inventory` can be used',
        '- Most items normally disappear after one use',
        '- Using multiple copies of a buffing item at once will simply stack the buff duration',
        '- Activating a buff that does not match your currently active buff will simply replace it',
        '- You can view your items and their effects with `{prefix}inventory`'
    ],
    category: 'items',

	execute(message, user, args, prefix) {
	    var adc  = require('adc.js');
	    var allArgs = args.join(" ");
        
        // Set important variables
        var username = user.username;
        var dir = "userdata/" + user.id;
        
        // If the user isn't registered yet, stop the command
        if(!fs.existsSync(dir)){
            message.reply({ content: "\u274C Use `" + prefix + "encounter` first to create an account!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // Get a full list of all the user's items
        var inventory = lib.readFile(dir + "/inventory.txt");
        var items = lib.readFile("data/items.txt");
        var items_array = items.split(";\n");
        if(inventory.includes(",")){
            var item_keys = inventory.split(",");
        }else if(inventory !== ""){
            item_keys = [inventory];
        }else{
            message.reply({ content: "\u274C You don't have any useable items!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // Go through the item names and join them into a list
        var item_names = "";
		var key_count = item_keys.length;
		for(i = 0; i < key_count; i++){
			var loop_key = item_keys[i];
			var selected_item = items_array[loop_key];
			var item_values = selected_item.split("|");
			var item_name = item_values[0];
			
			if(i > 0){
				item_names = item_names + "|";
			}
			item_names = item_names + item_name;
		}
        
        // Check if the user gave an input. If so, look for it in their inventory and give out its info if possible
        if(args.length > 0){
            // Ignore the first argument if it is a number and remember it for vortexes later
            var amountNum = 1;
            if(args[0].replace(/[0-9]/g, "") === ""){
                amountNum = parseInt(args[0]);
                args.splice(0, 1);
                allArgs = args.join(" ");
            }
            
			// There was an argument so check if it matches an item
			allArgs = allArgs.toLowerCase();
			var item_names_lower = item_names.toLowerCase();
			item_names_lower = "|" + item_names_lower + "|";
			
			// Check if the search can be matched to an item in the user's possession
			if(item_names_lower.includes(allArgs)){
				// First try searching for exact matches. If there is none, search for any matches
    			var result_key = 0;
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
                var inventory_array = inventory.split(",");
                result_key = inventory_array[key];
            
				// The item's data has been retrieved!
				var new_item_data = items_array[result_key].split("|");
				
				// Make sure the user has enough
                var itemVCounts = new adc(inventory_array).count();
                if(itemVCounts[result_key] < amountNum){
                    // Not enough
                    message.reply({ content: "\u274C You don't have enough of the item **" + new_item_data[0] + "**!\nYour held amount is " + itemVCounts[result_key], allowedMentions: { repliedUser: false }});
                    return;
                }
				
				// Check if there was already another buff active. If so then remove it from the user's stats further down
                var current_buff = lib.readFile(dir + "/current_buff.txt");
                if(current_buff !== ""){
                    var buff_stats = current_buff.split("|");
                }else{
                    var buff_stats = ["Non", 0, 0, 0, 0, 0, 0, 0, 0, "Special", "Charge,0"];
                }
				
				// If the item is a special charge item then increase the radar charges but don't apply a regular buff further down
                var new_item_data_2 = new_item_data[10].split(",");
                var no_buff = false;
                var charge_flag = false;
                if(new_item_data_2[0] == "Charge"){
                    // Update charges, also in active radar buff if necessary
                    if(buff_stats[0] == "Monster Radar"){
                        var buff_stats_sub = buff_stats[10].split(",");
                        var charges = parseInt(buff_stats_sub[1]) + (parseInt(new_item_data_2[1]) * amountNum);
                        buff_stats[10] = "Special," + charges;
                        lib.saveFile(dir + "/current_buff.txt", buff_stats.join("|"));
                    }
                    var old_charges = lib.readFile(dir + "/charges.txt");
                    charges = parseInt(old_charges) + (parseInt(new_item_data_2[1]) * amountNum);
                    lib.saveFile(dir + "/charges.txt", charges);
                    // Set flag for later
                    no_buff = true;
                    charge_flag = true;
                }
				
				// If the item is a token then increase the token counter and don't apply a regular buff
				var token_flag = false;
                if(new_item_data_2[0] == "Token"){
                    var special_extra = "";
                    var tokenState = lib.readFile(dir + "/token_state.txt");
                    if(!lib.exists(tokenState)){
                        tokenState = 0;
                    }
                    tokenState = parseInt(tokenState) + (parseInt(new_item_data_2[1]) * amountNum);
                    lib.saveFile(dir + "/token_state.txt", tokenState);
                    // Set flag for later
                    no_buff = true;
                    token_flag = true;
                }
				
				// If the item is a dimensional fragment then move the user to a realm but don't apply a regular buff further down
                var stats = lib.readFile(dir + "/stats.txt").split("|");
                if(new_item_data_2[0] == "Realm"){
                    // If the fragment is unrefined then take the user to a random realm, otherwise take them to the specified realm
                    var realm_list = lib.readFile("data/area_names.txt").split(",");
                    var unique_realms = lib.readFile("data/unique_realms.txt").split(",");
                    if(new_item_data_2[1] == "Special"){
                        // It's a special fragment. Load unique realm list and get event realm
                        var current_event = lib.readFile("data/weekly_realm.txt");
                        var new_event = current_event;
                        
                        // Update the weekly event realm if necessary
                        var week = lib.getWeek();
                        var last_realm_week = lib.readFile("data/realm_week.txt");
                        if(last_realm_week != week){
                            // Decide on a new weekly realm
                            while(new_event == current_event){
                                var new_event_id = lib.rand(0, unique_realms.length - 1);
                                new_event = unique_realms[new_event_id];
                            }
                            // Update files
                            lib.saveFile("data/weekly_realm.txt", new_event);
                            lib.saveFile("data/realm_week.txt", week);
                        }
                        
                        // Take the user to the weekly realm
                        var weekly_realm = lib.readFile("data/weekly_realm.txt");
                        var realm = weekly_realm;
                        
                    }else if(new_item_data_2[1] == "?"){
                        // Define list of allowed realms
                        var normal_realms = [];
                        for(i = 14; i < realm_list.length; i++){
                            if(!unique_realms.includes(i + "")){
                                normal_realms.push(i);
                            }
                        }
                        var realm_rand = lib.rand(0, normal_realms.length - 1);
                        var realm = normal_realms[realm_rand];
                        
                    }else{
                        var realm = new_item_data_2[1];
                    }
                    lib.saveFile(dir + "/area.txt", realm);
                    
                    // Calculate the user's starting HP
                    var rank_hp_bonus = {"D": 0, "C": 100, "B": 200, "A": 300, "S": 400, "SS": 500};
                    var attack_hp_bonus = ((stats[1] / stats[2]) - 1) * 100;
                    var hp = Math.round((stats[10] * 8) + (stats[11] / 12) + rank_hp_bonus[stats[9]] + attack_hp_bonus);
                    lib.saveFile(dir + "/hp.txt", hp);
                    // Output
                    var realm_name = realm_list[realm];
                    var special_extra = "\nYou've been transported to the **" + realm_name + "** and your starting HP is **" + hp + "**";
                    no_buff = true;
                }
				
				// If the item is a Stasis Cube then check if the user is in an encounter and save the encounter for later. Also don't apply regular buffs further down
                var keep_item_2 = false;
                if(new_item_data_2[0] == "Stasis"){
                    
                    // Check if the user is in an encounter
                    var current_enc = lib.readFile(dir + "/current_encounter.txt");
                    var saved_enc = lib.readFile(dir + "/saved_encounter.txt");
                    if(current_enc !== ""){
                        // There is an active encounter. Ask for confirmation and then save it
                        var confirmation = lib.readFile(dir + "/confirm.txt");
                        if(confirmation == "confirmed"){
                            lib.saveFile(dir + "/saved_encounter.txt", current_enc);
                            lib.saveFile(dir + "/current_encounter.txt", "");
                            lib.saveFile(dir + "/confirm.txt", "");
                            lib.saveFile(dir + "/chain.txt", "0|0");
                            var special_extra = " You stored the encounter in your Stasis space! Tip: You can see your Stasis Space with `" + prefix + "inv`.";
                            // Prevent the Stasis Cube from being removed (since it should only get removed when reactivating or overwriting an encounter)
                            keep_item_2 = true;
                            if(saved_enc !== ""){
                                special_extra = special_extra + "\nThe Stasis Cube broke in the process of overwriting your previously stored encounter!";
                                keep_item_2 = false;
                            }
                        }else{
                            // Confirmation button
                            var button1 = new ButtonBuilder()
                    			.setCustomId(user.id + "|use stasis cube")
                    			.setLabel('Confirm')
                    			.setStyle(4)
                    		var row = new ActionRowBuilder().addComponents([button1]);
                            
                            // Output with needed confirmation
                            message.reply({ content: "@ __**" + username + "**__, you're about to store your encounter in the stasis space. **Anything already inside the space will be overwritten! Your current capture chain will also be lost!**\nUse the same command again or press the button to confirm this action.\nFinish your current encounter first if you want to resume a stored encounter instead!", components: [row], allowedMentions: { repliedUser: false }});
                            lib.saveFile(dir + "/confirm.txt", "confirmed");
                            return;
                        }
                        
                    }else{
                        // There is no encounter. Check if there already is a saved encounter
                        if(saved_enc !== ""){
                            // There is a saved encounter. Ask for confirmation and then reactivate it!
                            var confirmation = lib.readFile(dir + "/confirm.txt");
                            if(confirmation == "confirmed2"){
                                lib.saveFile(dir + "/current_encounter.txt", saved_enc);
                                lib.saveFile(dir + "/saved_encounter.txt", "");
                                lib.saveFile(dir + "/confirm.txt", "");
                                var special_extra = " You resumed your stored encounter! Use `" + prefix + "showenc` to display it again!\nThe Stasis Cube broke!";
                            }else{
                                // Confirmation button
                                var button1 = new ButtonBuilder()
                        			.setCustomId(user.id + "|use stasis cube")
                        			.setLabel('Confirm')
                        			.setStyle(4)
                        		var row = new ActionRowBuilder().addComponents([button1]);
                                
                                //Output requiring confirmation
                                message.reply({ content: "@ __**" + username + "**__, you're about to release your stored encounter!\nUse the same command again or press the button to confirm!", components: [row], allowedMentions: { repliedUser: false }});
                                lib.saveFile(dir + "/confirm.txt", "confirmed2");
                                return;
                            }
                            
                        }else{
                            message.reply({ content: "@ __**" + username + "**__ \u274C You have no stored encounter to release!", allowedMentions: { repliedUser: false }});
                            return;
                        }
                        
                    }
                    
                    // No buff
                    no_buff = true;
                }

                // If the item is a Memory Link then check if the user has a chain and save it for later. Also don't apply regular buffs further down
                var keep_item_2 = false;
                if(new_item_data_2[0] == "Memory"){
                    
                    // Check if the user has a chain (higher than 0)
                    var chain = lib.readFile(dir + "/chain.txt");
                    var savedChain = lib.readFile(dir + "/saved_chain.txt");
                    if(chain !== "" && chain.split("|")[1] != "0"){
                        // There is a chain. Ask for confirmation and then save it
                        var confirmation = lib.readFile(dir + "/confirm.txt");
                        if(confirmation == "chainConfirmed"){
                            lib.saveFile(dir + "/saved_chain.txt", chain);
                            lib.saveFile(dir + "/chain.txt", "");
                            lib.saveFile(dir + "/confirm.txt", "");
                            var special_extra = " You saved the capture chain! Tip: You can see your saved chain with `" + prefix + "inv`.";
                            // Prevent the Memory Link from being removed (since it should only get removed when reactivating or overwriting a chain)
                            keep_item_2 = true;
                            if(savedChain !== ""){
                                special_extra = special_extra + "\nThe Memory Link broke in the process of overwriting your previously stored chain!";
                                keep_item_2 = false;
                            }
                        }else{
                            // Confirmation button
                            var button1 = new ButtonBuilder()
                    			.setCustomId(user.id + "|use memory link")
                    			.setLabel('Confirm')
                    			.setStyle(4)
                    		var row = new ActionRowBuilder().addComponents([button1]);
                            
                            // Output with needed confirmation
                            message.reply({ content: "@ __**" + username + "**__, you're about to save your capture chain. **If you already have a saved chain then it will be overwritten!**\nUse the same command again or press the button to confirm this action.\nFinish your current chain first if you want to resume a saved chain instead!", components: [row], allowedMentions: { repliedUser: false }});
                            lib.saveFile(dir + "/confirm.txt", "chainConfirmed");
                            return;
                        }
                        
                    }else{
                        // There is no chain. Check if there already is a saved chain
                        if(savedChain !== ""){
                            // There is a saved chain. Ask for confirmation and then restore it!
                            var confirmation = lib.readFile(dir + "/confirm.txt");
                            if(confirmation == "chainConfirmed2"){
                                lib.saveFile(dir + "/chain.txt", savedChain);
                                lib.saveFile(dir + "/saved_chain.txt", "");
                                lib.saveFile(dir + "/confirm.txt", "");
                                var special_extra = " You resumed your saved capture chain!\nThe Memory Link broke!";
                            }else{
                                // Confirmation button
                                var button1 = new ButtonBuilder()
                        			.setCustomId(user.id + "|use memory link")
                        			.setLabel('Confirm')
                        			.setStyle(4)
                        		var row = new ActionRowBuilder().addComponents([button1]);
                                
                                //Output requiring confirmation
                                message.reply({ content: "@ __**" + username + "**__, you're about to resume your stored capture chain!\nUse the same command again or press the button to confirm!", components: [row], allowedMentions: { repliedUser: false }});
                                lib.saveFile(dir + "/confirm.txt", "chainConfirmed2");
                                return;
                            }
                            
                        }else{
                            message.reply({ content: "@ __**" + username + "**__ \u274C You have no stored capture chain to resume!", allowedMentions: { repliedUser: false }});
                            return;
                        }
                        
                    }
                    
                    // No buff
                    no_buff = true;
                }
                
				// If the item is a Vortex then give the user some loot but don't apply a regular buff further down
				vortex_flag = false;
                if(new_item_data_2[0] == "Vortex"){
                    var drops = [];
                    
                    // Prevent unstable vortex spam
                    if(result_key == 231 || result_key == 232 || result_key == 233){
                        if(amountNum > 10){
                            message.reply({ content: "\u274C You can only use a maximum of 10 unstable vortexes at once!", allowedMentions: { repliedUser: false }});
                            return;
                        }
                    }
                    
                    // Loop through this part to allow the use of multiple vortexes at once
                    for(z = 0; z < amountNum; z++){
                        // For unstable Vortexes, turn them into a different vortex first before getting the rewards
                        var vortex_loot_groups = lib.readFile("data/vortex_loot.txt").split(";\n");
                        special_extra = " It spat out some items:```";
                        if(amountNum > 1){special_extra = " They spat out some items:```";}
                        if(new_item_data[0].includes("Unstable Vortex")){
                            // Pick random new Vortex based on the tier
                            // Get loot data
                            var vortex_loot_subgroups = vortex_loot_groups[new_item_data_2[1]].split("|");
                            var common_drops =vortex_loot_subgroups[1].split(",");
                            var rare_drops = vortex_loot_subgroups[2].split(",");
                            var veryrare_drops = vortex_loot_subgroups[3].split(",");
                            var veryrare_chance = parseInt(vortex_loot_subgroups[5]);
                            var rare_chance = parseInt(vortex_loot_subgroups[4]) + veryrare_chance;
                            
                            // Determine result
                            var rarity_roll = lib.rand(1, 100);
                            if(rarity_roll <= veryrare_chance){
                                var drop_pool = veryrare_drops;
                            }else if(rarity_roll <= rare_chance){
                                var drop_pool = rare_drops;
                            }else{
                                var drop_pool = common_drops;
                            }
                            var drop_roll = lib.rand(0, drop_pool.length - 1);
                            var newVortexId = drop_pool[drop_roll];
                            
                            // Get new Vortex info and replace the other variables with them
                            new_item_data = items_array[newVortexId].split("|");
                            new_item_data_2 = new_item_data[10].split(",");
                            special_extra = " It has stabilized and turned into: **" + new_item_data[0] + "**!" + "\nIt also spat out these items:```";
                            if(amountNum > 1){special_extra = " The vortexes have stabilized and spat out these items:```";}
                        }
                        
                        // Get loot data
                        var vortex_loot_subgroups = vortex_loot_groups[new_item_data_2[1]].split("|");
                        var drop_counts = vortex_loot_subgroups[0].split(",");
                        var common_drops =vortex_loot_subgroups[1].split(",");
                        var rare_drops = vortex_loot_subgroups[2].split(",");
                        var veryrare_drops = vortex_loot_subgroups[3].split(",");
                        var veryrare_chance = parseInt(vortex_loot_subgroups[5]);
                        var rare_chance = parseInt(vortex_loot_subgroups[4]) + veryrare_chance;
                        
                        // Determine results
                        var roll_count = lib.rand(drop_counts[0], drop_counts[1]);
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
                            drops.push(drop_pool[drop_roll]);
                        }
                        
                        // Reset data for next loop
                        new_item_data = items_array[result_key].split("|");
                        new_item_data_2 = new_item_data[10].split(",");
                    }
                    
                    // Add items to inventory or materials inventory
                    var materials = lib.readFile(dir + "/materials.txt");
                    if(materials !== "" && materials !== undefined && materials !== null && materials !== "0"){
                        if(materials.includes(",")){
                            materials_array = materials.split(",");
                        }else{
                            materials_array = [materials];
                        }
                    }else{
                        materials_array = [];
                    }
                    for(q = 0; q < drops.length; q++){
                        var drop_info = items_array[drops[q]].split("|");
                        // If the item is a material, add it to the materials inventory instead of the regular one
                        if(drop_info[10].includes("Material")){
                            materials_array[materials_array.length] = drops[q];
                        }else{
                            inventory_array[inventory_array.length] = drops[q];
                        }
                    }
                    lib.saveFile(dir + "/materials.txt", materials_array.join(","));
                    
                    // Count items and prepare the output
                    // First count the duplicates
                    var drop_counts = new adc(drops).count();
                    // Function for removing duplicate array values
                    function onlyUnique(value, index, self) {
                        return self.indexOf(value) === index;
                    }
                    var uniq_array = drops.filter(onlyUnique);
                    
                    drops = uniq_array;
                    var vortex_results = "";
                    var last_drop = "";
                    for(u = 0; u < drops.length; u++){
                        var drop = drops[u];
                        var drop_count = drop_counts[drop];
                        var drop_data = items_array[drop].split("|");
                        // Add an icon to materials
                        var icon = " ";
                        if(drop_data[10].includes("Material")){icon = "(\uD83D\uDEE0)";}
                        vortex_results = vortex_results + "\n[" + drop_data[0] + " x " + drop_count + "] " + icon;
                        last_drop = drop_data[0];
                    }
                    
                    // Output
                    special_extra = special_extra + vortex_results + "```";
                    no_buff = true;
                    vortex_flag = true;
                }
                
                // Disallow numbers unless vortexes, buff items, tokens or chargers are being used
                if(amountNum > 1 && !vortex_flag && !charge_flag && !token_flag && no_buff){
                    message.reply({ content: "\u274C You can't use multiple copies of this item at once!", allowedMentions: { repliedUser: false }});
                    return;
                }
				
				// If the item is a Mindwipe Tonic then reset the user's stats and don't apply a regular buff below
				if(new_item_data_2[0] == "Mindwipe"){
                    // Determine the amount of stat points invested into each stat by removing equipment points and any buff bonuses from the overall values
                    // Get equipment data
                    var equipment = lib.readFile(dir + "/equipment.txt").split(",");
                    var e1_stats = items_array[equipment[0]].split("|");
                    var e2_stats = items_array[equipment[1]].split("|");
                    var e3_stats = items_array[equipment[2]].split("|");
					var equipmentMods = lib.readFile(dir + "/equip_modifiers.txt").split("\n");
					var e1_mods = equipmentMods[0].split("|");
					var e2_mods = equipmentMods[1].split("|");
					var e3_mods = equipmentMods[2].split("|");
                    
                    // Add up all of the relevant equipment stats as well as the buff stats and calculate how many stat points will be refunded to the user
                    var natural_stats = ["Filler", 0, 0, 0, 0, 0, 0];
                    var refunding = 0;
                    for(var u = 1; u < 7; u++){
                        natural_stats[u] = parseInt(e1_stats[u]) + parseInt(e2_stats[u]) + parseInt(e3_stats[u]) + parseInt(e1_mods[u]) + parseInt(e2_mods[u]) + parseInt(e3_mods[u]) + parseInt(buff_stats[u]);
                        refunding = refunding + (parseInt(stats[u]) - natural_stats[u]);
                        stats[u] = natural_stats[u];
                    }
                    
                    // Save the user's updated stats
                    stats[13] = parseInt(stats[13]) + refunding;
                    lib.saveFile(dir + "/stats.txt", stats.join("|"));
                    
                    // Extra output
                    var refund_s = "s have";
                    if(refunding == 1){
                        refund_s = " has";
                    }
                    var special_extra = "\nYour **" + refunding + "** previously allocated stat point" + refund_s + " been reset!";
                    
                    // Set flag for later
                    no_buff = true;
                }
				
				// If the item is a Reality Shifter then reroll the encounter but don't apply a regular buff further down
				if(new_item_data_2[0] == "Shifter"){
				    // Check if the user is in an encounter. If they aren't, stop the command
				    var current_enc = lib.readFile(dir + "/current_encounter.txt");
				    if(current_enc === "" || current_enc === undefined){
				        message.reply({ content: "@ __**" + username + "**__ \u274C There is no encounter to reroll! Use `" + prefix + "encounter` first!", allowedMentions: { repliedUser: false }});
				        return;
				    }
				    
				    // Get current area path
                    var area = "_" + lib.readFile(dir + "/area.txt");
                    if(area == "_"){area = "_0";}
                    
                    // Split current encounter keys apart
                    var enc_keys = current_enc.split(",");
                    
				    // Fetch monsters and monster group
                    var monsters_raw = lib.readFile("data/monsters/monsters" + area + ".txt");
                    var monster_groups = monsters_raw.split("#################################################################################\n");
                    // Determine new monster (do it until it is different)
                    var monsters = monster_groups[enc_keys[0]].split(";\n");
                    var monster_key = parseInt(enc_keys[1]);
                    while(monster_key == enc_keys[1]){
                        monster_key = lib.rand(0, monsters.length - 2);
                    }
                    enc_keys[1] = monster_key;
                    var color_modifiers = ["\n", "fix\n", "hy\n", "dust\n{ ", "1c\n~ ", "1c\n~ "];
                    var embed_colors = ["#b0b0b0", "#0099ff", "#2AA189", "#b80909", "#e3b712", "#e39f0e"];
                    var embed_color = embed_colors[enc_keys[0]];
                    var color_mod = color_modifiers[enc_keys[0]];
                    var rarity_names = ["Rank D", "Rank C", "Rank B", "Rank A", "Rank S", "Rank SS"];
                    var rarity = rarity_names[enc_keys[0]];
                    
                    // If the user has an active lure buff then give a chance to reroll into a monster of the matching type
                    if(current_buff !== "" && buff_stats[0].includes("Lure")){
                        // Make an array of all monsters which the encounter could be rerolled into
                        var target_type = buff_stats[0].slice(0, -5); // Get the type from the item buff name
                        var id_list = [];
                        for(i = 0; i < monsters.length - 1; i++){
                            var monster_data = monsters[i].split("|");
                            if(monster_data[3].includes(target_type)){
                                id_list[id_list.length] = i;
                            }
                        }
                        // If at least one monster was found, attempt to reroll
                        if(id_list.length >= 1){
                            var reroll_chance = 50 + 10 * id_list.length;
                            if(reroll_chance > 90){reroll_chance = 90;}
                            if(lib.rand(1,100) <= reroll_chance){
                                var lure_rand = lib.rand(0, id_list.length - 1);
                                monster_key = id_list[lure_rand];
                            }
                        }
                    }
                    
                    // Get monster info for output
                    var monster_info = monsters[monster_key].split("|");
                    // Change monster key to accomodate for the area
                    enc_keys[1] = monster_info[7];
                    // Get new info from the main file
                    var monster_groups_all = lib.readFile("data/monsters/monsters.txt").split("#################################################################################\n");
                    var monsters_all = monster_groups_all[enc_keys[0]].split(";\n");
                    monster_info = monsters_all[enc_keys[1]].split("|");
                    var monster_name = monster_info[0];

                    // Shiny check
                    var shiny_extra = "";
                    if(enc_keys[2] == "1"){
                        shiny_extra = "\u2728";
                        rarity = rarity + "++";
                        color_mod = "ruby\n";
                        monster_name = "Shiny " + monster_name;
                        embed_color = "#8f1ee6";
                        
                        var shinies = lib.readFile("data/monsters/monsters_shiny.txt");
            			var shiny_groups = shinies.split("#################################################################################\n");
            			var shinies_array = shiny_groups[enc_keys[0]].split(";\n");
            			monster_info = shinies_array[enc_keys[1]].split("|");
                    }
                    
                    // Minor grammatical check
                    var n_extra = "";
                    var first_letter = monster_name.substring(0, 1);
                    if(first_letter == "A" || first_letter == "E" || first_letter == "I" || first_letter == "O" || first_letter == "U"){
                        n_extra = "n";
                    }
                    
                    // Create final monster key group and save encounter
                    var monster = enc_keys.join(",");
                    lib.saveFile(dir + "/current_encounter.txt", monster);
                    
                    // Check if the user has the monster in their previous captures
                    var captures = lib.readFile(dir + "/all_captures.txt");
                    var capped = "";
                    if(captures.includes(monster)){
                        capped = "  ( \uD83D\uDCBC )";
                    }
				    
				    // Set flag for later
                    no_buff = true;
				}
				
				// If the item is an ability changer then reroll the ability but don't apply a regular buff further down
                if(new_item_data_2[0] == "Ability"){
                    // Get current ability
                    var abilityData = lib.readFile(dir + "/ability.txt").split("|");
                    var oldEffect = abilityData[0];
                    
                    // Pick a new random ability
                    var abilities = lib.readFile("data/abilities.txt").split("######################################")[0].split(";\n");
                    while(abilityData[0] === oldEffect){
                        abilityData[0] = lib.rand(1, abilities.length - 1).toString();
                    }
                    
                    // Update cooldown (evaluate if the old or new abilities apply for each type)
                    var abilityList = lib.readFile("data/ability_conditions.txt").split("\n");
                    var abilityVariants = abilityList[parseInt(abilityData[0])].split(";;");
                    if(parseInt(abilityData[1]) < 3){var abilityVariant = abilityVariants[parseInt(abilityData[1])].split("|");}
                    else{var abilityVariant = abilityVariants[0].split("|");}
                    var abilityCondition = parseInt(abilityVariant[parseInt(abilityData[2])]);
                    // Save to files
                    var d = new Date();
                    lib.saveFile(dir + "/ability_timestamp.txt", Math.floor(d.getTime() / 60000));
                    lib.saveFile(dir + "/ability.txt", abilityData.join("|"));
                    lib.saveFile(dir + "/ability_cd.txt", abilityCondition);
                    
                    // Set flag for later and set output
                    no_buff = true;
                    var special_extra = "\nYour ability has been rerolled into **[" + abilities[abilityData[0]] + "]**!";
                }
				
				// Replace question mark buff data with random numbers
                for(i = 0; i < 7; i++){
                    if(new_item_data[i] == "?"){
                        new_item_data[i] = lib.rand(-8, 15);
                    }
                }
                
                // Increase use duration if multiple buff items were used at the same time
                if(amountNum > 1 && new_item_data_2[0] == "Item"){
                    new_item_data_2[1] = parseInt(new_item_data_2[1]) * amountNum;
                    new_item_data[10] = "Item," + new_item_data_2[1];
                }
                
				// Reduce use duration by one if there is an active encounter at the time of using this command
                var current_enc = lib.readFile(dir + "/current_encounter.txt");
                if(new_item_data_2[0] == "Item" && current_enc !== ""){
                    new_item_data_2[1] = parseInt(new_item_data_2[1]) - 1;
                    new_item_data[10] = "Item," + new_item_data_2[1];
                }
				
				// Loop through this part for multiple buff items / vortexes / chargers / tokens
				keepCount = 0;
				for(r = 0; r < amountNum; r++){
    				// Apply alchemist abilities if possible
                    var keep_item = false;
                    var alch_extra = "";
                    if(stats[0] == "Alchemist"){
                        var alch_chance = 8;
                        var alch_chance_2 = 4;
                        // Apply level 50 ability buff
                        if(parseInt(stats[10]) >= 50){
                            var alch_chance = 16;
                            var alch_chance_2 = 8;
                        }
                        
                        // Apply basic ability
                        var alch_rand = lib.rand(1, 100);
                        if(new_item_data_2[0] == "Item" && !no_buff && alch_rand < alch_chance){
                            new_item_data_2[1] = parseInt(new_item_data_2[1]) + 1;
                            new_item_data[10] = "Item," + new_item_data_2[1];
                            alch_extra = "\n**[Basic Alchemy]** has activated!";
                        }
                        
                        // Apply level 30 ability
                        if(parseInt(stats[10]) >= 30){
                            var alch_rand_2 = lib.rand(1, 100);
                            if(alch_rand_2 < alch_chance_2){
                                keep_item = true;
                                keepCount++;
                            }
                        }
                    }
                    
                    // Remove the item from the inventory
                    if(!keep_item && !keep_item_2){
                        
                        if(amountNum > 1){
                            // Check the key position in the inventory again on every loop!
                            key = inventory_array.indexOf(result_key);
                            if(key == -1){
                                // Weird error
                                message.reply({ content: "\u274C Error! Expected item key but could not find it on loop " + (r + 1), allowedMentions: { repliedUser: false }});
                                return;
                            }
                        }
                        inventory_array.splice(key, 1);
                    
                    }
				}
				lib.saveFile(dir + "/inventory.txt", inventory_array.join(","));
				
				// Finish advanced alchemy string
				if(keepCount == 1){
				    alch_extra = alch_extra + "\n**[Advanced Alchemy]** has activated once!";
				}else if(keepCount > 0){
				    alch_extra = alch_extra + "\n**[Advanced Alchemy]** has activated " + keepCount + " times!";
				}
				if(vortex_flag || charge_flag){alch_extra = alch_extra.substring(1, alch_extra.length);}
                
                if(!no_buff){
                    // If it is the same buff as before, simply increase the duration
                    if(buff_stats[0] == new_item_data[0]){
                        // Remove the duration penalty for active encounters again
                        if(new_item_data_2[0] == "Item" && current_enc !== ""){
                            new_item_data_2[1] = parseInt(new_item_data_2[1]) + 1;
                        }
                        
                        var buff_stats_sub = buff_stats[10].split(",");
                        new_item_data_2[1] = parseInt(new_item_data_2[1]) + parseInt(buff_stats_sub[1]);
                        new_item_data[10] = "Item," + new_item_data_2[1];
                    }else{
                        // Update the user's stats
                        // Remove old item's values from the user's stats and add the new item's stats
                        for(y = 1; y < 7; y++){
                            var base = parseInt(stats[y]);
                            var minus = parseInt(buff_stats[y]);
                            var plus = parseInt(new_item_data[y]);
                            stats[y] = base - minus + plus;
                        }       
                        lib.saveFile(dir + "/stats.txt", stats.join("|"));
                    }
                        
                    // Save item's data to the buff file
                    lib.saveFile(dir + "/current_buff.txt", new_item_data.join("|"));
                }
                
                // For Vortexes, Mindwipes, Tokens, Cubes and Fragments, give a special output
                if(new_item_data_2[0] == "Ability" || new_item_data_2[0] == "Vortex" || new_item_data_2[0] == "Realm" || new_item_data_2[0] == "Stasis" || new_item_data_2[0] == "Mindwipe" || new_item_data_2[0] == "Token" || new_item_data_2[0] == "Memory"){
                    // Get item name again
                    new_item_data = items_array[result_key].split("|");
                    if(amountNum > 1){new_item_data[0] += " x " + amountNum;}
                    // Give a special tip for tokens
                    if(new_item_data_2[0] == "Token"){
                        var pointNum = parseInt(new_item_data_2[1]) * amountNum;
                        var pointGrammar = "";
                        if(pointNum > 1){pointGrammar = "s";}
                        message.reply({ content: "You used the **" + new_item_data[0] + "**, gaining **" + pointNum + " Token Point" + pointGrammar + "**!\nThe `monster` command will grant you one special monster per token point until they have all been used up! The points are shown in your inventory as long as you have any" + special_extra + alch_extra, allowedMentions: { repliedUser: false }});
                    }else{
                        message.reply({ content: "You used the **" + new_item_data[0] + "**!" + special_extra + alch_extra, allowedMentions: { repliedUser: false }});
                    }
                // For Reality Shifter, send a unique output that looks like an encounter
                }else if(new_item_data_2[0] == "Shifter"){
                    // Build buttons
            		var button1 = new ButtonBuilder()
            			.setCustomId("any|capture")
            			.setLabel('Capture')
            			.setStyle(1)
            		var button2 = new ButtonBuilder()
            			.setCustomId("any|fight")
            			.setLabel('Fight')
            			.setStyle(1)
            		var button3 = new ButtonBuilder()
            		    .setCustomId("any|check " + enc_keys.join(","))
            			.setLabel('Check')
            			.setStyle(2)
            		var button4 = new ButtonBuilder()
            		    .setCustomId(user.id + "|use reality shifter")
            			.setLabel('Reroll again')
            			.setStyle(4)
            		var row = new ActionRowBuilder().addComponents([button1, button2, button3, button4]);
                    
                    // Output embed
                    var outputEmbed = new Discord.EmbedBuilder()
                    	.setColor(embed_color)
                    	.setTitle("@ __**" + username + "**__")
                    	.setThumbnail("https://cdn.discordapp.com/attachments/731848120539021323/" + monster_info[5])
                    	.setDescription("```" + color_mod + "A" + n_extra + " " + shiny_extra + monster_name + shiny_extra + " (" + rarity + ") replaced your previous encounter!" + capped + "```")
                    	.setFooter({ text: "You used the Reality Shifter!" + alch_extra });
						
                    message.reply({ embeds: [outputEmbed], components: [row], allowedMentions: { repliedUser: false }});
                }else{
                    if(amountNum > 1){new_item_data[0] += " x " + amountNum;}
                    message.reply({ content: "@ __**" + username + "**__, you used the **" + new_item_data[0] + "**!" + alch_extra, allowedMentions: { repliedUser: false }});
                }
				
			}else{
			    message.reply({ content: "@ __**" + username + "**__ \u274C The item you searched for could not be found!", allowedMentions: { repliedUser: false }});
			}
		
        }else{
            message.reply({ content: "\u274C You have to include a useable item from your inventory!", allowedMentions: { repliedUser: false }});
        }
				
	},
};