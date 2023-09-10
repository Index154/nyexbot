var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'stats',
	usages: ['', '[number] [stat name]', 'user [ID or username]', 'user random'],
	descriptions: ['Displays your stats', 'Assigns stat points to one of your stats', 'Displays the stats of a different user', 'Displays the stats of a random user'],
    shortDescription: 'Check a user\'s stats and assign stat points',
    weight: 15,
    addendum: [
        '- You can temporarily alter your stats with `{prefix}use`',
        '- Temporary stat changes are shown in parentheses behind the stat totals',
        '- Completing a `{prefix}quest` can grant you stat points',
        '- Your stats are affected by your current equipment',
        '\n**Here are some details about the available stats**',
        '- Attack (Defense) and Speed (Weight): These determine your chances of winning a `{prefix}fight`. Having higher Attack than Speed will make you start with more HP in realms while having higher Speed than Attack will increase the amount of Gold you get from monsters',
        '- Mana: Determines your chances of succeeding a `{prefix}capture`',
        '- Monster Luck: Increases your chance of encountering rarer monsters',
        '- Drop Luck: Increases your chance of obtaining drops from fights',
        '- Rare Luck: Makes rarer item drops more common and common item drops rarer. Does not affect the overall amount of drops you get!',
        '- Rank: At higher ranks you will encounter higher-ranked monsters a lot more frequently',
        '- Stat points can only be assigned to Attack, Speed, Mana, Monster Luck, Drop Luck and Rare Luck '
    ],
    category: 'userinfo',
	
	execute(message, user, args, prefix) {
	    var allArgs = args.join(" ");
        
        // Set important variables
        var username = user.username;
        var dir = "userdata/" + user.id;
        
        // If the user entered the argument "user" and a second argument to go along with it, try to match the input to another user
        if(args[0] == "user" && args[1] !== undefined){
            // Tried to find another user
            // Get user ID list
            var files = fs.readdirSync("userdata");
            files = files + "";
            files = files.split(",");
            if(parseInt(args[1]) > 1 && args[1].length > 12){
                // An ID was used. Check if it matches one of the users
                for(i = 0; i < files.length; i++){
                    if(files[i] == args[1]){
                        // Use the matched user's data instead of the command user
                        dir = "userdata/" + args[1];
                        username = lib.readFile(dir + "/username.txt");
                    }
                }
            }else{
                // The second argument was not a number. Check if it can be matched to someone's username
                // Make a list of all usernames
                var nameList = "";
                for(x = 0; x < files.length; x++){
                    var tempName = lib.readFile("userdata/" + files[x] + "/username.txt");
                    nameList += "|" + tempName;
                }
                var nameListArray = nameList.split("|");
                nameList = nameList.toLowerCase() + "|";
                // If the argument was "random", get a random user
                args[1] = args[1].toLowerCase();
				if(args[1] == "random"){
					var key = lib.rand(0, nameListArray.length - 2);
					dir = "userdata/" + files[key];
					username = lib.readFile(dir + "/username.txt");
				}else{
				    // If the name doesn't exist, stop
				    if(!nameList.includes(args[1])){
				        message.reply({ content: "\u274C There is no user matching your query!", allowedMentions: { repliedUser: false }});
				        return;
				    }
				    
					// First try searching for exact matches. If there is no match, search for any matches
					var key = 0;
					if(nameList.includes("|" + args[1] + "|")){
						key = nameListArray.indexOf(args[1]);
					}else{
						var split = nameList.split(args[1]);
						var results = [];
						var combined = 0;
						for(i = 0; i < split.length - 1; i++){
						    var left_side = split[i].replace(/[^|]/g, "");
						    results.push(left_side.length + combined);
						    combined += left_side.length;
						}
						// Pick random result from those found
						key = results[lib.rand(0, results.length - 1)];
					}
					dir = "userdata/" + files[key - 1];
					username = lib.readFile(dir + "/username.txt");
				}
            }
            if(username == user.username){
                // Didn't find a user
                message.reply({ content: "\u274C A different user matching your input could not be found!", allowedMentions: { repliedUser: false }});
                return;
            }
            args.splice(0, 1);
            args.splice(0, 1);
            allArgs = "";
        }else if(args[0] == "user"){
            // Missing argument
            message.reply({ content: "\u274C Please include a valid ID or username as well!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // Get user stats
        var stats = lib.readFile(dir + "/stats.txt");
        var stat_data = stats.split("|");
        
        // If there are two arguments, check them for validity and then attempt to allocate points to the user's stats
        var input_check = "";
        if(args.length > 0){
            input_check = args[0].replace(/[^0-9]/g, "");
        }
        if(input_check !== "" && args.length >= 2){
            args.splice(0, 1);
            allArgs = args.join(" ").toLowerCase();
            // Check if the user has enough stat points
            var sp = parseInt(stat_data[13]);
            var allocate = parseInt(input_check);
            if(allocate > sp){
                message.reply({ content: "\u274C You don't have enough stat points!\n(" + sp + "/" + allocate + ")", allowedMentions: { repliedUser: false }});
                return;
            }
            
            // Match the remaining input to one of the available stats
            var stat_list = ["Attack", "Defense", "Speed", "Mana", "Monster Luck", "Drop Luck", "Rare Luck"];
            var real_keys = [1, 1, 2, 3, 4, 5, 6];
            var stats_raw = "|" + stat_list.join("|").toLowerCase() + "|";
            var key = 0;
			if(stats_raw.includes(allArgs)){
				// First try searching for exact matches. If there is no match, search for any matches
				if(stats_raw.includes("|" + allArgs + "|")){
				    var stats_array = stats_raw.split("|");
					key = stats_array.indexOf(allArgs) - 1;
				}else{
					var split = stats_raw.split(allArgs);
					var left_side = split[0].replace(/[^|]/g, "");
					key = left_side.length - 1;
				}
				var stat_name = stat_list[key];
			    key = real_keys[key];
				
			}else{
			    message.reply({ content: "\u274C That stat could not be found! Please choose one of the following:\nAttack, Speed, Mana, Monster Luck, Drop Luck, Rare Luck", allowedMentions: { repliedUser: false }});
                return;
			}
            
            // Save updated stats and remove stat points
            stat_data[key] = parseInt(stat_data[key]) + allocate;
            stat_data[13] = sp - allocate;
            lib.saveFile(dir + "/stats.txt", stat_data.join("|"));
            var point_s = "s";
            if(allocate == 1){
                point_s = "";
            }
            message.reply({ content: "You assigned **" + allocate + " stat point" + point_s + "** to your **[" + stat_name + "]** stat!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // Get user's current area
        var area_key = lib.readFile(dir + "/area.txt");
        var areas = lib.readFile("data/area_names.txt").split(",");
        var area_name = areas[area_key];
        
        // Get total quest count and user completion for level cap
		var quests = lib.readFile("data/quests.txt").split(";\n");
		var quest_total = quests.length;
		var quest_num = parseInt(lib.readFile(dir + "/current_quest.txt"));
        
        // Get level and exp info
        var level = parseInt(stat_data[10]);
        var exp = stat_data[11];
        var levels = lib.readFile("data/level_reqs.txt").split(",");
        if(level >= 50){
            if(quest_num < quest_total){
                var for_levelup = "Locked";
            }else{
                var for_levelup = parseInt(levels[50]) + (400 * (level - 50));
            }
        }
        else{var for_levelup = levels[level];}
        
        // Assemble a basic embed
	    var outputEmbed = new Discord.EmbedBuilder()
        	.setColor('#0099ff')
        	.setTitle(username + "'s Stats")
        	.setDescription("**LVL " + level + "** (" + exp + "/" + for_levelup + " EXP)\n**Stat Points: " + stat_data[13] + "**");
        
        // Add the current buff if there is one
        var buff_raw = lib.readFile(dir + "/current_buff.txt");
        var buff_info = ["", "", "", "", "", "", ""]
        if(buff_raw !== ""){
            var buff_data = buff_raw.split("|");
            var buff_subdata = buff_data[10].split(",");
            var buff_timer = buff_subdata[1];
            var ex_s = "s";
            if(buff_timer == 1){
                ex_s = "";
            }
            if(buff_timer == 0){
                outputEmbed
                    .setFooter({ text: "Active buff: " + buff_data[0] + " (Current turn)" });
            }else{
                outputEmbed
                    .setFooter({ text: "Active buff: " + buff_data[0] + " (" + buff_timer + " turn" + ex_s + ")" });
            }
                
            // If the buff is altering the user's stats, show the differences!
            for(u = 1; u < 7; u++){
                if(parseInt(buff_data[u]) != "0"){
                    var plus_extra = "";
                    if(parseInt(buff_data[u]) > 0){
                        plus_extra = "+";
                    }
                    buff_info[u] = " (" + plus_extra + buff_data[u] + ")";
                }
            }
        }
        
        // Construct full ability name
        var abilityRaw = lib.readFile(dir + "/ability.txt").split("|");
        var abilities = lib.readFile("data/abilities.txt").split("######################################\n");
        var wAbilities = abilities[0].split(";\n");
        var dAbilities = abilities[1].split(";\n");
        var tAbilities = abilities[2].split(";\n");
        var abilityName = wAbilities[abilityRaw[0]] + " (" + tAbilities[abilityRaw[2]] + ")";
        if(abilityRaw[0] !== "0" && abilityRaw[1] !== "0"){
            abilityName = dAbilities[abilityRaw[1]] + " " + abilityName;
        }
        
        // Finalize embed
        outputEmbed
            .addFields(
        		{ name: 'Class', value: stat_data[0], inline: true },
        		{ name: 'Rank', value: stat_data[9], inline: true },
        		{ name: 'Current area', value: area_name, inline: true },
        		{ name: "Attack/Defense", value: stat_data[1] + buff_info[1], inline: true},
        		{ name: "Speed", value: stat_data[2] + buff_info[2], inline: true},
        		{ name: "Mana", value: stat_data[3] + buff_info[3], inline: true},
        		{ name: "Monster Luck", value: stat_data[4] + buff_info[4], inline: true},
        		{ name: "Drop Luck", value: stat_data[5] + buff_info[5], inline: true},
        		{ name: "Rare Luck", value: stat_data[6] + buff_info[6], inline: true},
        		{ name: "Equipment Ability", value: abilityName, inline: true},
        	);

        // Add main monster thumbnail if it exists
        var mainMonster = lib.readFile(dir + "/main_monster.txt");
        if(lib.exists(mainMonster)){
            outputEmbed.setThumbnail(mainMonster);
        }
        
        // Add realm HP if in a realm
        var hp = lib.readFile(dir + "/hp.txt");
        if(parseInt(area_key) > 13){
            outputEmbed
                .addFields( { name: "Current HP", value: hp, inline: true } );
        }
        
        // Output
	    message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false }});
        
	},
};