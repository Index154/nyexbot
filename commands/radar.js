var { prefix } = require('../config.json');

module.exports = {
	name: 'radar',
	usages: [''],
	descriptions: ['Activates or deactivates the radar buff. Also claims your daily charges if eligible'],
	aliases: ['rad'],
	addendum: 'Can only be used after reaching level 5',
    category: 'tasks',
	
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
        var stats = lib.readFile(dir + "/stats.txt").split("|");
        if(parseInt(stats[10]) < 5){
            message.reply({ content: "\u274C You must be at least **level 5** to use this command!\nYour current level is " + stats[10], allowedMentions: { repliedUser: false }});
            return;
        }
        
        // Check if there was already another buff active. If so then remove it from the user's stats further down
        var current_buff = lib.readFile(dir + "/current_buff.txt");
        if(current_buff !== ""){
            var buff_stats = current_buff.split("|");
        }else{
            var buff_stats = [0, 0, 0, 0, 0, 0, 0, 0, 0, "Not special", "Item,1"];
        }
        // If the user already has their radar active, deactivate it
        if(buff_stats[0] == "Monster Radar"){
            message.reply({ content: "You deactivated your monster radar!", allowedMentions: { repliedUser: false }});
            lib.saveFile(dir + "/current_buff.txt", "");
            return;
        }
        
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
        
        // Determine amount of charges and output
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
        var out = "You activated your Monster Radar! You have **" + charges+ "** charge" + special_s + " remaining!```\nYour daily charges have already been claimed```";
        if(current_day != last_day){
            // The user hasn't claimed their daily charges yet
            // If the user still has some charges left, don't claim their daily charges yet
            if(charges < 1){
                charges = 40;
                // If the user is a Tamer over level 30, give them extra charges
                if(stats[0] == "Tamer" && parseInt(stats[10]) >= 30){charges = 50;}
                
                out = "You activated your Monster Radar!```\nYou claimed your " + charges + " daily charges!```";
                lib.saveFile(dir + "/charges.txt", charges);
                lib.saveFile(dir + "/daily_radar.txt", current_day);
            }else{
                out = "You activated your Monster Radar! You have **" + charges + "** charge" + special_s + " remaining!```\nYou can claim your daily charges after using up all of your current charges```";
            }
        }else{
            // End command if the remaining charges are 0 and there are none to claim
            if(charges == "0"){
                message.reply({ content: "\u274C You have no more charges left!", allowedMentions: { repliedUser: false }});
                return;
            }
        }
        
        // Add fullradar info, only if the user is eligible for using it
        if(parseInt(stats[10]) > 15){
            var cost = Math.round(charges * 2.5);
            out = out + "Use `" + prefix + "fullradar` to channel all of your charges into a single encounter (costs **" + cost + "** Gold)";
        }
        
        // Save completion values for encounter modifiers
        lib.saveFile(dir + "/radar_values.txt", quest_progress + "," + mon_progress);
        
        // Set values to be saved in the buff file and save them
        var new_item_data = ("Monster Radar|0|0|0|0|0|0|0|0|Special|Special," + charges).split("|");
        lib.saveFile(dir + "/current_buff.txt", "Monster Radar|0|0|0|0|0|0|0|0|Special|Special," + charges);
        
        // Update the user's stats
        // Remove old item's values from the user's stats and add the new item's stats
        for(y = 1; y < 7; y++){
            var base = parseInt(stats[y]);
            var minus = parseInt(buff_stats[y]);
            var plus = parseInt(new_item_data[y]);
            stats[y] = base - minus + plus;
        }       
        lib.saveFile(dir + "/stats.txt", stats.join("|"));
        
        // Output
        message.reply({ content: out, allowedMentions: { repliedUser: false }});
        
	},
};