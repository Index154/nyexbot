var { prefix } = require('../config.json');

module.exports = {
	name: 'dodaily',
	usages: [''],
	descriptions: ['Attempts to complete your daily quest by delivering the necessary monster'],
    shortDescription: 'Complete the daily quest',
	aliases: ['dd'],
	addendum: 'You can receive additional rewards if you accumulate a daily completion streak!',
    category: 'tasks',
	
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
	    
	    // Check what rank the user is and use / generate the appropriate kind of quest
        var stats = lib.readFile(dir + "/stats.txt").split("|");
        var rank = stats[9];
        
        // Check current day and compare it to the one of the last time the command generated a daily quest
        var last_day = parseInt(lib.readFile("data/daily_quests/current_day_" + rank + ".txt"));
        var d = new Date();
        var day = Math.floor(d.getTime() / 86400000);
        if(last_day != day){
            // Create a new random quest and save it
            // First choose a random main area
            var areaID = lib.rand(1, 13);
            var areaNames = lib.readFile("data/area_names.txt").split(",");
            var areaName = areaNames[areaID];
            // Then get a random monster
            var monsters_raw = lib.readFile("data/monsters/monsters_" + areaID + ".txt");
            var monster_groups = monsters_raw.split("#################################################################################\n");
            var rarities = {"SS": 0, "S": 1, "A": 2, "B": 3, "C": 4, "D": 5};
            var chosen_group = rarities[rank];
            var inverted_ids = [5, 4, 3, 2, 1, 0];
            chosen_group = inverted_ids[chosen_group];
            var monsters = monster_groups[chosen_group].split(";\n");
            var monster_key = lib.rand(0, monsters.length - 2);
            
            // Convert the key into the corresponding main ID
            var monster_data = monsters[monster_key].split("|");
            monster_key = monster_data[7];
            var mon_id = chosen_group + "," + monster_key + ",0";
            
            // Determine reward EXP by monster rarity
            var exp_table = ["100", "150", "200", "250", "300", "500"];
            var exp = exp_table[chosen_group];
            
            // Determine the appropriate vortex based on the quest's rank
            var vortexes = {D: 231, C: 231, B: 232, A: 232, S: 233, SS: 233};
            var vortex = vortexes[rank];
            
            // Pick the daily's reward between Vortex and EXP + Gold randomly
            var quest = "captures|" + mon_id + "|1|stat|exp&gold|" + exp + "|" + areaName + "|";
            var rewardRand = lib.rand(1, 100);
            if(rewardRand <= 33){quest = "captures|" + mon_id + "|1|item|" + vortex + "|1|" + areaName + "|";}
            
            lib.saveFile("data/daily_quests/daily_quest_" + rank + ".txt", quest);
            lib.saveFile("data/daily_quests/current_day_" + rank + ".txt", day);
        }else{
            // Load the already generated daily quest
            var quest = lib.readFile("data/daily_quests/daily_quest_" + rank + ".txt");
        }
        
        // If the user has already completed the daily quest, stop the command
        var dailydata = lib.readFile(dir + "/daily.txt").split("|");
        var streak = parseInt(dailydata[1]);
        var done = parseInt(dailydata[0]);
        if(done == day){
            message.reply({ content: "@ __**" + username + "**__ \u274C You've already completed your daily " + rank + "-Rank quest!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // Further divide the quest into smaller bits of information
        var quest_data = quest.split("|");
        var target_type = quest_data[0];
        var target = quest_data[1];
        var amount = parseInt(quest_data[2]);
        var reward_type = quest_data[3];
        var reward = quest_data[4];
        var reward_amount = parseInt(quest_data[5]);
        var display_text = quest_data[6];
        
        // Further further extract information from the quest data
        var target_name = "";
    	var target_source = "data/monsters/monsters.txt";
    	var inv_path = dir + "/captures.txt";
    	var target_inv = lib.readFile(inv_path);
    	var separator = ";";
    	var monster_keys = target.split(",");
    	
    	monsters_raw = lib.readFile(target_source);
        monster_groups = monsters_raw.split("#################################################################################\n");
        monsters = monster_groups[monster_keys[0]].split(";\n");
        var monster_data = monsters[monster_keys[1]].split("|");
        
        var shiny = "";
        if(monster_keys[2] == "1"){
            shiny = "Shiny ";
        }
        target_name = shiny + monster_data[0];
	    
	    
	    // Attempt to complete the current quest
        // Check if the user has the thing
        if(separator + target_inv + separator.includes(separator + target + separator)) {
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
                    var location = things.indexOf(target);
                    things.splice(location, 1);
                }
                
                // Update streak
                if(day == done + 1){
                    // Streak + 1
                    streak++;
                }else{
                    // Streak lost
                    streak = 0;
                }
                
                // Give a streak reward if a certain number of days has been reached
                var streakInfo = "\nYour current daily streak is " + streak;
                var streakReward = "";
                switch(parseInt(streak)){
                    case 7:
                        // 7 day streak
                        streakInfo = "\nYou have reached a streak of 7! Your reward is one [Monster Token] and a [Special Vortex (Common)]!";
                        streakReward = "351,340";
                        break;
                    case 14:
                        // 14 day streak
                        streakInfo = "\nYou have reached a streak of 14! Your reward is one [Monster Token] and a [Special Vortex (Rare)]!";
                        streakReward = "352,340";
                        break;
                    case 21:
                        // 21 day streak
                        streakInfo = "\nYou have reached a streak of 21! Your reward is one [Monster Token] and a [Special Vortex (Rare)]!";
                        streakReward = "352,340";
                        break;
                    case 30:
                        // Max streak (resets streak to 0)
                        streakInfo = "\nYou have reached a streak of 30! Your reward is one [Monster Token] and a [Special Vortex (Ultra rare)]!\nYour streak has been reset to 0!";
                        streakReward = "353,340";
                        streak = 0;
                        break;
                    default:
                        // Do nothing
                }
                
                // Give streak reward
                if(lib.exists(streakReward)){
                    if(target_type == "inventory"){
                        // Since we are already modifying the inventory, just add the reward to the existing array and save it at the end
                        streakReward = streakReward.split(",");
                        things.push(streakReward[0]);
                        things.push(streakReward[1]);
                    }else{
                        item_list = lib.readFile("data/items.txt").split(";\n");
                        inventory = lib.readFile(dir + "/inventory.txt");
                        if(lib.exists(inventory)){
                            inventory += ",";
                        }
                        inventory += streakReward;
                        if(reward_type != "item"){
                            // If we are going to modify it again with the normal reward then don't save it yet
                            lib.saveFile(dir + "/inventory.txt", inventory);
                        }
                    }
                }
                
                // Give the user their reward
                var levelup_extra = "";
                var trophy_extra = "";
                if(reward_type == "item"){
                    // The reward is an item - Add it to the inventory
                    if(target_type == "inventory"){
                        // Since we are saving the array later, just add the reward and do nothing else
                        for(y = 0; y < reward_amount; y++){
                            things.push(reward);
                        }
                        inventory = target_inv;
                    }else if(lib.exists(streakReward)){
                        // Since we have modified the inventory with a streak reward but it won't be saved at the end, add the reward and save it
                        inventory += "," + reward;
                        lib.saveFile(dir + "/inventory.txt", inventory);
                    }else{
                        item_list = lib.readFile("data/items.txt").split(";\n");
                        inventory = lib.readFile(dir + "/inventory.txt");
                        for(y = 0; y < reward_amount; y++){
                            if(lib.exists(inventory)){
                                inventory += ",";
                            }
                            inventory += reward;
                        }
                        lib.saveFile(dir + "/inventory.txt", inventory);
                    }
                    var reward_item_data = item_list[reward].split("|");
                    var reward_name = reward_item_data[0];
                    
                }else{
                    // The reward is a stat upgrade - Add it to the user's stats
                    var stats = lib.readFile(dir + "/stats.txt").split("|");
                    // For daily quests, we need to do it differently since it gives both exp and gold
                    if(reward == "exp&gold"){
                        var gold = reward_amount * 2;
                        stats[11] = parseInt(stats[11]) + reward_amount;
                        stats[12] = parseInt(stats[12]) + gold;
                    }else{
                        var base = parseInt(stats[reward]);
                        stats[reward] = base + reward_amount;
                    }
                    
                    // If the reward is experience, check for levelups!
                    if(reward == "11" || reward == "exp&gold"){
                        var levels = lib.readFile("data/level_reqs.txt").split(",");
                        var levelCheckResults = lib.levelCheck(levels, stats, levelup_extra, prefix, dir);
                        levelup_extra = levelCheckResults.levelup_extra;
                        stats = levelCheckResults.stats;
                        trophy_extra = levelCheckResults.trophy_extra;
                        
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
                    }
                    
                    var reward_names = ["Error", "Attack", "Speed", "Capture Efficiency", "Monster Luck", "Item Luck", "Greater Item Luck", "Error", "Error", "Error", "Error", "EXP"];
                    if(reward == "exp&gold"){
                        reward_name = "EXP] & " + gold + " [Gold";
                    }else{
                        reward_name = reward_names[reward];
                    }
                    
                    lib.saveFile(dir + "/stats.txt", stats.join("|"));
                }
                
                // Save main target inventory
                lib.saveFile(inv_path, things.join(separator));
                
                // Update the user's quest
                lib.saveFile(dir + "/daily.txt", day + "|" + streak);
                if(trophy_extra !== "" && levelup_extra !== ""){trophy_extra = "\n" + trophy_extra;}
                message.reply({ content: "@ __**" + username + "**__, you've completed the quest! As a reward you got... ```\n" + reward_amount + " [" + reward_name + "]" + streakInfo + "```" + levelup_extra + trophy_extra, allowedMentions: { repliedUser: false }});
            
            }else{
                message.reply({ content: "@ __**" + username + "**__ \u274C You don't have enough of the necessary item or monster!", allowedMentions: { repliedUser: false }});
            }
        }else{
            message.reply({ content: "@ __**" + username + "**__ \u274C You don't have the necessary item or monster!", allowedMentions: { repliedUser: false }});
        }
	},
};