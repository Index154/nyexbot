var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'encounter',
	usages: [''],
	descriptions: ['Starts an encounter and creates a new user account if necessary'],
	cooldown: 2.5,
	aliases: ['enc'],
	addendum: 'Has an increased cooldown of 2.5 seconds',
	
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
            lib.saveFile(dir + "/confirm.txt", "");
            lib.saveFile(dir + "/confirm_conv.txt", "no");
            lib.saveFile(dir + "/cooldown.txt", "1");
            lib.saveFile(dir + "/crafting_queue.txt", "");
            lib.saveFile(dir + "/current_buff.txt", "");
            lib.saveFile(dir + "/current_quest.txt", "0");
            lib.saveFile(dir + "/daily.txt", "1|0");
            lib.saveFile(dir + "/daily_radar.txt", "1");
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
            lib.saveFile(dir + "/saved_encounter.txt", "");
            lib.saveFile(dir + "/scrap.txt", "0");
            lib.saveFile(dir + "/stats.txt", "Classless|5|5|3|0|0|0|0|0|D|1|0|0|0");
            lib.saveFile(dir + "/token_state.txt", "");
            lib.saveFile(dir + "/trade.txt", "");
            lib.saveFile(dir + "/treasure.txt", "");
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
            
            message.reply({ content: "@ __**" + username + "**__, your account has been created! Here is your first encounter: ", allowedMentions: { repliedUser: false }});
        }
        
        // Empty confirmation queues
        lib.saveFile(dir + "/confirm.txt", "");
        lib.saveFile(dir + "/confirm_conv.txt", "no");
        lib.saveFile(dir + "/crafting_queue.txt", "");
        
        // Add a chance to find a random item from the treasure pool instead of encountering a monster
        var itemRand = lib.rand(1, 150);
        if(itemRand == 1){
            // Get treasure loot data
            var icon_array = {D: "<:real_black_circle:856189638153338900>", C: "🔵", B: "🟢", A: "🔴", S: "🟡", SS: "🟠", Special: "✨", Vortex: "🌀"};
            var items = lib.readFile("data/items.txt").split(";\n");
            var treasures = lib.readFile("data/treasure_drops.txt").split(";\n");
            var common_drops = treasures[0].split(",");
            var rare_drops = treasures[1].split(",");
            var veryrare_drops = treasures[2].split(",");
            var veryrare_chance = 2;
            var rare_chance = 5 + veryrare_chance;
            
            // Determine results
            var rarity_roll = lib.rand(1, 100);
            var rarity_text = "common";
            if(rarity_roll <= veryrare_chance){
                var drop_pool = veryrare_drops;
                rarity_text = "very rare";
            }else if(rarity_roll <= rare_chance){
                var drop_pool = rare_drops;
                rarity_text = "rare";
            }else{
                var drop_pool = common_drops;
            }
            var drop_roll = lib.rand(0, drop_pool.length - 1);
            var item_key = drop_pool[drop_roll];
            var item = items[item_key].split("|");
            
            // Add it to the inventory
            var inventory = lib.readFile(dir + "/inventory.txt");
            if(inventory !== ""){
                inventory = inventory + "," + item_key;
            }else{
                inventory = inventory + item_key;
            }
            lib.saveFile(dir + "/inventory.txt", inventory);
            
            // Output and end command
            message.reply({ content: "@ __**" + username + "**__, you stumbled upon a hidden chest and found... " + icon_array[item[12]] +"**" + item[0] + "** (" + rarity_text + " treasure)!", allowedMentions: { repliedUser: false }});
            return;
        }
        
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
        
        // Fetch monsters
        var monsters_raw = lib.readFile("data/monsters/monsters" + area + ".txt");
        var monster_groups = monsters_raw.split("#################################################################################\n");
        
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
        var color_modifiers = ["\n", "markdown\n# ", "yaml\n", "glsl\n# ", "fix\n", "fix\n"];
        var embed_colors = ["#b0b0b0", "#0099ff", "#2AA189", "#b80909", "#e3b712", "#e39f0e"];
        var embed_color = embed_colors[chosen_group];
        var color_mod = color_modifiers[chosen_group];
        
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
        
        // Determine shininess
        var shiny_key = 0;
        // Modify chance
        var shiny_chance = 1 + Math.round(parseInt(user_stats[4]) / 20) + radar_bonus;
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
        var monster_info = monsters[monster_key].split("|");
        // Change monster key to accomodate for the area
        monster_key = monster_info[7];
        // Get new info from the main file
        var monster_groups_all = lib.readFile("data/monsters/monsters.txt").split("#################################################################################\n");
        if(lib.readFile(dir + "/monster_mode.txt") == "funny"){monster_groups_all = lib.readFile("data/monsters/monsters_alt.txt").split("#################################################################################\n");}
        var monsters_all = monster_groups_all[chosen_group].split(";\n");
        monster_info = monsters_all[monster_key].split("|");
        var monster_name = monster_info[0];
        
        // Shiny check
        var shiny_extra = "";
        if(shiny_key == 1){
            shiny_extra = "\u2728";
            rarity = rarity + "++";
            monster_name = "Shiny " + monster_name;
            embed_color = "#8f1ee6";
            
            var shinies = lib.readFile("data/monsters/monsters_shiny.txt");
			var shiny_groups = shinies.split("#################################################################################\n");
			var shinies_array = shiny_groups[chosen_group].split(";\n");
			monster_info = shinies_array[monster_key].split("|");
        }
        
        // Minor grammatical check
        var n_extra = "";
        var first_letter = monster_name.substring(0, 1);
        if(first_letter == "A" || first_letter == "E" || first_letter == "I" || first_letter == "O" || first_letter == "U"){
            n_extra = "n";
        }
        
        // Create final monster key group and save encounter
        var monster = chosen_group + "," + monster_key + "," + shiny_key;
        lib.saveFile(dir + "/current_encounter.txt", monster);
        
        // Check if the user has the monster in their previous captures
        var captures = lib.readFile(dir + "/all_captures.txt");
        var capped = "";
        if(captures.includes(monster)){
            capped = "  ( \uD83D\uDCBC )";
        }
		
		// Build buttons
		var button1 = new MessageButton()
			.setCustomId("any|capture")
			.setLabel('Capture')
			.setStyle('PRIMARY')
		var button2 = new MessageButton()
			.setCustomId("any|fight")
			.setLabel('Fight')
			.setStyle('PRIMARY')
		var button3 = new MessageButton()
		    .setCustomId("any|check " + monster)
			.setLabel('Check')
			.setStyle('SECONDARY')
		var button4 = new MessageButton()
			.setCustomId("any|encounter")
			.setLabel('New encounter')
			.setStyle('DANGER')
		var row = new MessageActionRow().addComponents([button1, button2, button3, button4]);
		//var buttonList1 = [button1, button2];
		//var buttonList2 = [button3]
		
        // Output embed
        if(buff_extra !== ""){abilityOutput = "\n" + abilityOutput;}
        var outputEmbed = new Discord.MessageEmbed()
        	.setColor(embed_color)
        	.setTitle("@ __**" + username + "**__")
        	.setThumbnail("https://cdn.discordapp.com/attachments/731848120539021323/" + monster_info[5]) //Alternative source (server): "https://indexnight.com/monsters/" + monster_name.toLowerCase().replace(/ /g, "_") + ".png"
        	.setDescription("```" + color_mod + "A" + n_extra + " " + shiny_extra + monster_name + shiny_extra + " (" + rarity + ") appeared!" + capped + "```" + buff_extra + newInfo + abilityOutput);
		// Real output
		message.reply({ embeds: [outputEmbed], components: [row], allowedMentions: { repliedUser: false } });
		//lib.buttonReply(message, [outputEmbed], buttonList1, buttonList2)     This would make the capture and fight buttons timeout after a while and disable after one click
		
	},
};