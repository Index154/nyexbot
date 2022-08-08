var { prefix } = require('../config.json');

module.exports = {
	name: 'release',
	usages: ['[number] [monster name]'],
	descriptions: ['Releases one or more monsters from your captures in exchange for a buff'],
	
	execute(message, user, args) {
	    var allArgs = args.join(" ");
        
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
            message.reply({ content: "\u274C Use `" + prefix + "encounter` first to create an account!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // Check if the first argument is a number
        var loop_count = 1;
        var first_arg = args[0].replace(/[^0-9]/g, "");
        if(first_arg !== ""){
            loop_count = parseInt(first_arg);
            args.splice(0,1);
            allArgs = args.join(" ");
        }
        
        // Get all of the user's captures
        var captures = lib.readFile(dir + "/captures.txt");
        var monsters = lib.readFile("data/monsters/monsters.txt");
		var monster_groups = monsters.split("#################################################################################\n");
		
        if(lib.exists(captures)){
            if(captures.includes(";")){
                var monster_key_groups = captures.split(";");
            }else{
                var monster_key_groups = [captures];
            }
        }else{
			message.reply({ content: "You have no monsters yet!", allowedMentions: { repliedUser: false }});
			return;
		}
		
        // Go through the monster names and join them into a list
		var monster_names2 = "";
		var key_count = monster_key_groups.length;
		for(i = 0; i < key_count; i++){
			var keys = monster_key_groups[i].split(",");
			var shiny_2 = "";
			if(keys[2] == "1"){shiny_2 = "Shiny ";}
			var monsters_array = monster_groups[keys[0]].split(";\n");
			var selected_monster = monsters_array[keys[1]];
			var monster_values = selected_monster.split("|");
			var monster_name = monster_values[0];
			
			if(i > 0){
				monster_names2 = monster_names2 + "|";
			}
			monster_names2 = monster_names2 + shiny_2 + monster_name;
		}
        
        // Look for the user's input in their captures
        if(allArgs.length > 0){
			// There was an argument so check if it matches a monster
			allArgs = allArgs.toLowerCase();
			var monster_names_lower = "|" + monster_names2.toLowerCase() + "|";
			
			// Check if the search can be matched to a monster in the user's possession
			if(monster_names_lower.includes(allArgs)){
				// If the argument was "random", get a random monster
				// First try searching for exact matches. If there is no match, search  for any matches
				var key = 0;
				if(monster_names_lower.includes("|" + allArgs + "|")){
					var monster_names_array = monster_names_lower.split("|");
					key = monster_names_array.indexOf(allArgs) - 1;
				}else{
					var split = monster_names_lower.split(allArgs);
					var left_side = split[0].replace(/[^|]/g, "");
					key = left_side.length - 1;
				}
				
				var result_keys = monster_key_groups[key].split(",");
				var result_keys_raw = monster_key_groups[key];
				var monsters_array = monster_groups[result_keys[0]].split(";\n");
				// The monster's data has been retrieved!
				var result_monster = monsters_array[result_keys[1]];
                var monster_data = result_monster.split("|");
                
                //Determine the buff data to use depending on monster
                var buff_data = monster_data[6].split(",");
                var buff_type = buff_data[0];
                var buff_value = parseInt(buff_data[1]);
                var buff_timer = parseInt(buff_data[2]);
                
                //Modify things if the monster is shiny
                var monster_name = monster_data[0];
                if(result_keys[2] == "1"){
                    monster_name = "Shiny " + monster_data[0];
                    buff_value = buff_value * 10;
                    buff_timer = buff_timer * 10;
                }
                
                //Check if the user gave a number as well. If so, check if they have that many monsters. Also do the removing and buffing as often as requested
                //If the number is too high or low, stop the command
                if(loop_count > 5 || loop_count < 1){
                    message.reply({ content: "\u274C You can only release between 1 and 5 monsters at a time!", allowedMentions: { repliedUser: false }});
                    return;
                }
                
                //Count monsters given
                var adc  = require('adc.js');
                var mon_counts = new adc(monster_key_groups).count();
                var mon_count = mon_counts[monster_key_groups[key]];
                    
                //If the user doesn't have enough monsters, end the program
                if(mon_count < loop_count){
                    message.reply({ content: "\u274C You don't have enough of that monster!", allowedMentions: { repliedUser: false }});
                    return;
                }
                
                var new_buff = ["Release Blessing", 0, 0, 0, 0, 0, 0, 0, 0, "Buff description placeholder", "Item,"];
                var buff = 0;
                var duration = 0;
                for(i = 0; i < loop_count; i++){
                    //Add up buffs
                    buff = buff + buff_value;
                    duration = duration + buff_timer;
                    
                    //Remove the monster from the captures list
                    monster_key_groups.splice(monster_key_groups.indexOf(result_keys_raw), 1);
                }
                
                // Adjust buffs for updated max release count of 5
                buff = buff * 2;
                duration = duration * 2;
                
                // Adjust buffs for item luck and greater item luck rebalance
                if(buff_type == "5" || buff_type == "6"){
                    buff = buff * 2;
                }
                
                // Save updated captures list
                lib.saveFile(dir + "/captures.txt", monster_key_groups.join(";"));
                
                // Check if there was already another buff active. If so then remove it from the user's stats further down
                var current_buff = lib.readFile(dir + "/current_buff.txt");
                if(current_buff !== ""){
                    var buff_stats = current_buff.split("|");
                }else{
                    var buff_stats = ["Non", 0, 0, 0, 0, 0, 0, 0, 0, "Special", "Charge,0"];
                }
                
                // Save buff to file
                new_buff[buff_type] = buff;
                new_buff[10] = "Item," + duration;
                lib.saveFile(dir + "/current_buff.txt", new_buff.join("|"));
                
                //Update the user's stats
                var stats = lib.readFile(dir + "/stats.txt").split("|");
                for(y = 1; y < 7; y++){
                    var base = parseInt(stats[y]);
                    var minus = parseInt(buff_stats[y]);
                    var plus = parseInt(new_buff[y]);
                    stats[y] = base - minus + plus;
                }       
                lib.saveFile(dir + "/stats.txt", stats.join("|"));
                
                // Output
                message.reply({ content: "You successfully released **" + monster_name + "** x " + loop_count + " and were granted a temporary blessing!", allowedMentions: { repliedUser: false }});
                
			}else{
			    message.reply({ content: "\u274C That monster could not be found in your captures!", allowedMentions: { repliedUser: false }});
			}
			
        }else{
            message.reply({ content: "\u274C Please include the monster you want to release!", allowedMentions: { repliedUser: false }});
        }
	},
};