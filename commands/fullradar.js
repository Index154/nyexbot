var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'fullradar',
	usages: [''],
	descriptions: ['Channels all your radar charges into one encounter in exchange for Gold, increasing the shiny chance significantly. Also claims your daily charges if eligible'],
    shortDescription: 'Use all radar charges instantly for Gold (level 15 required)',
    weight: 10,
    addendum: [
        '- Can only be used after reaching level 15',
        '- Provides a slightly higher shiny chance gain per charge when compared to the normal `{prefix}radar`',
        '- Displays your mathematical chance of having encountered a shiny after use',
        '- It costs 2.5 Gold per charge',
        '- See `{prefix}radar` for further information'
    ],
	aliases: ['frad'],
    category: 'misc',
	
	execute(message, user, args) {
	    
        // Check if the server has a custom prefix and load it
        if(message.guild !== null){
            var serverID = message.guildId;
            if(fs.existsSync("./data/configs/" + serverID)){
                prefix = lib.readFile("./data/configs/" + serverID + "/prefix.txt");
            }
        }
        
        function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
        }
        
        // Set important variables
        var username = user.username;
        var dir = "userdata/" + user.id;
        
        // If the user isn't registered yet, stop the command
        if(!fs.existsSync(dir)){
            message.reply({ content: "\u274C Use `" + prefix + "encounter` first to create an account!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // If the user is below level 15, stop the command
        var user_stats = lib.readFile(dir + "/stats.txt").split("|");
        if(parseInt(user_stats[10]) < 15){
            message.reply({ content: "\u274C You must be at least **level 15** to use this command!\nYour current level is " + user_stats[10], allowedMentions: { repliedUser: false }});
            return;
        }
        
        // Claim the daily charges if possible
        var today = new Date();
        var first = new Date(today.getFullYear(), 0, 1);
        var current_day = Math.round(((today - first) / 1000 / 60 / 60 / 24) + .5, 0);
        var last_day = parseInt(lib.readFile(dir + "/daily_radar.txt"));
        var charges = parseInt(lib.readFile(dir + "/charges.txt"));
        // Minor grammar change
        var special_s = "s";
        if(charges == "1"){
            special_s = "";
        }
        var claimed = "";
        if(current_day != last_day){
            // The user hasn't claimed their daily charges yet
            // If the user still has some charges left, don't claim their daily charges yet
            if(charges < 1){
                charges = 40;
                // If the user is a Tamer over level 30, give them extra charges
                if(user_stats[0] == "Tamer" && parseInt(user_stats[10]) >= 30){charges = 50;}
                
                claimed = "Your daily charges have been claimed and used in the process";
                lib.saveFile(dir + "/charges.txt", charges);
                lib.saveFile(dir + "/daily_radar.txt", current_day);
            }else{
                claimed = "You may still claim your daily charges";
            }
        }
        
        // Check if the user has enough Gold to use the command
        if(charges === undefined || charges === "" || charges == "0"){
            message.reply({ content: "\u274C You have no radar charges!", allowedMentions: { repliedUser: false }});
            return;
        }
        var cost = Math.round(charges * 2.5);
        if(cost > parseInt(user_stats[12])){
            message.reply({ content: "\u274C It costs **" + cost + "** Gold to use up " + charges + " radar charges at once!\nYour **" + user_stats[12] + "** Gold is insufficient!", allowedMentions: { repliedUser: false }});
            return;
        }
        var charges_copy = charges;
        
        // If the user has an active radar buff then remove it
        var current_buff = lib.readFile(dir + "/current_buff.txt");
        if(current_buff !== ""){
            var buff_stats = current_buff.split("|");
        }else{
            var buff_stats = ["Fake Buff", 0, 0, 0, 0, 0, 0, 0, 0, "Not special", "Item,1"];
        }
        if(buff_stats[9] == "Special"){
            lib.saveFile(dir + "/current_buff.txt", "");
        }
        
        // Get current area path
        var area = "_" + lib.readFile(dir + "/area.txt");
        if(area == "_"){area = "_0";}
        
        // Remove the required Gold
        user_stats[12] = parseInt(user_stats[12]) - cost;
        lib.saveFile(dir + "/stats.txt", user_stats.join("|"));
        
        // Remove all charges
        lib.saveFile(dir + "/charges.txt", "0");
        
        // Determine radar bonus
        // Get total monster and quest counts
        var mons = lib.readFile("data/monsters/monsters.txt").split(";\n");
		var quests = lib.readFile("data/quests.txt").split(";\n");
		var mon_total = mons.length - 1;
		var quest_total = quests.length;
		
		// Get the count of completed quests and completion percentage
		var quest_num = parseInt(lib.readFile(dir + "/current_quest.txt"));
		var quest_progress = (quest_num / quest_total) * 100;
		
		// Get a full list of previously captured monsters
		var captures = lib.readFile(dir + "/all_captures.txt");
		var mon_progress = 1;
		if(captures.includes(";")){
			var monster_key_groups = captures.split(";");
		}else if(captures !== ""){
			var monster_key_groups = [captures];
		}else{
			mon_progress = 0;
			var mon_num = 0;
		}
        
        if(mon_progress !== 0){
		    
			// Remove shiny IDs from monsters
			var keys = "";
			for(i = 0; i < monster_key_groups.length; i++){
				keys = monster_key_groups[i];
				monster_key_groups[i] = keys.slice(0, -2);
			}
			
			// Remove duplicate monsters and get the completion percentage
			var monster_key_groups_uniq = monster_key_groups.filter(onlyUnique);
			var mon_num = monster_key_groups_uniq.length;
			mon_progress = (Math.round((mon_num / mon_total) * 1000)) / 10;
			
		}
        
        // Apply the radar bonus to the upcoming rolls
        var quest_bonus = 20 * (parseInt(quest_progress) * 0.01);
        var mon_bonus = 30 * (parseInt(mon_progress) * 0.01);
        var radar_bonus = Math.round(quest_bonus + mon_bonus);
        
        // Nerf the radar charges if they go above certain amounts
        if(charges > 100){
            charges = Math.round((charges - 100) * 0.5) + 100;
            charges_copy = charges;
        }
        
        // Roll for shininess until a shiny is encountered or all charges are used up
        var shiny_key = 0;
        var shiny_chance = 1 + Math.round(parseInt(user_stats[4]) / 20) + radar_bonus + 1;
        if(shiny_chance < 1){shiny_chance = 1;}
        var roll_count = 0;
        while(charges > 0 && shiny_key === 0){
            //Determine shininess
            var mod_rand = lib.rand(1, 40000);
            charges--;
            roll_count++;
            if(mod_rand <= shiny_chance){
                shiny_key = 1;
            }
        }
        
        // Calculate the true chance
        var no_shiny = 1 - (shiny_chance / 40000);
        var no_shinies = no_shiny ** charges_copy;
        var real_shiny = Math.round((1 - no_shinies) * 100000) / 1000;
        
        // Fetch monsters
        var monsters_raw = lib.readFile("data/monsters/monsters" + area + ".txt");
        var monster_groups = monsters_raw.split("#################################################################################\n");
        
        // Set monster group data
        var m_luck = parseInt(user_stats[4]);
        var rarities = [5, 10, 20, 40, 200];
        var rarity_names = ["Rank SS", "Rank S", "Rank A", "Rank B", "Rank C", "Rank D"];
        // Modify rarity chances based on monster luck
        var limit = 1000;
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
        if(buff_stats[0].includes("Lure")){
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
        monster_key = monster_info[7];
        // Get new info from the main file
        var monster_groups_all = lib.readFile("data/monsters/monsters.txt").split("#################################################################################\n");
        var monsters_all = monster_groups_all[chosen_group].split(";\n");
        monster_info = monsters_all[monster_key].split("|");
        var monster_name = monster_info[0];
        
        // Shiny check
        var shiny_extra = "";
        if(shiny_key == 1){
            shiny_extra = "\u2728";
            rarity = rarity + "++";
            color_mod = "ruby\n";
            n_extra = "";
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
        
        // Check if the user has the monster in their captures
        var captures = lib.readFile(dir + "/all_captures.txt");
        var capped = "";
        if(captures.includes(monster)){
            capped = "  ( \uD83D\uDCBC )";
        }
        
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
		    .setCustomId("any|check " + monster)
			.setLabel('Check')
			.setStyle(2)
		var row = new ActionRowBuilder().addComponents([button1, button2, button3]);
        
        // Output embed
        var outputEmbed = new Discord.EmbedBuilder()
        	.setColor(embed_color)
        	.setTitle("@ __**" + username + "**__")
        	.setThumbnail("https://cdn.discordapp.com/attachments/731848120539021323/" + monster_info[5])
        	.setDescription("```" + color_mod + "A" + n_extra + " " + shiny_extra + monster_name + shiny_extra + " (" + rarity + ") appeared!" + capped + "```All of your radar charges have been used up in exchange for **" + cost + "** Gold!\nThe shiny chance was **" + real_shiny + "%**!\n" + claimed);
        message.reply({ embeds: [outputEmbed], components: [row], allowedMentions: { repliedUser: false }});
        
	},
};