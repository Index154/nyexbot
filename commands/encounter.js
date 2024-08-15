var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'encounter',
	usages: ['', 'show'],
	descriptions: ['Starts an encounter and creates a new user account if necessary', 'Shows the previous encounter again'],
    shortDescription: 'Encounter a monster',
    weight: 5,
	cooldown: 3,
	aliases: ['enc'],
	addendum: [
        '- Has an increased cooldown of 2.5 seconds',
        '- If you have previously captured an encountered monster then the message will feature a bag emote',
        '- Encountered monsters have a tiny chance of being shiny. You can increase this chance most easily with `{prefix}radar`',
        '- Starting a new encounter will overwrite your previous one',
        '- If you activate a buff after starting an encounter then it will still apply to it',
        '- A higher Monster Luck stat will make rarer monsters more common',
        '- You can use `{prefix}check` to inspect your active encounter',
        '- `{prefix}fight` and `{prefix}capture` can be used to end an encounter'
    ],
    category: 'main',
	
	execute(message, user, args, prefix) {
        
        // Set important variables
        var username = user.username;
        var dir = "userdata/" + user.id;

        // Flag for showing previous enc
        var showEnc = false;
        var prevMon = "";
        var monster_keys = "";
        if(lib.exists(args[0])){
            prevMon = lib.readFile(dir + "/current_encounter.txt");
            console.log(prevMon);
            if(!lib.exists(prevMon)){
                message.reply({ content: "\u274C There is no active encounter to display!", allowedMentions: { repliedUser: false } });
                return;
            }
            showEnc = true;
            monster_keys = prevMon.split(",");
        }
        
        // Empty confirmation queues
        lib.saveFile(dir + "/confirm.txt", "");
        lib.saveFile(dir + "/confirm_conv.txt", "no");
        lib.saveFile(dir + "/crafting_queue.txt", "");

        // Set current area path
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
                buff_extra = "*Your **" + item_name + "**'s buff ran out!*";
                current_buff = "";
                if(!showEnc){
                    lib.saveFile(dir + "/stats.txt", new_stats);
                    lib.saveFile(dir + "/current_buff.txt", "");
                }
            }
        }
        
        // Update item buff timer
        var radar_bonus = 0;
        if(current_buff !== ""){
            // Modify and repack the timer
            if(!showEnc){ buff_timer--; }
            buff_stat_subdiv[1] = buff_timer;
            buff_stats[10] = buff_stat_subdiv.join(",");
            
            if(!showEnc){ lib.saveFile(dir + "/current_buff.txt", buff_stats.join("|")); }
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
            if(buff_stats[9] == "Special" && !showEnc){
                lib.saveFile(dir + "/charges.txt", buff_timer)
                var radar_raw = lib.readFile(dir + "/radar_values.txt").split(",");
                var quest_bonus = globalVars.questRadarBonus * (parseInt(radar_raw[0]) * 0.01);
                var mon_bonus = globalVars.monsterRadarBonus * (parseInt(radar_raw[1]) * 0.01);
                radar_bonus = quest_bonus + mon_bonus;
            }
        }
        
        // Fetch monsters
        var monsters_raw = lib.readFile("data/monsters/monsters" + area + ".txt");
        var monster_groups = monsters_raw.split("#################################################################################\n");
        
        // Set monster group data
        var m_luck = parseInt(user_stats[4]);
        var rarities = [4, 10, 20, 40, 200];
        var rarity_names = ["SS", "S", "A", "B", "C", "D"];
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
        var inverted_ids = [5, 4, 3, 2, 1, 0];
        var rarity_rand = lib.rand(1, limit);
        var chosen_group = 5;
        var addPrevious = 0;
        for(y = 0; y < 5 && chosen_group == 5; y++){
            if(rarity_rand <= (rarities[y] + addPrevious)){
                chosen_group = y;
            }
            addPrevious = addPrevious + rarities[y];
        }
        if(showEnc){ chosen_group = inverted_ids[monster_keys[0]]; }
        var rarity = rarity_names[chosen_group];
        
        // Determine monster
        chosen_group = inverted_ids[chosen_group];
        var monsters = monster_groups[chosen_group].split(";\n");
        var monster_key = lib.rand(0, monsters.length - 2);
        var color_modifiers = ["\n", "fix\n", "hy\n", "dust\n{ ", "1c\n~ ", "1c\n~ "];
        var embed_colors = ["#b0b0b0", "#0099ff", "#2AA189", "#b80909", "#e3b712", "#e39f0e"];
        var embed_color = embed_colors[chosen_group];
        var color_mod = color_modifiers[chosen_group];
        
        // If the user has an active lure buff then give a chance to reroll into a monster of the matching type
        if(current_buff !== "" && !showEnc && buff_stats[0].includes("Lure")){
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
        if(abilityData[0] == "1" && !showEnc){
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
                        abilityOutput = "**Ability: Increased this encounter's shiny chance!**";
                    }
                    break;
                case 1:
                    // Time-based
                    var d = new Date();
                    var current_min = Math.floor(d.getTime() / 60000);
                    var last_min = parseInt(lib.readFile(dir + "/ability_timestamp.txt"));
                    if(last_min + abilityCondition < current_min || last_min - current_min > abilityCondition){
                        polisher = abilityValue;
                        abilityOutput = "**Ability: Increased this encounter's shiny chance!**";
                        lib.saveFile(dir + "/ability_timestamp.txt", current_min);
                    }
                    break;
                default:
                    // Encounter-based
                    if(abilityCondition === 0){
                        polisher = abilityValue;
                        abilityOutput = "**Ability: Increased this encounter's shiny chance!**";
                        var abilityList = lib.readFile("data/ability_conditions.txt").split("\n");
                        var abilityVariants = abilityList[abilityID].split(";;");
                        var abilityVariant = abilityVariants[abilityModifierTime].split("|");
                        abilityCondition = parseInt(abilityVariant[abilityConditionType]) + 1;
                    }
                    
            }
        }

        // Change monster key to accomodate for the area
        var monster_data = monsters[monster_key].split("|");
        monster_key = monster_data[7];
        
        // If showing previous encounter => Get monster keys from file
        if(showEnc){
            chosen_group = parseInt(monster_keys[0]);
            monster_key = parseInt(monster_keys[1]);
            shiny_key = parseInt(monster_keys[2]);
        }

        // Chain calculations
        var shinyRate = globalVars.shinyRate;
        var chainRaw = lib.readFile(dir + "/chain.txt");
        var chain = ["0", "0"];
        if(lib.exists(chainRaw)){
            chain = chainRaw.split("|");
        }
        var chainInfo = "";
        // MAX chain count for 100% shiny rate (1/4000): 1.2 = 42 | 1.3 = 29 | 1.4 = 23 | 1.5 = 19 | 1.6 = 17
        // MAX chain count for 100% shiny rate (1/8000): 1.2 = 46 | 1.3 =  | 1.4 =  | 1.5 = 21 | 1.6 = 18
        var chainModifiers = [1.2, 1.23, 1.3, 1.35, 1.5, 1.6];
        if(chain[0] == chosen_group + "," + monster_key + ",0"){
            chainInfo = "❗ ❗ **__Chain target__** ❗ ❗";
            for(i = 0; i < parseInt(chain[1]); i++){
                shinyRate = Math.floor(shinyRate / chainModifiers[chosen_group]);
                if(shinyRate < 1){shinyRate = 1;}
            }
        }
        // Determine shininess
        while(shiny_key === 0  && polisher > 0 && !showEnc){
            // Default: 1 roll
            polisher--;
            var mod_rand = lib.rand(1, shinyRate);
            if(mod_rand <= shiny_chance){
                shiny_key = 1;
            }
        }
        
        // Update ability cooldown if it is encounter-based
        if(abilityData[0] !== "0" && abilityData[2] == "2" && !showEnc){
            if(abilityCondition > 0){abilityCondition--;}
            lib.saveFile(dir + "/ability_cd.txt", abilityCondition);
        }
        
        // Get new info from the main file
        var monster_groups_all = lib.readFile("data/monsters/monsters.txt").split("#################################################################################\n");
        if(lib.readFile(dir + "/monster_mode.txt") == "funny"){monster_groups_all = lib.readFile("data/monsters/monsters_alt.txt").split("#################################################################################\n");}
        var monsters_all = monster_groups_all[chosen_group].split(";\n");
        monster_data = monsters_all[monster_key].split("|");
        var monster_name = monster_data[0];
        
        // Current chain info for footer
        if(chain[1] != "0"){
            var chainMonsterKeys = chain[0].split(",");
            var chainMonsters = monster_groups_all[chainMonsterKeys[0]].split(";\n");
            var chainMonster = chainMonsters[chainMonsterKeys[1]].split("|");
            var chainData = chainMonster[0] + " (" + chain[1] + ")";
        }

        // Shiny check
        var shiny_extra = "";
        //shiny_key = 1;
        if(shiny_key == 1){
            shiny_extra = "\u2728";
            rarity = rarity + "++";
            monster_name = "Shiny " + monster_name;
            color_mod = "ruby\n";
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
        
        // Create final monster key group and save encounter
        var monster = chosen_group + "," + monster_key + "," + shiny_key;
        if(!showEnc){ lib.saveFile(dir + "/current_encounter.txt", monster); }
        
        // Check if the user has the monster in their previous captures
        var captures = lib.readFile(dir + "/all_captures.txt");
        var capped = "";
        if(captures.includes(monster)){
            capped = " \uD83D\uDCBC";
        }
		
        // Check single-embed mode setting and change button types accordingly
        var mode = "single";
        var buttonRestriction = user.id;
        var buttonType = "embedEdit";
        var userModeSetting = lib.readFile(dir + "/commandmode.txt");
        if(lib.exists(userModeSetting)){
            mode = userModeSetting;
        }
        if(mode != "single"){
            buttonRestriction = "any";
            buttonType = "normal";
        }

		// Build buttons
		var button1 = new ButtonBuilder()
			.setCustomId(buttonRestriction + "|capture|" + buttonType)
			.setLabel('Capture')
			.setStyle(1)
		var button2 = new ButtonBuilder()
			.setCustomId(buttonRestriction + "|fight|" + buttonType)
			.setLabel('Fight')
			.setStyle(1)
		var button3 = new ButtonBuilder()
			.setCustomId(buttonRestriction + "|encounter|" + buttonType)
			.setLabel('-- New encounter --')
			.setStyle(4)
        var button4 = new ButtonBuilder()
		    .setCustomId(buttonRestriction + "|check " + monster + "|" + buttonType)
			.setLabel('Check')
			.setStyle(2)
        var buttons = [button1, button2, button3, button4];
        // Change button order sometimes while chaining
        var chainValue = parseInt(chain[1]);
        if(chainValue > 5){
            var orderRoll = lib.rand(1, 100);
            // Chain > 5 => 1/33
            // Chain > 15 => 1/20
            // Chain > 25 => 1/14
            // Chain > 30 => 1/10
            if(orderRoll <= 3 || (chainValue > 15 && orderRoll <= 5) || (chainValue > 25 && orderRoll <= 7) || (chainValue > 30 && orderRoll <= 10)){
                buttons = [button2, button1, button3, button4];
            }
        }

        // Add random event button sometimes
        var randomEventRoll = lib.rand(1, 1000);
        if(randomEventRoll <= 25){ // 25 aka ~1/40?
            var eventButton = new ButtonBuilder()
                .setCustomId(user.id + "|event|" + buttonType)
                .setLabel('?')
                .setStyle(3);
            buttons.push(eventButton);
        }

        // Build row component
		var row = new ActionRowBuilder().addComponents(buttons);
		//var buttonList1 = [button1, button2];
		//var buttonList2 = [button3]
		
        // Prepare extra text and formatting
        var hpExtra = "";
        if(parseInt(area_raw) > 13){
            var hp = parseInt(lib.readFile(dir + "/hp.txt"));
            hpExtra = "You have **" + hp + "** HP remaining!";
        }

        // Formatting for semi-consistent embed height
        chanceExtra = "";
        allExtras = [chainInfo, hpExtra, buff_extra, abilityOutput];
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

        // Output embed
        var outputEmbed = new Discord.EmbedBuilder()
        	.setColor(embed_color)
        	.setTitle("@ __**" + username + "**__")
        	.setThumbnail("https://artificial-index.com/media/rpg_monsters/" + monster_name.toLowerCase().replace(/ /g, "_") + ".png")
        	.setDescription("```" + color_mod + "A" + n_extra + " " + shiny_extra + monster_name + shiny_extra + " (" + rarity + ") appeared!" + capped + "```" + allExtras.join(""));

        // Add footer if necessary
        if(chain[1] != "0"){
            outputEmbed.setFooter({ text: "Current chain: " + chainData });
        }

        // If the command was called using a special button then edit the original message instead of sending a new one
        if(lib.exists(message.message) && message.customId.includes("embedEdit")){
            message.deferUpdate();
            message.message.edit({ embeds: [outputEmbed], components: [row] });
            return;
        }

		// Normal output
		message.reply({ embeds: [outputEmbed], components: [row], allowedMentions: { repliedUser: false } });
		
	},
};