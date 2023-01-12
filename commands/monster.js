var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'monster',
	descriptions: ['Immediately captures a random monster'],
    shortDescription: 'Get a free monster',
    weight: 5,
	usages: [''],
	aliases: ['mon', 'm'],
	addendum: 'Can only be used once every 3 hours',
    category: 'tasks',
	
	execute(message, user, args) {
	    fs = require('fs');
	    const lib = require("../library.js");
        
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
        
        // Create a new user folder with default files if there is none yet
        var newInfo = "";
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
            lib.saveFile(dir + "/ability.txt", "0|0|0");
            lib.saveFile(dir + "/ability_cd.txt", "");
            lib.saveFile(dir + "/ability_timestamp.txt", "");
            lib.saveFile(dir + "/all_captures.txt", "");
            lib.saveFile(dir + "/area.txt", "4");
            lib.saveFile(dir + "/boss_cd.txt", "1");
            lib.saveFile(dir + "/captures.txt", "");
            lib.saveFile(dir + "/charges.txt", "0");
            lib.saveFile(dir + "/chain.txt", "0|0");
            lib.saveFile(dir + "/confirm.txt", "");
            lib.saveFile(dir + "/confirm_conv.txt", "no");
            lib.saveFile(dir + "/cooldown.txt", "1");
            lib.saveFile(dir + "/crafting_queue.txt", "");
            lib.saveFile(dir + "/current_buff.txt", "");
            lib.saveFile(dir + "/current_quest.txt", "0");
            lib.saveFile(dir + "/daily.txt", "1|0");
            lib.saveFile(dir + "/daily_radar.txt", "1");
            lib.saveFile(dir + "/dmupdates.txt", "no");
            lib.saveFile(dir + "/equipment.txt", "0,1,2");
			lib.saveFile(dir + "/equip_modifiers.txt", "|0|0|0|0|0|0\n|0|0|0|0|0|0\n|0|0|0|0|0|0");
            lib.saveFile(dir + "/fav_mats.txt", "");
            lib.saveFile(dir + "/hp.txt", "0");
            lib.saveFile(dir + "/inventory.txt", "");
            lib.saveFile(dir + "/main_monster.txt", "");
            lib.saveFile(dir + "/materials.txt", "");
            lib.saveFile(dir + "/mon_cd.txt", "1");
            lib.saveFile(dir + "/monster_mode.txt", "normal");
            lib.saveFile(dir + "/new_equip.txt", "");
			lib.saveFile(dir + "/new_modifier.txt", "");
            lib.saveFile(dir + "/projects.txt", "");
            lib.saveFile(dir + "/radar_values.txt", "0,0");
            lib.saveFile(dir + "/research.txt", "");
            lib.saveFile(dir + "/saved_chain.txt", "");
            lib.saveFile(dir + "/saved_encounter.txt", "");
            lib.saveFile(dir + "/scrap.txt", "0");
            lib.saveFile(dir + "/stats.txt", "Classless|5|5|3|0|0|0|0|0|D|1|0|0|0");
            lib.saveFile(dir + "/token_state.txt", "");
            lib.saveFile(dir + "/trade.txt", "");
            lib.saveFile(dir + "/username.txt", username);
            
            // If the user is an alpha tester, give them their trophy to start with
            var userId = user.id.toString().trim();
            newInfo = "You can either `" + prefix + "capture` or `" + prefix + "fight` monsters.\nUse`" + prefix + "enc` at any time to start an encounter!\nCheck out `" + prefix + "quest` to make progress and learn more!\nUse `" + prefix + "help` for more concentrated information!\nAnd please use `" + prefix + "submit` to send feedback and bug reports!";
            if(userId == "266598133683847169" || userId == "690236539971698719" || userId == "480412132538712070" || userId == "270597404342878210"){
                lib.saveFile(dir + "/trophies.txt", "10|Tester|Special|**Alpha Tester** - One of the special people!");
                newInfo = "**Welcome back, alpha tester! Your trophy has been added**\n" + newInfo;
            }else if(userId == "214754022832209921"){
                lib.saveFile(dir + "/trophies.txt", "10|Tester|Special|**Creator** - Real!");
                newInfo = "**You deleted your account again? So dedicated!**\n" + newInfo;
            }else{
                lib.saveFile(dir + "/trophies.txt", "");
            }
            
            message.reply({ content: "@ __**" + username + "**__, your account has been created! Here is your first monster: ", allowedMentions: { repliedUser: false }});
        }
        
        // Check and update cooldown
        var d = new Date();
        var current_sec = Math.floor(d.getTime() / 1000);
        var last_sec = parseInt(lib.readFile(dir + "/mon_cd.txt"));
        var cooldown = 10800;
        if(last_sec + cooldown > current_sec){
            var timeLeft = lib.secondsToTime(cooldown - current_sec + last_sec);
            message.reply({ content: "\u274C You have to wait **" + timeLeft + "** before you can receive another guaranteed monster!", allowedMentions: { repliedUser: false }});
            return;
        }
        lib.saveFile(dir + "/mon_cd.txt", current_sec);
        
        // Get current area path
        var area_raw = lib.readFile(dir + "/area.txt");
        var area = "_" + area_raw;
        if(area == "_"){area = "_0";}
        
        // Load unique realm list and get event realm
        var unique_realms = lib.readFile("data/unique_realms.txt").split(",");
        var current_event = lib.readFile("data/weekly_realm.txt");
        
        // Update the weekly event realm if necessary
        var week = lib.getWeek();
        var last_week = lib.readFile("data/realm_week.txt");
        if(last_week != week){
            // Load next weekly realm ID
            var new_id = unique_realms.indexOf(current_event) + 1;
            if(new_id >= unique_realms.length){new_id = 0;}
            current_event = unique_realms[new_id];
            
            // Update files
            lib.saveFile("data/weekly_realm.txt", current_event);
            lib.saveFile("data/realm_week.txt", week);
        }
        
        // If the user is in an event realm, check if it is still the weekly realm
        if(unique_realms.includes(area_raw)){
            if(current_event != area_raw){
                // The event has expired, remove the user from the realm
                message.reply({ content: "@ __**" + username + "**__, your connection to the unique realm has become too unstable!\n__You've been forcefully returned to the Hub__", allowedMentions: { repliedUser: false }});
                lib.saveFile(dir + "/area.txt", "0");
                return;
            }
        }
        
        // Load relevant stats
        var user_stats = lib.readFile(dir + "/stats.txt").split("|");
        
        // Update user stats and empty the current buff file if the item buff timer has reached 0
        var current_buff = lib.readFile(dir + "/current_buff.txt");
        var buff_extra = "";
        if(current_buff !== ""){
            var buff_stats = current_buff.split("|");
            var buff_stat_subdiv = buff_stats[10].split(",");
            var buff_timer = parseInt(buff_stat_subdiv[1]);
            var item_name = buff_stats[0];
            if(buff_timer === 0){
                // Remove old item's values from the user's stats
                for(y = 1; y < 7; y++){
                    var base = parseInt(user_stats[y]);
                    var minus = parseInt(buff_stats[y]);
                    user_stats[y] = base - minus;
                }
                
                var new_stats = user_stats.join("|");
                buff_extra = "*Your **" + item_name + "**'s effect ran out!*";
                current_buff = "";
                lib.saveFile(dir + "/stats.txt", new_stats);
                lib.saveFile(dir + "/current_buff.txt", "");
            }
        }
        
        // Update item buff timer
        var radar_bonus = 0;
        if(current_buff !== ""){
            // Modify and repack the timer
            buff_timer--;
            buff_stat_subdiv[1] = buff_timer;
            buff_stats[10] = buff_stat_subdiv.join(",");
            
            lib.saveFile(dir + "/current_buff.txt", buff_stats.join("|"));
            if(buff_timer === 0){
                buff_extra = "*Your **" + item_name + "**'s buff will run out after this encounter!*";
            }else{
                var ex_s = "s";
                if(buff_timer == 1){
                    ex_s = "";
                }
                buff_extra = "*Your **" + item_name + "**'s buff will last for **" + buff_timer + "** more encounter" + ex_s + "*";
            }
            
            // Calculate radar bonus and update charge count if it is active
            if(buff_stats[9] == "Special"){
                lib.saveFile(dir + "/charges.txt", buff_timer)
                var radar_raw = lib.readFile(dir + "/radar_values.txt").split(",");
                var quest_bonus = 20 * (parseInt(radar_raw[0]) * 0.01);
                var mon_bonus = 30 * (parseInt(radar_raw[1]) * 0.01);
                radar_bonus = Math.round(quest_bonus + mon_bonus);
            }
        }
        
        // Check if the user has activated a monster token and use a different monsters file if so
        var tokenExtra = "";
        var tokenState = lib.readFile(dir + "/token_state.txt");
        if(lib.exists(tokenState)){
            // Fetch token monster pool
            var monsters_raw = lib.readFile("data/monsters/monsters_token.txt");
            var monster_groups = monsters_raw.split("#################################################################################\n");
            
            // Update token counter
            tokenState = parseInt(tokenState) - 1;
            tokenExtra = "One Token Point has been used up! You have **" + tokenState + "** remaining!";
            if(tokenState === 0){tokenState = "";}
            lib.saveFile(dir + "/token_state.txt", tokenState);
        }else{
            // Fetch monster pool normally
            var monsters_raw = lib.readFile("data/monsters/monsters" + area + ".txt");
            var monster_groups = monsters_raw.split("#################################################################################\n");
        }
        
        // Set monster group data
        var m_luck = parseInt(user_stats[4]);
        var rarities = [4, 10, 20, 40, 200];
        var rarity_names = ["Rank SS", "Rank S", "Rank A", "Rank B", "Rank C", "Rank D"];
        // Modify rarity chances based on monster luck
        var limit = 1000;
        // Negative luck math
        if(m_luck < 0){
            limit = 1000 - (m_luck * 10);
        }
        // Adjust the base chances depending on user rank and lower the monster luck value for the following calculations
        if(user_stats[9] == "SS"){
            rarities = [40, 60, 300, 350, 150];
        }else
        if(user_stats[9] == "S"){
            rarities = [15, 50, 250, 350, 200];
        }else
        if(user_stats[9] == "A"){
            rarities = [10, 30, 250, 350, 250];
        }else
        if(user_stats[9] == "B"){
            rarities = [8, 20, 100, 450, 300];
        }else
        if(user_stats[9] == "C"){
            rarities = [6, 15, 25, 150, 500];
        }
        // Apply linear (?) rising functions to the selected base values
        rarities[4] = rarities[4] + (m_luck * 4);   //10 M-Luck is 4%
        rarities[3] = rarities[3] + (m_luck * 2);   //10 M-Luck is 2%
        rarities[2] = rarities[2] + m_luck;         //10 M-Luck is 1%
        rarities[1] = rarities[1] + (m_luck / 2);   //10 M-Luck is 0.5%
        rarities[0] = rarities[0] + (m_luck / 4);   //10 M-Luck is 0.25%
        
        // Determine result!
        var rarity_rand = lib.rand(1, limit);
        var chosen_group = 5;
        var add_previous = 0;
        for(y = 0; y < 5 && chosen_group == 5; y++){
            if(rarity_rand <= (rarities[y] + add_previous)){
                chosen_group = y;
            }
            add_previous = add_previous + rarities[y];
        }
        var rarity = rarity_names[chosen_group];
        
        // Determine monster
        var inverted_ids = [5, 4, 3, 2, 1, 0];
        chosen_group = inverted_ids[chosen_group];
        var monsters = monster_groups[chosen_group].split(";\n");
        var monster_key = lib.rand(0, monsters.length - 2);
        var color_modifiers = ["\n", "fix\n", "hy\n", "dust\n{ ", "1c\n~ ", "1c\n~ "];
        var embed_colors = ["#b0b0b0", "#0099ff", "#2AA189", "#b80909", "#e3b712", "#e39f0e"];
        var embed_color = embed_colors[chosen_group];
        var color_mod = color_modifiers[chosen_group];
        
        // If the user has an active lure buff then give a chance to reroll into a monster of the matching type
        if(current_buff !== "" && buff_stats[0].includes("Lure")){
            // Make an array of all monsters which the encounter could be rerolled into
            var target_type = buff_stats[0].slice(0, -5); // Get the type from the item buff name
            var id_list = [];
            for(i = 0; i < monsters.length - 1; i++){
                var monster_data_temp = monsters[i].split("|");
                if(monster_data_temp[3].includes(target_type)){
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
        
        // Determine shininess
        var shiny_key = 0;
        // Modify chance
        var shiny_chance = 1 + Math.round(parseInt(user_stats[4]) / 20) + radar_bonus;
        if(shiny_chance < 1){shiny_chance = 1;}
        // Apply polisher ability
        var polisher = 1;
        var abilityData = lib.readFile(dir + "/ability.txt").split("|");
        var abilityID = parseInt(abilityData[0]);
        var abilityModifierTime = parseInt(abilityData[1]);
        var abilityModifierEffect = parseInt(abilityData[1]);
        var abilityConditionType = parseInt(abilityData[2]);
        if(abilityModifierTime > 2){abilityModifierTime = 0;}
        else{abilityModifierEffect = 0;}
        var abilityCondition = parseInt(lib.readFile(dir + "/ability_cd.txt"));
        var abilityOutput = "";
        if(abilityData[0] == "1"){
            // Check for cooldown
            var abilityValuesList = lib.readFile("data/ability_values.txt").split("\n");
            var abilityValues = abilityValuesList[abilityID].split("|");
            var abilityValue = parseInt(abilityValues[abilityModifierEffect]);
            switch(abilityConditionType){
                case 0:
                    // Chance-based
                    var abilityRand = lib.rand(1, 100);
                    if(abilityRand <= abilityCondition){
                        polisher = abilityValue;
                        abilityOutput = "**Your equipment ability has activated, increasing this encounter's shiny chance!**";
                    }
                    break;
                case 1:
                    // Time-based
                    var d = new Date();
                    var current_min = Math.floor(d.getTime() / 60000);
                    var last_min = parseInt(lib.readFile(dir + "/ability_timestamp.txt"));
                    if(last_min + abilityCondition < current_min || last_min - current_min > abilityCondition){
                        polisher = abilityValue;
                        abilityOutput = "**Your equipment ability has activated, increasing this encounter's shiny chance!**";
                        lib.saveFile(dir + "/ability_timestamp.txt", current_min);
                    }
                    break;
                default:
                    // Encounter-based
                    if(abilityCondition === 0){
                        polisher = abilityValue;
                        abilityOutput = "**Your equipment ability has activated, increasing this encounter's shiny chance!**";
                        var abilityList = lib.readFile("data/ability_conditions.txt").split("\n");
                        var abilityVariants = abilityList[abilityID].split(";;");
                        var abilityVariant = abilityVariants[abilityModifierTime].split("|");
                        abilityCondition = parseInt(abilityVariant[abilityConditionType]) + 1;
                    }
                
            }
        }
        while(shiny_key === 0  && polisher > 0){
            // Default: 1 roll
            polisher--;
            var mod_rand = lib.rand(1, 40000);
            if(mod_rand <= shiny_chance){
                shiny_key = 1;
            }
        }
        
        // Update ability cooldown if it is encounter-based
        if(abilityData[0] !== "0" && abilityData[2] == "2"){
            if(abilityCondition > 0){abilityCondition--;}
            lib.saveFile(dir + "/ability_cd.txt", abilityCondition);
        }
        
        // Get monster info for output
        var monster_data = monsters[monster_key].split("|");
        // Change monster key to accomodate for the area
        monster_key = monster_data[7];
        // Get new info from the main file
        var monster_groups_all = lib.readFile("data/monsters/monsters.txt").split("#################################################################################\n");
        if(lib.readFile(dir + "/monster_mode.txt") == "funny"){monster_groups_all = lib.readFile("data/monsters/monsters_alt.txt").split("#################################################################################\n");}
        var monsters_all = monster_groups_all[chosen_group].split(";\n");
        monster_data = monsters_all[monster_key].split("|");
        var monster_name = monster_data[0];
        
        // Shiny check
        var shiny_extra = "";
        if(shiny_key == 1){
            shiny_extra = "\u2728";
            rarity = rarity + "++";
            color_mod = "ruby\n";
            monster_name = "Shiny " + monster_name;
            embed_color = "#8f1ee6";
            
            var shinies = lib.readFile("data/monsters/monsters_shiny.txt");
			var shiny_groups = shinies.split("#################################################################################\n");
			var shinies_array = shiny_groups[chosen_group].split(";\n");
			monster_data = shinies_array[monster_key].split("|");
        }
        
        // Minor grammatical check
        var n_extra = "";
        var first_letter = monster_name.substring(0, 1);
        if(first_letter == "A" || first_letter == "E" || first_letter == "I" || first_letter == "O" || first_letter == "U"){
            n_extra = "n";
        }
        
        // Create final monster key group
        var monster = chosen_group + "," + monster_key + "," + shiny_key;
        
        // Check if the user already had the monster in their previous captures
        var all_captures = lib.readFile(dir + "/all_captures.txt");
        var capped = "";
        if(all_captures.includes(monster)){
            capped = "  ( \uD83D\uDCBC )";
        }
		
		// Reduce realm HP
		var realm_extra = "";
		var area = parseInt(area_raw);
        if(area > 13 && tokenExtra === ""){
            var hp = parseInt(lib.readFile(dir + "/hp.txt"));
            // Subtract damage
            var damage = 10;
            hp = Math.round(hp - damage);
            lib.saveFile(dir + "/hp.txt", hp);
            
            // If the user's HP is below 1, throw them out of the realm
            realm_extra = "You have **" + hp + "** HP remaining!\n";
            if(hp < 1){
                lib.saveFile(dir + "/area.txt", "0");
                realm_extra = "Your HP has been reduced to **0** and you've been returned to the Hub!\n";
            }
        }
		
		// Add the monster to their captures and captures dex
	    var trophy_extra = "";
		var captures = lib.readFile(dir + "/captures.txt");
		if(captures === ""){
			captures = monster;
		}else{
			captures = captures + ";" + monster;
		}
		// If the monster has never been captured before, add it to the "dex"
		if(!all_captures.includes(monster)){
		   	if(all_captures === ""){
				all_captures = monster;
			}else{
				all_captures = all_captures + ";" + monster;
			}
			lib.saveFile(dir + "/all_captures.txt", all_captures);
			
			// Check for trophies
		    // Count the amount of unique monsters matching the type(s) of the one captured
		    var trophyIcons = {D: "<:real_black_circle:856189638153338900>", C: "\uD83D\uDD35", B: "\uD83D\uDFE2", A: "\uD83D\uDD34", S: "\uD83D\uDFE1", SS: "\uD83D\uDFE0", Slayer1: "\uD83E\uDD47", Slayer2: "\uD83E\uDD48", Slayer3: "\uD83E\uDD49", Tester: "\uD83D\uDD2C", Special: "\u2728", Level: "\u2747", Quest: "\uD83D\uDCAC", "(Special)": "\uD83D\uDFE3", Vortex: "\uD83C\uDF00", Slime: "<:slime:860529740057935872>", Beast: "\uD83D\uDC3B", Demon: "\uD83D\uDC79", Undead: "\uD83D\uDC80", Arthropod: "\uD83E\uDD97", Dark: "<:darkness:860530638821261322>", Water: "\uD83D\uDCA7", Plant: "\uD83C\uDF3F", Reptile: "\uD83E\uDD8E", Armored: "\uD83D\uDEE1", Flying: "<:wing:860530400539836456>", Fire: "\uD83D\uDD25", Fish: "\uD83D\uDC1F", Holy: "\uD83D\uDD31", Alien: "\uD83D\uDC7D", Intangible: "\uD83D\uDC7B", Frost: "\uD83E\uDDCA", Lightning: "\uD83C\uDF29", Legendary: "\u269C", Dragon: "\uD83D\uDC32"};
		    if(shiny_key === 0 && monster_data[3] !== "None"){
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
		            var id_list = [];
			        for(i = 0; i < monster_groups_all.length; i++){
			            var temp_monsters = monster_groups_all[i].split(";\n");
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
			            if(y === 0){trophy_extra += "You've received the trophy **" + trophyIcons[checkTypes[y]] + "\uD83D\uDFE1[" + checkTypes[y] + "] Master**!";}else{trophy_extra += "\nYou've received the trophy **" + trophyIcons[checkTypes[y]] + "\uD83D\uDFE1[" + checkTypes[y] + "] Master**!";}
			            trophy = true;
			            new_trophies.push("50" + "|" + checkTypes[y] + "|" + "S" + "|**[" + checkTypes[y] + "] Master** - Collected all " + checkTypes[y] + " monsters");
			        }else
			        if(has_count == Math.floor(type_count / 2)){
			            // 50% type completion
			            if(y === 0){trophy_extra += "You've received the trophy **" + trophyIcons[checkTypes[y]] + "\uD83D\uDD34[" + checkTypes[y] + "] Enthusiast**!";}else{trophy_extra += "\nYou've received the trophy **" + trophyIcons[checkTypes[y]] + "\uD83D\uDD34[" + checkTypes[y] + "] Enthusiast**!";}
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
		
        // Output embed
        var extraStuff = [newInfo, realm_extra, tokenExtra, buff_extra, abilityOutput, trophy_extra];
        for(u = 0; u < extraStuff.length; u++){
            if(extraStuff[u] === ""){extraStuff.splice(u, 1); u--}
        }
        var outputEmbed = new Discord.MessageEmbed()
        	.setColor(embed_color)
        	.setTitle("@ __**" + username + "**__")
        	.setThumbnail("https://cdn.discordapp.com/attachments/731848120539021323/" + monster_data[5]) //Alternative source (server): "https://indexnight.com/monsters/" + monster_name.toLowerCase().replace(/ /g, "_") + ".png"
        	.setDescription("```" + color_mod + "You've obtained a" + n_extra + " " + shiny_extra + monster_name + shiny_extra + " (" + rarity + ")!" + capped + "```" + extraStuff.join("\n"));
		// Real output
		message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false } });
	},
};