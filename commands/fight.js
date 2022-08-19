var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'fight',
	usages: [''],
	descriptions: ['Fights the currently encountered monster'],
    shortDescription: 'Fight an encountered monster',
	cooldown: 2.5,
	aliases: ['fig'],
	addendum: 'Has an increased cooldown of 2.5 seconds',
    category: 'main',
	
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
        
        // If the user isn't registered yet, stop the command
        if(!fs.existsSync(dir)){
            message.reply({ content: "@ __**" + username + "**__ \u274C Use `" + prefix + "encounter` first to create an account!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // Fetch current encounter
		var monster_keys = lib.readFile(dir + "/current_encounter.txt");
		// Only run if there is one
		if(monster_keys === ""){
			message.reply({ content: "@ __**" + username + "**__ \u274C There is no monster to fight!", allowedMentions: { repliedUser: false }});
			return;
		}
		
        // Get monster stats and name with modifier
		var monster_groups = lib.readFile("data/monsters/monsters.txt").split("#################################################################################\n");
		var monster_keys_array = monster_keys.split(",");
		var monsters = monster_groups[monster_keys_array[0]].split(";\n");
		var monster_data_raw = monsters[monster_keys_array[1]];
		var monster_data = monster_data_raw.split("|");
		var shiny = "";
		if(monster_keys_array[2] == "1"){
			shiny = "Shiny ";
		}
		var monster_title = shiny + monster_data[0];
		
		//Check if the user has a type bonus and add it to the calculations if applicable
        var user_stats = lib.readFile(dir + "/stats.txt").split("|");
        var user_attack = parseInt(user_stats[1]);
        var user_speed = parseInt(user_stats[2]);
        if(user_stats[7] != "0"){
            if(monster_data[3].includes(",")){
                var monster_types = monster_data[3].split(",");
            }else{
                var monster_types = [monster_data[3]];
            }
            for(y = 0; y < monster_types.length - 1; y++){
                if(monster_types[y] == user_stats[8]){
                    var type_bonus = parseInt(user_stats[7]) / 2;
                    user_attack = user_attack + type_bonus;
                    user_speed = user_speed + type_bonus;
                }
            }
        }
        
        // Check for ability activation
        var abilityData = lib.readFile(dir + "/ability.txt").split("|");
        var abilityID = parseInt(abilityData[0]);
        var abilityModifierTime = parseInt(abilityData[1]);
        var abilityModifierEffect = parseInt(abilityData[1]);
        var abilityConditionType = parseInt(abilityData[2]);
        if(abilityModifierTime > 2){abilityModifierTime = 0;}
        else{abilityModifierEffect = 0;}
        var abilityCondition = parseInt(lib.readFile(dir + "/ability_cd.txt"));
        var abilityOutput = "";
        var abilityFlag = false;
        // Prevent buff ability when there is an active buff
        var current_buff = lib.readFile(dir + "/current_buff.txt");
        if((abilityID == 7 || abilityID == 8) && current_buff !== ""){
            // Do nothing
        }else
        if(abilityID > 3 && abilityID < 12){
            // Check for cooldown
            switch(abilityConditionType){
                case 0:
                    // Chance-based
                    var abilityRand = lib.rand(1, 100);
                    if(abilityRand <= abilityCondition){
                        abilityFlag = true;
                    }
                    break;
                case 1:
                    // Time-based
                    var d = new Date();
                    var current_min = Math.floor(d.getTime() / 60000);
                    var last_min = parseInt(lib.readFile(dir + "/ability_timestamp.txt"));
                    if(last_min + abilityCondition < current_min || last_min - current_min > abilityCondition){
                        abilityFlag = true;
                        lib.saveFile(dir + "/ability_timestamp.txt", current_min);
                    }
                    break;
                default:
                    // Encounter-based
                    if(abilityCondition === 0){
                        abilityFlag = true;
                        var abilityList = lib.readFile("data/ability_conditions.txt").split("\n");
                        var abilityVariants = abilityList[abilityID].split(";;");
                        var abilityVariant = abilityVariants[abilityModifierTime].split("|");
                        abilityCondition = parseInt(abilityVariant[abilityConditionType]);
                        lib.saveFile(dir + "/ability_cd.txt", abilityCondition);
                    }
                
            }
        }
        // Activate ability
        var figLimitBonus = 0;
        var figBonus = 0;
        var keepEncounter = false;
        var buffFlag = false;
        var newBuff = [];
        if(abilityFlag){
            var abilityValuesList = lib.readFile("data/ability_values.txt").split("\n");
            var abilityValues = abilityValuesList[abilityID].split("|");
            if(abilityModifierEffect > 2){abilityModifierEffect -= 2;}
            var abilityValue = parseInt(abilityValues[abilityModifierEffect]);
            switch(abilityID){
                case 4:
                    // Curse - Lower attack and speed - Value is negative bonus
                    figBonus = abilityValue / 2;
                    abilityOutput = "\n**Your equipment ability has activated, reducing your attack and speed for this encounter!**";
                    break;
                case 5:
                    // Scrapper - Grant some Scrap - Value is amount
                    abilityOutput = "\n**Your equipment ability has activated, granting you " + abilityValue + " Scrap!**";
                    var scrap = parseInt(lib.readFile(dir + "/scrap.txt"));
                    scrap += abilityValue;
                    lib.saveFile(dir + "/scrap.txt", scrap);
                    break;
                case 6:
                    // Charger - Grant some radar charges - Value is amount
                    abilityOutput = "\n**Your equipment ability has activated, granting you " + abilityValue + " radar charges!**";
                    var charge_amount = abilityValue;
                    // Determine new total charge amount
                    var old_charge_amount = lib.readFile(dir + "/charges.txt");
                    if(old_charge_amount === "" || old_charge_amount === undefined){old_charge_amount = 0;}
                    charge_amount = charge_amount + parseInt(old_charge_amount);
                    
                    // Give the user their charges (also in their active radar buff if necessary)
                    lib.saveFile(dir + "/charges.txt", charge_amount);
                    var current_buff = lib.readFile(dir + "/current_buff.txt");
                    if(current_buff !== undefined && current_buff !== ""){
                        var buff_data = current_buff.split("|");
                        if(buff_data[0] == "Monster Radar"){
                            buff_data[10] = "Special," + charge_amount;
                            lib.saveFile(dir + "/current_buff.txt", buff_data.join("|"));
                        }
                    }
                    break;
                case 7:
                    // Lure - Activate a random lure buff - Value is duration
                    var lureTypes = ["Slime", "Beast", "Demon", "Undead", "Arthropod", "Dark", "Water", "Plant", "Reptile", "Armored", "Flying", "Fire", "Fish", "Holy", "Alien", "Intangible", "Frost", "Lightning", "Legendary", "Dragon"];
                    var lureType = lureTypes[lib.rand(0, lureTypes.length - 1)];
                    newBuff = [lureType + " Lure", 0, 0, 0, 0, 0, 0, 0, 0, "Special", "Item," + abilityValue];
                    abilityOutput = "\n**Your equipment ability has activated, granting you a " + lureType + " Lure buff!**";
                    buffFlag = true;
                    break;
                case 8:
                    // Gambler - Grant a Dark Matter buff (random stats) - Value is negative limit
                    newBuff = ["Gambler", "?", "?", "?", "?", "?", "?", 0, 0, "Special", "Item,8"];
                    abilityOutput = "\n**Your equipment ability has activated, granting you a buff with random stat changes!**";
                    // Replace question mark buff data with random numbers
                    for(i = 1; i < 7; i++){
                        newBuff[i] = lib.rand(abilityValue, 15);
                    }
                    buffFlag = true;
                    break;
                case 9:
                    // Persistence - Keep encounter after losing - Value is always 1
                    keepEncounter = true;
                    abilityOutput = "\n**Your equipment ability has activated! But it seems to have been of no use...**";
                    break;
                case 10:
                    // Strength - Higher winning cap - Value is bonus
                    figLimitBonus = abilityValue;
                    abilityOutput = "\n**Your equipment ability has activated, increasing this encounter's maximum winning chance!**";
                    break;
                default:
                    // Berserker - Higher attack/speed - Value is bonus
                    figBonus = abilityValue / 2;
                    abilityOutput = "\n**Your equipment ability has activated, increasing your attack and speed for this encounter!**";
            }
        }
        
        // Finish the ability buff
		if(buffFlag){
		    // Save data to the buff file
            lib.saveFile(dir + "/current_buff.txt", newBuff.join("|"));
            
            // Update the user's stats
            // Remove old item's values from the user's stats and add the new item's stats
            for(y = 1; y < 7; y++){
                var base = parseInt(user_stats[y]);
                var plus = parseInt(newBuff[y]);
                user_stats[y] = base + plus;
            }       
            lib.saveFile(dir + "/stats.txt", user_stats.join("|"));
		}
        
        // Determine fight result by comparing user stats to monster stats
        user_attack += figBonus;
        user_speed += figBonus;
        var win = false;
        var bonus = 0;
        var monster_attack = parseInt(monster_data[1]);
        var monster_speed = parseInt(monster_data[2]);
        var stat_threshold = 1.5;
        var balance_bonus = 6;
        if(monster_attack > monster_speed * stat_threshold){
            // The monster is a power type so speed characters get a penalty and power characters get a bonus
            if(user_attack > user_speed * stat_threshold){
                bonus = balance_bonus;
            }else if(user_speed > user_attack * stat_threshold){
                bonus = balance_bonus * -1;
            }
        }else if(monster_speed > monster_attack * stat_threshold){
            // The monster is a speed type so power characters get a penalty and speed characters get a bonus
            if(user_speed > user_attack * stat_threshold){
                bonus = balance_bonus;
            }else if(user_attack > user_speed * stat_threshold){
                bonus = balance_bonus * -1;
            }
        }
        var attack_dif = user_attack - monster_attack;
        var speed_dif = user_speed - monster_speed;
        var stat_dif = bonus + Math.floor(speed_dif + attack_dif);      // If the difference is negative, it's the monster's advantage
        // Roll the die
        var fight_rand = lib.rand(1, 100);
        var win_chance = 50 + stat_dif;
        // Check user class and level, then change cap accordingly and apply it
        var win_cap = 90 + figLimitBonus;
        if((user_stats[0] == "Warrior" || user_stats[0] == "Thief") && parseInt(user_stats[10]) >= 50){
            win_cap += 5;
        }
        if(win_chance > win_cap){
            win_chance = win_cap;
        }
        if(win_chance < -70){win_chance = 3;}
        else if(win_chance < 4){win_chance = 4;}
        if(fight_rand <= win_chance){
            // The user wins
            win = true;
        }
        
        // If the user won, process drop pools and such
        var buttons = [];
        var output = "";
        if(win){
            // Get the drop IDs and their probabilities
            if(monster_keys_array[2] == "1"){
                var drop_pool = ["106", "100"];
            }else{
                var drop_pool_groups = lib.readFile("data/drops.txt").split("#######################\n");
                var drop_pools = drop_pool_groups[monster_keys_array[0]].split(";\n");
                var drop_pool = drop_pools[monster_keys_array[1]].split("|");
            }
            // If there is only one possible drop, create the arrays differently
            if (drop_pool[0].includes(",")) {
                var drops = drop_pool[0].split(",");
                var chances = drop_pool[1].split(",");
            }else{
                var drops = [drop_pool[0]];
                var chances = [drop_pool[1]];
            }
            var drop_extra = "";
            
            // If the user had a high win chance then nerf drop rates
            if(win_chance > 70){
                for(i = 0; i < chances.length; i++){
                    chances[i] = Math.ceil(parseInt(chances[i]) * (0.5 * (80 / win_chance)));
                }
            }
            
            // If the user is in a realm, check for vortex drops before doing the regular rolls. Also reduce their HP and change the output
            var area = lib.readFile(dir + "/area.txt");
            var item_key = "";
            var dropped = false;
            var realm_extra = "";
            var forced_death_extra = "";
            if(area > 13){
                // Obtain vortex data
                var vortex_pools = lib.readFile("data/realmdrops/drops_" + area + ".txt").split(";\n");
                var vortex_pool = vortex_pools[monster_keys_array[0]].split("|");
                var vortex_id = vortex_pool[0];
                var vortex_chance = vortex_pool[1];
                
                // Modify chance
                if(win_chance > 70){
                    vortex_chance = Math.ceil(parseInt(vortex_chance) * (0.5 * (80 / win_chance)));
                }
                
                // Determine result
                var drop_rand = lib.rand(1, 100);
                if(drop_rand <= vortex_chance){
                    dropped = true;
                    item_key = vortex_id;
                }
                
                // Reduce HP
                var hp = parseInt(lib.readFile(dir + "/hp.txt"));
                hp = hp - 5;
                lib.saveFile(dir + "/hp.txt", hp);
                
                // Extra output
                realm_extra = "You have **" + hp + "** HP remaining!\n";
                
                // If the user's HP is below 1, throw them out of the realm
                if(hp < 1){
                    lib.saveFile(dir + "/area.txt", "0");
                    forced_death_extra = "You ran out of HP and have been returned to the Hub!\n";
                    realm_extra = "";
                }
                
            }
            
            // Set variables from user stats that affect the drop outcome
            var luck = Math.round(parseInt(user_stats[5]) / 3);
            var g_luck = Math.round(parseInt(user_stats[6]) / 3);
            var g_count = 0;
            
            // Determine regular drop if there was no vortex drop already
            if(!dropped){
                // Determine the key of the item that is dropped (or nothing if nothing is dropped)
                var drop_rand = lib.rand(1, 100);
                var drop_count = drops.length;
                var add_chance = 0;
                chances[drop_count - 1] = parseInt(chances[drop_count - 1]) + luck;
                
                // Make sure the greater item luck doesn't make the rarest drop more likely than all other drops combined. Cap it to prevent this
                var one_half = 0;
                // Determine the cap
                if(g_luck < 0){
                    for(y = 0; y <= (drop_count / 2) - 1; y++){
                        one_half = one_half + parseInt(chances[y]);
                    }
                }else{
                    for(y = drop_count - 1; y >= (drop_count / 2); y--){
                        one_half = one_half + parseInt(chances[y]);
                    }
                }
                // Actual capping
                if(g_luck < (0 - one_half)){g_luck = 0 - one_half;}else
                if(g_luck > one_half){g_luck = one_half;}
                
                // Main loop for determining the result
                for(i = 0; i < drop_count && !dropped; i++){
                    
                    // Count how often the greater item luck is added to one half of the drops and subract it just as often for the rest so the overall drop chances aren't changed
                    if(i <= (drop_count / 2) - 1){
                        chances[i] = parseInt(chances[i]) + g_luck;
                        g_count++;
                    }else if(drop_count - i <= g_count){
                        chances[i] = parseInt(chances[i]) - g_luck;
                    }
                    
                    var real_chance = parseInt(chances[i]) + add_chance;
                    if(drop_rand <= real_chance){
                        // The item dropped
                        item_key = drops[i];
                        dropped = true;
                    }
                    add_chance = add_chance + parseInt(chances[i]);
                    
                }
                
            }
            
            // Define buttons for equip drops
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
            
            // If there was a drop, add it to the correct inventory or start an equip prompt
            var material_extra = "";
            //dropped = true; item_key = 10;    // For testing a drop
            if(dropped){
                // Get item data
                var items = lib.readFile("data/items.txt").split(";\n");
                var item_data = items[item_key].split("|");
                drop_extra = "\nThe monster dropped: **" + item_data[0] + "**";
                
                var old_equipment = "," + lib.readFile(dir + "/equipment.txt") + ",";
                
                // If the drop is equippable and new, start an equip prompt. Otherwise add it to the inventory / material inventory
                if(item_data[10] == "Weapon" || item_data[10] == "Defense" || item_data[10] == "Tool"){
                    var item_type = item_data[10];
                    if(item_type == "Defense"){item_type = "Defensive equipment";}
                    lib.saveFile(dir + "/new_equip.txt", item_key);
    				buttons = [button1, button2, button3];
					
					var equipModifier = lib.generateModifier(user_stats[6]);
					lib.saveFile(dir + "/new_modifier.txt", equipModifier);
					drop_extra = "\nThe monster dropped: **" + equipModifier.split("|")[0] + item_data[0] + "**";
                    
                }else{
                    // It is a consumable or material. Save it
                    if(item_data[10] == "Material"){
                        material_extra = " ( \uD83D\uDEE0 )";
                        var inv_path = dir + "/materials.txt";
                    }else{
                        var inv_path = dir + "/inventory.txt";
                    }
                    var old_inventory = lib.readFile(inv_path);
                    if(old_inventory !== "" && old_inventory !== undefined && old_inventory !== null && old_inventory !== "0"){
                        lib.saveFile(inv_path, old_inventory + "," + item_key);
                    }else{
                        lib.saveFile(inv_path, item_key);
                    }
                }
            }
            
            // Get EXP data
            var levels = lib.readFile("data/level_reqs.txt").split(",");
            
            // Add EXP
            var exp = Math.ceil((monster_attack + monster_speed) / 2);
            user_stats[11] = parseInt(user_stats[11]) + exp;
            var levelup_extra = "";
            // Check for levelups
            var levelCheckResults = lib.levelCheck(levels, user_stats, levelup_extra, prefix, dir);
            levelup_extra = levelCheckResults.levelup_extra;
            user_stats = levelCheckResults.stats;
            trophy_extra = levelCheckResults.trophy_extra;
            
            // Determine Gold
            var speed_gold_bonus = ((user_speed / user_attack) - 1) * 2;
            var gold = Math.ceil(((monster_attack + monster_speed) / 8) + speed_gold_bonus);
            if (gold < 0){gold = 1;}
            
            // If the user is a merchant, give more Gold
            if(user_stats[10] == "Merchant"){
                gold = Math.round(gold * 1.50);
            }

            // Update user stats
            user_stats[12] = parseInt(user_stats[12]) + gold;
            lib.saveFile(dir + "/stats.txt", user_stats.join("|"));
            
            // Give a trophy if necessary
            if(trophy_extra !== ""){
                var trophy_data = trophy_extra.split("|");
                var trophy_ranks = {"10": "D", "20": "C", "30": "B", "40": "A", "50": "S", "60": "SS", "70": "SS", "80": "SS", "90": "SS", "100": "SS"};
                        var trophy_weights = {"10": "44", "20": "43", "30": "42", "40": "41", "50": "40", "60": "39", "70": "38", "80": "37", "90": "36", "100": "35"};
                var new_trophy = trophy_weights[trophy_data[1]] + "|" + "Level" + "|" + trophy_ranks[trophy_data[1]] + "|**EXP Collector** - Reached level " + trophy_data[1];
                
                var trophies = lib.readFile(dir + "/trophies.txt");
                if(trophies === "" || trophies === undefined){
	                trophies = new_trophy;
	            }else{
                    trophies = trophies + ";\n" + new_trophy;
	            }
                lib.saveFile(dir + "/trophies.txt", trophies);
                trophy_extra = "\n" + trophy_data[0];
            }
            
            // Winning output
            if(levelup_extra !== ""){levelup_extra = "\n" + levelup_extra;}
            output = "```diff\n+You defeated the " + monster_title + "!" + "```" + realm_extra + forced_death_extra + "You got **" + exp + "** EXP and **" + gold + "** Gold!" + abilityOutput + levelup_extra + drop_extra + material_extra + trophy_extra + "\nYour chance of winning was **" + win_chance + "%**!";
            
        }else{
            // If the user is in a realm, reduce their HP, give a different output and stop the command before the encounter is closed
            var area = lib.readFile(dir + "/area.txt");
            if(area > 13){
                var hp = parseInt(lib.readFile(dir + "/hp.txt"));
                // Calculate damage (minimum of 5)
                var damage = (monster_attack + monster_speed - user_attack - user_speed - bonus) / 2;
                if(damage < 0){damage = 0;}
                hp = Math.round(hp - damage - 5);
                lib.saveFile(dir + "/hp.txt", hp);
                
                // If the user's HP is below 1, throw them out of the realm
                if(hp < 1){
                    lib.saveFile(dir + "/area.txt", "0");
                    message.reply({ content: "@ __**" + username + "**__```diff\n-You lost...```Your HP has been reduced to **0** and you've been returned to the Hub!\nYour chance of winning was **" + win_chance + "%**!", allowedMentions: { repliedUser: false }});
                    return;
                }
                
                // Realm losing message
                message.reply({ content: "@ __**" + username + "**__```diff\n-You lost...```You have **" + hp + "** HP remaining!\nYour chance of winning was **" + win_chance + "%**!", allowedMentions: { repliedUser: false }});
                return;
            }
            
            // Regular losing message
            output = "```diff\n-You lost...```Your chance of winning was **" + win_chance + "%**!";
            
        }
        
        // End encounter
        if(!win){
            if(keepEncounter){
                if(area < 14){abilityOutput = "\n**Your equipment ability has activated, allowing you to try again!**";}
                else{abilityOutput = "\n**Your equipment ability has activated but [Persistence] has no effect on fights inside of a realm...**";}
            }else{
                lib.saveFile(dir + "/current_encounter.txt", "");
            }
            output += abilityOutput;
		}else{
		    lib.saveFile(dir + "/current_encounter.txt", "");
		}
        
        if(buttons.length > 0){
            // Equip prompt output
            var row = new MessageActionRow().addComponents(buttons);
            message.reply({ content: "@ __**" + username + "**__" + output, allowedMentions: { repliedUser: false }, components: [row] });
        }else{
            // Regular output
            message.reply({ content: "@ __**" + username + "**__" + output, allowedMentions: { repliedUser: false }});
        }
        
	},
};