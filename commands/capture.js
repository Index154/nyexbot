var { prefix } = require('../config.json');

module.exports = {
	name: 'capture',
	usages: [''],
	descriptions: ['Attempts to capture the currently encountered monster'],
    shortDescription: 'Capture an encountered monster',
    weight: 10,
	cooldown: 3,
	aliases: ['cap'],
	addendum: [
        '- Has an increased cooldown of 2.5 seconds',
        '- A higher Mana stat will make this action more likely to succeed',
        '- If your stats are evenly balanced then capturing is less likely than winning a `{prefix}fight`',
        '- The command `{prefix}captures` can be used to view all monsters you\'ve ever captured',
        '- The more species of monster you collect the more effective the `{prefix}radar` will become',
        '- You can check how many monsters you\'re missing with `{prefix}completion`'
    ],
    category: 'main',
	
	execute(message, user, args, prefix) {
        
        // Set important variables
        var username = user.username;
        var dir = "userdata/" + user.id;
        
		// Fetch current encounter
		var monster_keys = lib.readFile(dir + "/current_encounter.txt");
		// Only run if there is one
		if(monster_keys === ""){
			message.reply({ content: "@ __**" + username + "**__ \u274C There is no monster to capture!", allowedMentions: { repliedUser: false }});
			return;
		}
		
        // Increment the current chain or start a new one
        var chain = lib.readFile(dir + "/chain.txt").split("|");
        var chainValue = 0;
        if(chain[0] == monster_keys){
            chain[1] = parseInt(chain[1]) + 1;
            chainValue = chain[1];
            lib.saveFile(dir + "/chain.txt", chain.join("|"));
        }else{
            lib.saveFile(dir + "/chain.txt", monster_keys + "|" + 0);
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
        if(abilityID > 1 && abilityID < 10){
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
        var capLimitBonus = 0;
        var capBonus = 0;
        var keepEncounter = false;
        var buffFlag = false;
        var newBuff = [];
        if(abilityFlag){
            var abilityValuesList = lib.readFile("data/ability_values.txt").split("\n");
            var abilityValues = abilityValuesList[abilityID].split("|");
            if(abilityModifierEffect > 2){abilityModifierEffect -= 2;}
            var abilityValue = parseInt(abilityValues[abilityModifierEffect]);
            switch(abilityID){
                case 2:
                    // Affinity - Higher capturing cap - Value is bonus
                    capLimitBonus = abilityValue;
                    abilityOutput = "**Ability: Increased this encounter's max capture chance!**";
                    break;
                case 3:
                    // Subduer - Higher mana - Value is bonus
                    capBonus = abilityValue;
                    abilityOutput = "**Ability: Increased mana for this encounter!**";
                    break;
                case 4:
                    // Curse - Lower mana - Value is negative bonus
                    capBonus = abilityValue;
                    abilityOutput = "**Ability: Lowered mana for this encounter!**";
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
                default:
                    // Persistence - Keep encounter after losing - Value is always 1
                    keepEncounter = true;
                    abilityOutput = "**Ability: It was of no use this time...**";
            }
        }
		
		// Get user stats and add bonus from ability
        var user_stats = lib.readFile(dir + "/stats.txt").split("|");
        var cap_eff = parseInt(user_stats[3]) + capBonus;
		
		// Determine capture result by comparing stats
		var win = false;
		var m_data = parseInt(monster_data[1]) + parseInt(monster_data[2]);
		// Roll the die
		var cap_rand = lib.rand(1, 100);
		var win_chance = Math.round(50 - (m_data / 1.5) + cap_eff);
		// Check user class and change cap accordingly. Then apply cap
		var win_cap = 85 + capLimitBonus;
		if(user_stats[0] == "Tamer" && parseInt(user_stats[10]) >= 50){
			win_cap += 5;
		}
		if(win_chance > win_cap){
			win_chance = win_cap;
		}
		if(win_chance < -70){win_chance = 1;}
		else if(win_chance < 2){win_chance = 2;}
		if(cap_rand <= win_chance){
			// Win
			win = true;
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
		
		// Reduce realm HP
		var realm_extra = "";
		var area = lib.readFile(dir + "/area.txt");
        if(area > 13){
            var hp = parseInt(lib.readFile(dir + "/hp.txt"));
            // Subtract damage
            var damage = 2;
            if(!win){damage = 4;}
            hp = Math.round(hp - damage);
            lib.saveFile(dir + "/hp.txt", hp);
            
            // If the user's HP is below 1, throw them out of the realm
            realm_extra = "You have **" + hp + "** HP remaining!";
            if(hp < 1){
                lib.saveFile(dir + "/area.txt", "0");
                realm_extra = "Your HP has been reduced to **0** and you've been returned to the Hub!";
            }
        }
		
		// If the user won, add the monster to their captures and captures dex
		var output = "```diff\n-The " + monster_title + " escaped...```";
        var trophy_extra = "";
		if(win){
			var captures = lib.readFile(dir + "/captures.txt");
			if(captures === ""){
				captures = monster_keys;
			}else{
				captures = captures + ";" + monster_keys;
			}
			// If the monster has never been captured before, add it to the "dex"
			var all_captures = lib.readFile(dir + "/all_captures.txt");
			if(!all_captures.includes(monster_keys)){
			   	if(all_captures === ""){
    				all_captures = monster_keys;
    			}else{
    				all_captures = all_captures + ";" + monster_keys;
    			}
    			lib.saveFile(dir + "/all_captures.txt", all_captures);
    			
    			// Check for trophies
			    // Count the amount of unique monsters matching the type(s) of the one captured
			    var trophyIcons = {D: "<:real_black_circle:856189638153338900>", C: "\uD83D\uDD35", B: "\uD83D\uDFE2", A: "\uD83D\uDD34", S: "\uD83D\uDFE1", SS: "\uD83D\uDFE0", Slayer1: "\uD83E\uDD47", Slayer2: "\uD83E\uDD48", Slayer3: "\uD83E\uDD49", Tester: "\uD83D\uDD2C", Special: "\u2728", Level: "\u2747", Quest: "\uD83D\uDCAC", "(Special)": "\uD83D\uDFE3", Vortex: "\uD83C\uDF00", Slime: "<:slime:860529740057935872>", Beast: "\uD83D\uDC3B", Demon: "\uD83D\uDC79", Undead: "\uD83D\uDC80", Arthropod: "\uD83E\uDD97", Dark: "<:darkness:860530638821261322>", Water: "\uD83D\uDCA7", Plant: "\uD83C\uDF3F", Reptile: "\uD83E\uDD8E", Armored: "\uD83D\uDEE1", Flying: "<:wing:860530400539836456>", Fire: "\uD83D\uDD25", Fish: "\uD83D\uDC1F", Holy: "\uD83D\uDD31", Alien: "\uD83D\uDC7D", Intangible: "\uD83D\uDC7B", Frost: "\uD83E\uDDCA", Lightning: "\uD83C\uDF29", Legendary: "\u269C", Dragon: "\uD83D\uDC32"};
			    if(shiny === "" && monster_data[3] !== "None"){
			        if(monster_data[3].includes(",")){
			            var checkTypes = monster_data[3].split(",");
			        }else{
			            var checkTypes = [monster_data[3]];
			        }
			        // For each type: Count all monsters that have the same type and count how many of them the user has captured before
			        var trophy = false;
			        var new_trophies = [];
			        for(y = 0; y < checkTypes.length; y++){
			            var type_count = 0;
			            var has_count = 0;
    			        for(i = 0; i < monster_groups.length; i++){
    			            var temp_monsters = monster_groups[i].split(";\n");
    			            for(x = 0; x < temp_monsters.length - 1; x++){
    			                var temp_m_data = temp_monsters[x].split("|");
    			                if(temp_m_data[3].includes(checkTypes[y])){
    			                    type_count++;
    			                    var matchID = i + "," + x + ",0";
    			                    if(all_captures.includes(matchID)){has_count++;}
    			                }
    			            }
    			        }
    			        
    			        // Give a trophy if a milestone has been reached
    			        if(has_count == type_count){
    			            // Full type completion
    			            trophy_extra += "You've received the trophy **" + trophyIcons[checkTypes[y]] + "\uD83D\uDFE1[" + checkTypes[y] + "] Master**!";
    			            trophy = true;
    			            new_trophies.push("50" + "|" + checkTypes[y] + "|" + "S" + "|**[" + checkTypes[y] + "] Master** - Collected all " + checkTypes[y] + " monsters");
    			        }else
    			        if(has_count == Math.floor(type_count / 2)){
    			            // 50% type completion
    			            trophy_extra += "You've received the trophy **" + trophyIcons[checkTypes[y]] + "\uD83D\uDD34[" + checkTypes[y] + "] Enthusiast**!";
    			            trophy = true;
    			            new_trophies.push("51" + "|" + checkTypes[y] + "|" + "A" + "|**[" + checkTypes[y] + "] Enthusiast** - Collected 50% of " + checkTypes[y] + " monsters");
    			        }
			        }
			        // Give trophies if there were any
			        if(trophy){
			            var trophies = lib.readFile(dir + "/trophies.txt");
			            for(u = 0; u < new_trophies.length; u++){
                            if(trophies === "" || trophies === undefined){
            	                trophies = new_trophies[u];
            	            }else{
                                trophies += ";\n" + new_trophies[u];
            	            }
			            }
                        lib.saveFile(dir + "/trophies.txt", trophies);
			        }
			    }
			}
			
			lib.saveFile(dir + "/captures.txt", captures);
			lib.saveFile(dir + "/current_encounter.txt", "");
			output = "```diff\n+Capture success!```";
		}

		// End encounter (unless ability prevented it)
		if(!win && keepEncounter){
		    output = "```diff\n-The " + monster_title + " escaped...```";
            abilityOutput = "**Ability: You get a second chance!**";
		}else{
		    lib.saveFile(dir + "/current_encounter.txt", "");
		}

        // Formatting for semi-consistent embed height
        chanceExtra = "**" + win_chance + "%** success chance";
        allExtras = [chanceExtra, realm_extra, abilityOutput, trophy_extra];
        var extraCount = 0;
        for(e = 0; e < allExtras.length; e++){
            if(allExtras[e] != ""){
                extraCount++;
                if(extraCount > 1){
                    allExtras[e] = "\n" + allExtras[e];
                }
            }
        }
        lineCount = 3;
        for(i = lineCount; i > extraCount; i--){
            var spacer = "\n\u2800";
            if(extraCount == 0 && i == lineCount){spacer = "\u2800";}
            allExtras.push(spacer);
        }
        output += allExtras.join("");

        // If the command was called using a special button then edit the original message instead of sending a new one
        if(lib.exists(message.message) && message.customId.includes("embedEdit")){
            message.deferUpdate();
            if(chainValue > 0){
                message.message.embeds[0].data.footer = { text: "Current chain: " + monster_title + " (" + chainValue + ")"};
            }else{
                delete message.message.embeds[0].data.footer;
            }
            delete message.message.embeds[0].data.fields;
            message.message.embeds[0].data.description = output;
            // Remove interact buttons
            message.message.components[0].components.splice(0, 2);
            // Remove event button
            if(message.message.components[0].components.length == 3){ message.message.components[0].components.splice(2, 1); }
            message.message.edit({ embeds: [message.message.embeds[0]], components: [message.message.components[0]]});
            return;
        }

        // If there is a chain, add it to the output
        if(chainValue > 0){
            output += "\nYour current capture chain is **" + chainValue + "**";
        }

        // Normal output
		message.reply({ content: "@ __**" + username + "**__" + output, allowedMentions: { repliedUser: false }});
		
    },
	   
};