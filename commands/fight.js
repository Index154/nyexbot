var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'fight',
	usages: [''],
	descriptions: ['Fights the currently encountered monster'],
    shortDescription: 'Fight an encountered monster',
    weight: 15,
	cooldown: 3,
	aliases: ['fig'],
	addendum: [
        '- Has an increased cooldown of 2.5 seconds',
        '- Higher Attack and Speed stats will make this action more likely to succeed',
        '- Winning a fight usually grants EXP and Gold. Sometimes you can also get item drops',
        '- Item drop rates are affected by your Drop Luck and Rare Luck stats'
    ],
    category: 'main',
	
	execute(message, user, args, prefix) {
        
        // Set important variables
        var username = user.username;
        var dir = "userdata/" + user.id;
        var shinyNotif = false;
        var saveStats = false;
        
        // Fetch current encounter
		var monster_keys = lib.readFile(dir + "/current_encounter.txt");
		// Only run if there is one
		if(monster_keys === ""){
			message.reply({ content: "@ __**" + username + "**__ \u274C There is no monster to fight!", allowedMentions: { repliedUser: false }});
			return;
		}
        var realmFlag = false;
		
        // Get monster stats and name with modifier
		var monster_groups = lib.readFile("data/monsters/monsters.txt").split("#################################################################################\n");
		var monster_keys_array = monster_keys.split(",");
		var monsters = monster_groups[monster_keys_array[0]].split(";\n");
		var monster_data_raw = monsters[monster_keys_array[1]];
		var monster_data = monster_data_raw.split("|");

        // Prepare shiny notification
        if(monster_keys_array[2] == "1"){
            shinyNotif = true;
            var notificationEmbed = new Discord.EmbedBuilder()
                .setColor('#8f1ee6')
                .setTitle("Shiny confrontation!")
                .setThumbnail("https://artificial-index.com/media/rpg_monsters/shiny_" + monster_data[0].toLowerCase().replace(/ /g, "_") + ".png");
		}

        // Stop the current chain if fighting the target
        var chain = lib.readFile(dir + "/chain.txt").split("|");
        if(chain[0] == monster_keys){
            lib.saveFile(dir + "/chain.txt", "9,9,9|" + 0);
        }
		
		// Get user stats
        var user_stats = lib.readFile(dir + "/stats.txt").split("|");
        var user_attack = parseInt(user_stats[1]);
        var user_speed = parseInt(user_stats[2]);
        
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
                    abilityOutput = "**Ability: Reduced attack and speed for this encounter!**";
                    break;
                case 5:
                    // Scrapper - Grant some Scrap - Value is amount
                    abilityOutput = "**Ability: Obtained " + abilityValue + " Scrap!**";
                    var scrap = parseInt(lib.readFile(dir + "/scrap.txt"));
                    scrap += abilityValue;
                    lib.saveFile(dir + "/scrap.txt", scrap);
                    break;
                case 6:
                    // Charger - Grant some radar charges - Value is amount
                    abilityOutput = "**Ability: Obtained " + abilityValue + " radar charges!**";
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
                    abilityOutput = "**Ability: Obtained a " + lureType + " Lure buff!**";
                    buffFlag = true;
                    break;
                case 8:
                    // Gambler - Grant a Dark Matter buff (random stats) - Value is negative limit
                    newBuff = ["Gambler", "?", "?", "?", "?", "?", "?", 0, 0, "Special", "Item,8"];
                    abilityOutput = "**Ability: Obtained a random buff!**";
                    // Replace question mark buff data with random numbers
                    for(i = 1; i < 7; i++){
                        newBuff[i] = lib.rand(abilityValue, 15);
                    }
                    buffFlag = true;
                    break;
                case 9:
                    // Persistence - Keep encounter after losing - Value is always 1
                    keepEncounter = true;
                    abilityOutput = "**Ability: It was of no use this time...**";
                    break;
                case 10:
                    // Strength - Higher winning cap - Value is bonus
                    figLimitBonus = abilityValue;
                    abilityOutput = "**Ability: Increased this encounter's max winning chance!**";
                    break;
                default:
                    // Berserker - Higher attack/speed - Value is bonus
                    figBonus = abilityValue / 2;
                    abilityOutput = "**Ability: Increased attack and speed for this encounter!**";
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
            saveStats = true;
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
        if(win_chance > 100){win_chance = 100;}
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
                realm_extra = "You have **" + hp + "** HP remaining!";
                
                // If the user's HP is below 1, throw them out of the realm
                if(hp < 1){
                    lib.saveFile(dir + "/area.txt", "0");
                    forced_death_extra = "You ran out of HP and have been returned to the Hub!";
                    realm_extra = "";
                }
                
            }
            
            // Set variables from user stats that affect the drop outcome
            var luck = Math.round(parseInt(user_stats[5]) / 3);
            var g_luck = Math.round(parseInt(user_stats[6]) / 3);
            
            // Try to determine a regular drop if there was no vortex drop already
            if(!dropped){
                var drop_rand = lib.rand(1, 100);
                var drop_count = drops.length;
                chances[drop_count - 1] = parseInt(chances[drop_count - 1]) + luck;

                // Calculate the average drop chance
                var averageChance = 0;
                for(x = 0; x < drop_count; x++){
                    averageChance += parseInt(chances[x]);
                }
                averageChance = averageChance / chances.length;

                // Determine drop chance variation per item by distributing the Rare Luck among them evenly
                var posCount = 0;
                var negCount = 0;
                for(x = 0; x < drop_count; x++){
                    if(chances[x] <= averageChance){
                        posCount++;
                    }else{
                        negCount++;
                    }
                }
                var gPlus = parseInt((g_luck / 2) / posCount);
                var gMinus = parseInt((-1 * (g_luck / 2)) / negCount);
                
                // Main loop for determining the result
                // Items below the average drop chance will have their drop rate increased while items above it will have it reduced by an equivalent amount
                var add_chance = 0;
                for(i = 0; i < drop_count && !dropped; i++){
                    chances[i] = parseInt(chances[i]);
                    if(chances[i] <= averageChance){
                        chances[i] = chances[i] + gPlus;
                    }else if(chances[i] > averageChance){
                        chances[i] = chances[i] + gMinus;
                    }
                    
                    var real_chance = chances[i] + add_chance;
                    if(drop_rand <= real_chance){
                        // The item dropped
                        item_key = drops[i];
                        dropped = true;
                    }
                    add_chance = add_chance + chances[i];
                }
            }

            // Check single-embed mode setting and change button types accordingly
            var mode = "single";
            var buttonType = "embedEdit";
            var userModeSetting = lib.readFile(dir + "/commandmode.txt");
            if(lib.exists(userModeSetting)){ mode = userModeSetting; }
            if(mode != "single"){ buttonType = "normal"; }
            
            // Define buttons for equip drops
            var button1 = new ButtonBuilder()
    			.setCustomId(user.id + "|equip|" + buttonType)
    			.setLabel('Equip')
    			.setStyle(3)
            var button2 = new ButtonBuilder()
    			.setCustomId(user.id + "|compare|" + buttonType)
    			.setLabel('Compare')
    			.setStyle(1)
    		var button3 = new ButtonBuilder()
    			.setCustomId(user.id + "|equip convert|" + buttonType)
    			.setLabel('Convert')
    			.setStyle(4)
            
            // If there was a drop, add it to the correct inventory or start an equip prompt
            var material_extra = "";
            //dropped = true; item_key = 10;    // For testing a drop
            if(dropped){
                // Get item data
                var items = lib.readFile("data/items.txt").split(";\n");
                var item_data = items[item_key].split("|");
                drop_extra = "The monster dropped: **" + item_data[0] + "**";
                
                // If the drop is equippable and new, start an equip prompt. Otherwise add it to the inventory / material inventory
                if(item_data[10] == "Weapon" || item_data[10] == "Defense" || item_data[10] == "Tool"){
                    var item_type = item_data[10];
                    if(item_type == "Defense"){item_type = "Defensive equipment";}
                    lib.saveFile(dir + "/new_equip.txt", item_key);
    				buttons = [button1, button2, button3];
					
					var equipModifier = lib.generateModifier(user_stats[6]);
					lib.saveFile(dir + "/new_modifier.txt", equipModifier);
					drop_extra = "The monster dropped: **" + equipModifier.split("|")[0] + item_data[0] + "**";
                    
                }else{
                    // It is a consumable or material. Save it
                    var buttonInv = "";
                    if(item_data[10] == "Material"){
                        buttonInv = new ButtonBuilder()
                            .setCustomId(user.id + "|mats " + item_data[0])
                            .setLabel('Check drop')
                            .setStyle(1);
                        material_extra = " ( \uD83D\uDEE0 )";
                        var inv_path = dir + "/materials.txt";
                    }else{
                        buttonInv = new ButtonBuilder()
                            .setCustomId(user.id + "|inv " + item_data[0])
                            .setLabel('Check drop')
                            .setStyle(1);
                        var inv_path = dir + "/inventory.txt";
                    }
                    var old_inventory = lib.readFile(inv_path);
                    if(old_inventory !== "" && old_inventory !== undefined && old_inventory !== null && old_inventory !== "0"){
                        lib.saveFile(inv_path, old_inventory + "," + item_key);
                    }else{
                        lib.saveFile(inv_path, item_key);
                    }
                    buttons = [buttonInv];
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
            var speed_gold_bonus = 1 + (0.2 * Math.min(1, ((user_speed - user_attack) * 0.015)));
            var gold = Math.ceil(((monster_attack + monster_speed) / 8) * speed_gold_bonus);
            if (gold < 0){gold = 1;}
            
            // If the user is a merchant, give more Gold
            if(user_stats[10] == "Merchant"){
                gold = Math.round(gold * 1.25);
            }

            // Update user stats
            user_stats[12] = parseInt(user_stats[12]) + gold;
            saveStats = true;
            
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
                trophy_extra = trophy_data[0];
            }

            // Formatting for semi-consistent embed height
            chanceExtra = "**" + exp + "** EXP & **" + gold + "** Gold - **" + win_chance + "%** win chance";
            allExtras = [chanceExtra, realm_extra + forced_death_extra, drop_extra + material_extra, abilityOutput, levelup_extra, trophy_extra];
            var extraCount = 0;
            for(e = 0; e < allExtras.length; e++){
                if(allExtras[e] != ""){
                    extraCount++;
                    if(extraCount > 1){
                        allExtras[e] = "\n" + allExtras[e];
                    }
                }
            }
            if(lib.exists(message.message) && message.customId.includes("embedEdit")){
                var lineCount = 3;
                for(i = lineCount; i > extraCount; i--){
                    var spacer = "\n\u2800";
                    if(extraCount == 0 && i == lineCount){spacer = "\u2800";}
                    allExtras.push(spacer);
                }
            }
            
            // Winning output
            output = "```diff\n+You won!```" + allExtras.join("");
            
        }else{
            // Regular losing message
            output = "```diff\n-You lost...```**" + win_chance + "%** win chance";

            // If the user is in a realm, reduce their HP and prepare a different output
            var area = lib.readFile(dir + "/area.txt");
            if(area > 13){
                var hp = parseInt(lib.readFile(dir + "/hp.txt"));
                realmFlag = true;
                // Calculate damage (minimum of 5)
                var damage = (monster_attack + monster_speed - user_attack - user_speed - bonus) / 2;
                if(damage < 0){damage = 0;}
                hp = Math.round(hp - damage - 5);
                lib.saveFile(dir + "/hp.txt", hp);
                
                // If the user's HP is below 1, throw them out of the realm
                if(hp < 1){
                    lib.saveFile(dir + "/area.txt", "0");
                    output =  "```diff\n-You lost...```**" + win_chance + "%** win chance\nYour HP has been reduced to **0** and you've been returned to the Hub!";
                }else{
                    // Realm losing message
                    output = "```diff\n-You lost...```**" + win_chance + "%** win chance\nYou have **" + hp + "** HP remaining!\n**The realm allows you to try again...**";
                }
            }
        }

        // Save stats if necessary
        if(saveStats){ lib.saveFile(dir + "/stats.txt", user_stats.join("|")); }
        
        // End encounter unless the realm or ability prevents it
        var ranks = ["D", "C", "B", "A", "S", "SS"];
        if(!win){
            if(keepEncounter){
                if(!realmFlag){abilityOutput = "**Ability: You get a second chance!**" + "\n\u2800";}
                else{abilityOutput = "**Ability: [Persistence] has no effect in a realm...**";}
            }else if(!realmFlag){
                output += "\n\u2800\n\u2800";
                lib.saveFile(dir + "/current_encounter.txt", "");
                if(shinyNotif){
                    notificationEmbed.setDescription("The player **" + username + "** engaged with:\n```\nShiny " + monster_data[0] + "** (Rank " + ranks[monster_keys_array[0]] + ")``````diff\n-They lost the fight!```You get what you deserve I'd say!");
                }
            }
            output += abilityOutput;
		}else{
		    lib.saveFile(dir + "/current_encounter.txt", "");
            if(shinyNotif){
                notificationEmbed.setDescription("The player **" + username + "** engaged with:\n```\nShiny " + monster_data[0] + " (Rank " + ranks[monster_keys_array[0]] + ")``````diff\n+They won the fight!```Congrats I guess??");
            }
		}

        // Add equip buttons if necessary
        var outputObject = { content: "@ __**" + username + "**__" + output, allowedMentions: { repliedUser: false } };
        if(buttons.length > 0){
            var row = new ActionRowBuilder().addComponents(buttons);
            outputObject = { content: "@ __**" + username + "**__" + output, allowedMentions: { repliedUser: false }, components: [row] };
        }

        // Shiny notification
        if(shinyNotif){
            lib.notifyAll(user.id, message, notificationEmbed, "shinies");
        }

        // If the command was called using a special button then edit the original message instead of sending a new one
        if(lib.exists(message.message) && message.customId.includes("embedEdit")){
            message.deferUpdate();
            delete message.message.embeds[0].data.fields;
            message.message.embeds[0].data.description = output;
            // Remove event button first
            if(message.message.components[0].components.length == 5){ message.message.components[0].components.splice(4, 1); }
            if(!realmFlag){ message.message.components[0].components.splice(0, 2); }
            if(buttons.length > 0){
                if(buttons.length > 1){
                    message.message.edit({ embeds: [message.message.embeds[0]], components: [row]});
                    return;
                }else{
                    message.message.components[0].components.push(buttons[0]);
                }
            }
            message.message.edit({ embeds: [message.message.embeds[0]], components: [message.message.components[0]]});
            return;
        }

        // Normal output
        message.reply(outputObject);
        
	},
};