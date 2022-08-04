var { prefix } = require('../config.json');

module.exports = {
	name: 'deliver',
	usages: [''],
	descriptions: ['Attempts to complete your current main quest by removing the required item or monster from you'],
	aliases: ['doquest'],
	
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
	    
	    // Get user's current main quest
        var quest_list_raw = lib.readFile("data/quests.txt");
        var quest_list = quest_list_raw.split(";\n");
        var quest_count = quest_list.length;
        var quest_id = lib.readFile(dir + "/current_quest.txt");
        // If the user has finished the final quest, cancel the command
        if(quest_id == quest_count){
            message.reply({ content: "@ __**" + username + "**__ \u274C You've already completed every quest there is!", allowedMentions: { repliedUser: false }});
            return;
        }
        var quest = quest_list[quest_id];
        
        // Further divide the quest into smaller bits of information
        var quest_data = quest.split("|");
        var target_type = quest_data[0];
        var target = quest_data[1];
        var amount = parseInt(quest_data[2]);
        var reward_type = quest_data[3];
        var reward = quest_data[4];
        var reward_amount = parseInt(quest_data[5]);
        var reward_text = quest_data[7].replace(/{prefix}/g, prefix).replace(/\\n/g, "\n");
        
        // Further further extract information from the quest data
        var target_name = "";
        var stats = lib.readFile(dir + "/stats.txt").split("|");
        if(target_type == "inventory"){
        	var target_source = "data/items.txt";
        	var inv_path = dir + "/inventory.txt";
        	var target_inv = lib.readFile(inv_path);
        	var separator = ",";
        	
        	var item_list = lib.readFile(target_source).split(";\n");
        	var item_data = item_list[target].split("|");
        	
        	target_name = item_data[0];
        }else if(target_type == "materials"){
        	var target_source = "data/items.txt";
        	var inv_path = dir + "/materials.txt";
        	var target_inv = lib.readFile(inv_path);
        	var separator = ",";
        	
        	var item_list = lib.readFile(target_source).split(";\n");
        	var item_data = item_list[target].split("|");
        	
        	target_name = item_data[0];
        }else if(target_type == "captures"){
        	var target_source = "data/monsters/monsters.txt";
        	var inv_path = dir + "/captures.txt";
        	var target_inv = lib.readFile(inv_path);
        	var separator = ";";
        	var monster_keys = target.split(",");
        	
        	var monsters_raw = lib.readFile(target_source);
            var monster_groups = monsters_raw.split("#################################################################################\n");
            var monsters = monster_groups[monster_keys[0]].split(";\n");
            var monster_data = monsters[monster_keys[1]].split("|");
            
            var shiny = "";
            if(monster_keys[2] == "1"){
                shiny = "Shiny ";
            }
            target_name = shiny + monster_data[0];
        }else{
            // Special equipment check quest with its own procedure
            // Check if all of the user's equipment items are at least the same as their own rank
            var rankValues = {E: -1, D: 0, C: 1, B: 2, A: 3, S: 4, SS: 5};
            var targetValue = rankValues[stats[9]];
            var equipment = lib.readFile(dir + "/equipment.txt").split(",");
            var equipCheck = true;
            var items = lib.readFile("data/items.txt").split(";\n");
            for(i = 0; i < equipment.length; i++){
                // Get equipment item rank
                var equipData = items[equipment[i]].split("|");
                if(rankValues[equipData[12]] < targetValue){equipCheck = false;}
            }

            if(equipCheck){
                // The quest succeeded. The reward is a rank upgrade so increase the user's rank accordingly and change the output
                var ranks = {D: "C", C: "B", B: "A", A: "S", S: "SS"};
                stats[9] = ranks[stats[9]];
                reward_amount = "";
                reward_name = "A Rank promotion! You are now Rank " + stats[9] + "!";
                lib.saveFile(dir + "/stats.txt", stats.join("|"));
                
                // Advance to next quest
                quest_id = parseInt(quest_id);
                var next_quest = quest_id + 1;
                lib.saveFile(dir + "/current_quest.txt", next_quest);
            }else{
                message.reply({ content: "@ __**" + username + "**__ \u274C Your equipment items are not of a high enough rank!\nAll three need to be **at least the same as your current rank**", allowedMentions: { repliedUser: false }});
                return;
            }
        }
	    
	    // Attempt to complete the current quest
        // Check if the user has the thing
        var levelup_extra = "";
        var trophy_extra = "";
        if(target_type != "rank" && (separator + target_inv + separator).includes(separator + target + separator)) {
            // Count the thing
            if(target_inv.includes(separator)){
                var things = target_inv.split(separator);
            }else{
                var things = [target_inv];
            }
            var adc  = require('adc.js');
            var counted_things = new adc(things).count();
            var count = counted_things[target];
            
            // Check if the user has enough for the quest
            if(count >= amount){
                // Remove the required amount from the user's captures / inventory
                for(i = 0; i < amount; i++){
                    // Remove the thing from the inventory
                    things.splice(things.indexOf(target), 1);
                }
                lib.saveFile(inv_path, things.join(separator));
                
                // Give the user their reward
                if(reward_type == "item"){
                    // The reward is an item - Add it to the inventory
                    if(target_type == "inventory"){
                        for(y = 0; y < reward_amount; y++){
                            target_inv = target_inv + "," + reward;
                        }
                        inventory = target_inv;
                    }else{
                        item_list = lib.readFile("data/items.txt").split(";\n");
                        inventory = lib.readFile(dir + "/inventory.txt");
                        for(y = 0; y < reward_amount; y++){
                            if(inventory !== "" && inventory !== undefined){
                                inventory = inventory + ",";
                            }
                            inventory = inventory + reward;
                        }
                    }
                    var reward_item_data = item_list[reward].split("|");
                    var reward_name = " [" + reward_item_data[0] + "]";
                    lib.saveFile(dir + "/inventory.txt", inventory);
                    
                }else{
                    // The reward is a stat upgrade - Add it to the user's stats
                    // If the reward is experience, check for a levelup
                    if(reward == "11" || reward == "exp&gold"){
                        stats[11] = parseInt(stats[11]) + reward_amount;
                        if(reward == "exp&gold"){var gold = Math.round(reward_amount * 1.5); stats[12] = parseInt(stats[12]) + gold;}
                        
                        var levels = lib.readFile("data/level_reqs.txt").split(",");
                        var levelCheckResults = lib.levelCheck(levels, stats, levelup_extra, prefix, dir);
                        levelup_extra = levelCheckResults.levelup_extra;
                        stats = levelCheckResults.stats;
                        trophy_extra = levelCheckResults.trophy_extra;
                    }else{
                        var base = parseInt(stats[reward]);
                        stats[reward] = base + reward_amount;
                    }
                    
                    var reward_names = ["Error", "Attack", "Speed", "Capture Efficiency", "Monster Luck", "Item Luck", "Greater Item Luck", "Error", "Error", "Rank", "Error", "EXP", "Gold", "Stat Points"];
                    if(reward == "exp&gold"){
                        reward_name = " [EXP] & " + gold + " [Gold]";
                    }else{
                        reward_name = " [" + reward_names[reward] + "]";
                    }
   
                    lib.saveFile(dir + "/stats.txt", stats.join("|"));
                }

            }else{
                message.reply({ content: "@ __**" + username + "**__ \u274C You don't have enough of the necessary item or monster!\n(" + count + "/" + amount + ")", allowedMentions: { repliedUser: false }});
                return;
            }
        }else if(target_type != "rank"){
            message.reply({ content: "@ __**" + username + "**__ \u274C You don't have the necessary item or monster!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // Give a levelup trophy if necessary
        var trophies = lib.readFile(dir + "/trophies.txt");
        if(trophy_extra !== ""){
            var trophy_data = trophy_extra.split("|");
            var trophy_ranks = {"10": "D", "20": "C", "30": "B", "40": "A", "50": "S", "60": "SS", "70": "SS", "80": "SS", "90": "SS", "100": "SS"};
            var trophy_weights = {"10": "44", "20": "43", "30": "42", "40": "41", "50": "40", "60": "39", "70": "38", "80": "37", "90": "36", "100": "35"};
            var new_trophy = trophy_weights[trophy_data[1]] + "|" + "Level" + "|" + trophy_ranks[trophy_data[1]] + "|**EXP Collector** - Reached level " + trophy_data[1];
            
            if(trophies === "" || trophies === undefined){
                trophies = new_trophy;
            }else{
                trophies = trophies + ";\n" + new_trophy;
            }
            trophy_extra = trophy_data[0];
        }
        
        // Update the user's quest
        quest_id = parseInt(quest_id);
        var next_quest = quest_id + 1;
        lib.saveFile(dir + "/current_quest.txt", next_quest);
        
        // Check previous as well as new quest completion
        var quests = lib.readFile("data/quests.txt").split(";\n");
		var quest_total = quests.length;
		var quest_progress_old = parseInt((Math.round((quest_id / quest_total) * 1000)) / 10);
		var quest_progress_new = parseInt((Math.round(((quest_id + 1) / quest_total) * 1000)) / 10);
		// Check which trophy would be next for the player to unlock and check if they passed that milestone with this quest
		var milestones = [25, 50, 75, 100];
		var nextMilestone = 0;
		for(i = 0; i < milestones.length && nextMilestone === 0; i++){
		    if(milestones[i] > quest_progress_old){nextMilestone = milestones[i];}
		}

		if(quest_progress_new >= nextMilestone){
		    // Grant trophy based on milestone
		    var trophy_ranks = {25: "C", 50: "B", 75: "A", 100: "S"};
            var trophy_weights = {25: "39", 50: "38", 75: "37", 100: "36"};
            var rankIcons = {25: "\uD83D\uDD35", 50: "\uD83D\uDFE2", 75: "\uD83D\uDD34", 100: "\uD83D\uDFE1"};
            var new_trophy = trophy_weights[nextMilestone] + "|" + "Quest" + "|" + trophy_ranks[nextMilestone] + "|**Quest Completionist** - Completed " + nextMilestone + "% of all quests";
            
            if(trophies === "" || trophies === undefined){
                trophies = new_trophy;
            }else{
                trophies = trophies + ";\n" + new_trophy;
            }
            var rankIcon = rankIcons[nextMilestone];
            if(trophy_extra !== ""){trophy_extra += "\n";}
            trophy_extra += "You've also received the trophy **\uD83D\uDCAC" + rankIcon + "Quest Completionist**!";
		}
		
		// Save trophies
		if(trophy_extra !== ""){
		    lib.saveFile(dir + "/trophies.txt", trophies);
		}
		
		// Adjust stuff
        if(levelup_extra !== ""){trophy_extra = "\n" + trophy_extra; reward_text = "\n" + reward_text;}
        else if(trophy_extra !== ""){reward_text = "\n" + reward_text;}
        if(next_quest != quest_count){
            // Button output
            var button1 = new MessageButton()
    			.setCustomId("any|quest")
    			.setLabel('Next quest')
    			.setStyle('SUCCESS');
    		var row = new MessageActionRow().addComponents([button1]);
            message.reply({ content: "@ __**" + username + "**__, you've completed the quest! As a reward you got... ```\n" + reward_amount + reward_name + "```" + levelup_extra + trophy_extra + reward_text, components: [row], allowedMentions: { repliedUser: false }});
            return;
        }
        
        // Regular output
        message.reply({ content: "@ __**" + username + "**__, you've completed the quest! As a reward you got... ```\n" + reward_amount + reward_name + "```" + levelup_extra + trophy_extra + reward_text, allowedMentions: { repliedUser: false }});
	    
	},
};