var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'captures',
	usages: ['', '[monster name]', 'random', 'user [ID or username]', 'user random', 'favorite [monster name]'],
	descriptions: ["Shows you a list of all the monsters you've ever captured", "Displays the details of a specified monster from your captures", "Displays the details of a random monster from your captures", 'Displays the capture list of a different user', 'Displays the capture list of a random user', 'Favorites a monster, setting it as your user icon'],
    shortDescription: 'Check a user\'s monsters and their details',
    weight: 10,
	aliases: ['caps'],
	addendum: [
        '- Monsters you no longer have any of are always listed below the rest',
        '- The color icons in front of monster names indicate their rank',
        '- Monsters from unique realms and token monsters have purple icons',
        '- You can `{prefix}deliver` monsters to complete your current `{prefix}quest`',
        '- If you favorite a monster then its image will be displayed in `{prefix}stats`, `{prefix}inventory`, `{prefix}trophies` and `{prefix}captures` itself'
    ],
	category: 'userinfo',
	
	execute(message, user, args, prefix) {
		var allArgs = args.join(" ");
		adc  = require('adc.js');
        
        // Set important variables
        var username = user.username;
        dir = "userdata/" + user.id;
        
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
        
        // Get a full list of all the user's captures AND their previously captured monsters
        var captures = lib.readFile(dir + "/captures.txt");
        var all_captures = lib.readFile(dir + "/all_captures.txt");
        var monsters = lib.readFile("data/monsters/monsters.txt");
		var monster_groups = monsters.split("#################################################################################\n");
		if(lib.readFile(dir + "/monster_mode.txt") == "funny"){monster_groups = lib.readFile("data/monsters/monsters_alt.txt").split("#################################################################################\n");}
		
		if(captures !== ""){
		    captures = captures + ";" + all_captures;
			var monster_key_groups = captures.split(";");
		}else{
		    if(all_captures.includes(";")){
		        var monster_key_groups = all_captures.split(";");
		    }else if(all_captures !== ""){
		        var monster_key_groups = [all_captures];
		    }else{
		        message.reply({ content: "You have no monsters yet!", allowedMentions: { repliedUser: false }});
			    return;
		    }
		}
		
        // Go through the monster names and join them into a list
        var monster_names = "";
		var monster_names2 = "";
		var key_count = monster_key_groups.length;
		var icon_array = {0: "<:real_black_circle:856189638153338900>", 1: "\uD83D\uDD35", 2: "\uD83D\uDFE2", 3: "\uD83D\uDD34", 4: "\uD83D\uDFE1", 5: "\uD83D\uDFE0"};
		var iconMods = {0: "7", 1: "6", 2: "5", 3: "4", 4: "3", 5: "2"};
		for(i = 0; i < key_count; i++){
			var keys = monster_key_groups[i].split(",");
			var monsters_array = monster_groups[keys[0]].split(";\n");
			var selected_monster = monsters_array[keys[1]];
			var monster_values = selected_monster.split("|");
			var monster_name = monster_values[0];
			var shiny = "";
			var shiny_2 = "";
			var shiny_extra = "";
			var icon = "";
			var iconModifier = iconMods[keys[0]];
			if(monster_values[4].substring(0, 9) == "(Special)"){icon = "\uD83D\uDFE3"; iconModifier = iconModifier + "1";}else{
			    iconModifier = iconModifier + "9";
			}
			if(keys[2] == "1"){shiny = "\u2728Shiny "; shiny_2 = "Shiny "; iconModifier = "0" + iconModifier;}else{
			    iconModifier = "9" + iconModifier;
			}
			icon = "##" + icon_array[keys[0]] + icon;
			var id = "##" + monster_key_groups[i];
			
			if(i > 0){
				monster_names = monster_names + " | ";
				monster_names2 = monster_names2 + "|";
			}
			monster_names = monster_names + iconModifier + shiny + monster_name + id + icon;
			monster_names2 = monster_names2 + shiny_2 + monster_name;
		}
        
        // If the user entered the argument "favorite", set a flag for later and remove the argument
        var favoriteFlag = false;
        if(args[0] == "favorite" || args[0] == "fav"){
            args.splice(0, 1);
            if(args.length < 1){
                // No further arguments
                message.reply({ content: "\u274C You need to include the name of a monster!", allowedMentions: { repliedUser: false }});
                return;
            }
            favoriteFlag = true;
        }
        
        // Count duplicates
        var monster_array = monster_names.split(" | ");
        var monCounts = new adc(monster_array).count();
        // Function for removing duplicate array values
        function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
        }
        var uniq_array = monster_array.filter(onlyUnique);
        // Get monster counts first and make it so those with 0 are put below the rest
        var totalCount = 0;
        for(j = 0; j < uniq_array.length; j++){
            var name = uniq_array[j];
            var monCount = monCounts[uniq_array[j]] - 1; // Subtract one because of all_captures.txt
            
            totalCount += monCount;
            if(monCount === 0){uniq_array[j] = "zzz" + uniq_array[j];}
        }
        // Sort
        // The array elements are being sorted alphabetically and they are all in this format: ZZZ-prefix if it exists + 3-digit order prefix + monster name + separator + rank icon
        // This means that monsters the user doesn't actually have will always be at the bottom, shinies will be at the top of "both lists" and besides that it just goes by the rarity
        uniq_array = uniq_array.sort();

        // Remove the ordering prefixes and finalize the output array
        var cappedMonsters = [];
        allArgs = args.join(" ");
        for(j = 0; j < uniq_array.length; j++){
            var name = uniq_array[j];
            if(name.substring(0, 3) == "zzz"){
                name = name.substring(3);
            }
            var monCount = monCounts[name] - 1;
            name = name.substring(3);
            var name_parts = name.split("##");
            name = name_parts[2] + name_parts[0];
            uniq_array[j] = name_parts[1];
            
            cappedMonsters[j] = "**" + name + "** x " + monCount;
        }
        
        // Check if the user gave an input. If so, look for it in their captures and give out its info if possible
        if(allArgs.length > 0){
			// There was an argument so check if it matches a monster
			allArgs = allArgs.toLowerCase();
			var monster_names_lower = monster_names2.toLowerCase() + "|";
			
			// Check if the search can be matched to a monster in the user's possession
			if(monster_names_lower.includes(allArgs) || allArgs == "random"){
				// If the argument was "random", get a random monster
				if(allArgs == "random"){
					var key = lib.rand(0, monster_key_groups.length - 1);
				}else{
					// Try searching for exact matches. If there is no match, search for any matches
					var key = 0;
					if(monster_names_lower.includes("|" + allArgs + "|")){
						var monster_names_array = monster_names_lower.split("|");
						key = monster_names_array.indexOf(allArgs);
					}else{
						var split = monster_names_lower.split(allArgs);
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
				}
				
				var result_keys = monster_key_groups[key].split(",");
				var monsters_array = monster_groups[result_keys[0]].split(";\n");
				var shinies = lib.readFile("data/monsters/monsters_shiny.txt");
				var shiny_groups = shinies.split("#################################################################################\n");
				var shinies_array = shiny_groups[result_keys[0]].split(";\n");
				// The monster's data has been retrieved!
				var result_monster = monsters_array[result_keys[1]];
				
				// Get embed color
                var embed_colors = ["#b0b0b0", "#0099ff", "#2AA189", "#b80909", "#e3b712", "#e39f0e"];
                var embed_color = embed_colors[result_keys[0]];
				
				// If the monster is shiny, get the shiny entry instead
				var altIndex = "None";
				var firstAltImage = "Not owned";
				if(result_keys[2] == "1"){
				    embed_color = "#8f1ee6";
					result_monster = shinies_array[result_keys[1]];
					
					// Check if the user has the normal variant as well and find its page number
    				var altId = result_keys[0] + "," + result_keys[1] + "," + 0;
    				if(uniq_array.includes(altId)){
    				    altIndex = uniq_array.indexOf(altId);
						firstAltImage = "https://artificial-index.com/media/rpg_monsters/" + monsters_array[result_keys[1]].split("|")[0].toLowerCase().replace(/ /g, "_") + ".png";
    				}
				}else{
    			    // Check if the user has the shiny variant as well and find its page number
    				var altId = result_keys[0] + "," + result_keys[1] + "," + 1;
    				if(uniq_array.includes(altId)){
    				    altIndex = uniq_array.indexOf(altId);
						firstAltImage = "https://artificial-index.com/media/rpg_monsters/" + shinies_array[result_keys[1]].split("|")[0].toLowerCase().replace(/ /g, "_") + ".png";
    				}
    			}
    			var monster_data = result_monster.split("|");
				
				// Push button to array
    			var button4 = new ButtonBuilder()
        			.setCustomId('comparebtn|' + altIndex)
        			.setLabel('Switch')
        			.setStyle(1);
				
				// If the user is trying to favorite the monster, select it as such and stop early
				if(favoriteFlag){
				    lib.saveFile(dir + "/main_monster.txt", "https://artificial-index.com/media/rpg_monsters/" + monster_data[0].toLowerCase().replace(/ /g, "_") + ".png");
				    message.reply({ content: "You've successfully set the **" + monster_data[0] + "** as your favorite!\nIt will now appear as a thumbnail in some of your displays", allowedMentions: { repliedUser: false }});
				    return;
				}
				
				// Get rarity
                var rarity_names = ["D", "C", "B", "A", "S", "SS"];
                var rarity = rarity_names[result_keys[0]];
                if(result_keys[2] == "1"){
                    rarity = rarity + "++";
                }
				
				// Assemble a basic embed for the output
				if(monster_data[3].includes(",")){
				    var types = monster_data[3].split(",");
				    type = types.join(", ");
				}else{
				    type = monster_data[3];
				}

				// Fix error for empty property
				if(monster_data[4] == ""){monster_data[4] = "/";}

                var outputEmbed = new Discord.EmbedBuilder()
                	.setColor(embed_color)
                	.setTitle(monster_data[0])
                	.setImage("https://artificial-index.com/media/rpg_monsters/" + monster_data[0].toLowerCase().replace(/ /g, "_") + ".png")
                	.setDescription(monster_data[4])
                	.addFields(
                		{ name: 'Attack', value: monster_data[1], inline: true },
                		{ name: 'Speed', value: monster_data[2], inline: true },
                		{ name: "Rank", value: rarity, inline: true},
                		{ name: 'Type', value: type, inline: true }
                	);
				
				// Get item drops and add them
				if(result_keys[2] == "1"){
				    // Shiny drop item
				    var drop_pool = ["106", "100"];
				}else{
				    var drop_pool_groups = lib.readFile("data/drops.txt").split("#######################\n");
				    var drop_pools = drop_pool_groups[result_keys[0]].split(";\n");
				    var drop_pool = drop_pools[result_keys[1]].split("|");
				}
				var items = lib.readFile("data/items.txt").split(";\n");
				// If there is only one drop, create the array differently
				if (drop_pool[0].includes(",")) {
                    var drops_array = drop_pool[0].split(",");
                    var drop_chances = drop_pool[1].split(",");
                }else{
                    var drops_array = [drop_pool[0]];
                    var drop_chances = [drop_pool[1]];
                }
                var drops = "";
                for(x = 0; x < drops_array.length; x++){
                    var item_key = parseInt(drops_array[x]);
                    var item_data = items[item_key].split("|");
                    if(x > 0){
                        drops = drops + "\n";
                    }
                    drops = drops + item_data[0] + ": " + drop_chances[x] + "%";
                }
                
                outputEmbed
                    .addFields( { name: "Drops", value: drops, inline: true } );
				
				// Get captured count
				var monster_array = monster_names2.split("|");
				var captures_counts = new adc(monster_array).count();
				var capture_count = captures_counts[monster_data[0]] - 1; // Subtract one because of all_captures.txt
				outputEmbed
				    .addFields( { name: username + "'s capture count", value: capture_count.toString(), inline: true } );
				
				// Find starting ID for paged embed
				var startingId = uniq_array.indexOf(monster_key_groups[key]);
				
				// Create custom paged embed with all monsters (sorted)
				lib.createPagedMonsterEmbed(uniq_array, outputEmbed, startingId, message, monster_groups, monster_names2, items, username, monster_data[0], button4, firstAltImage);
				
			}else{
				// Error, monster not found
				message.reply({ content: "\u274C That monster could not be found in your captures!", allowedMentions: { repliedUser: false }});
				return;
			}
            
        }else{
            
			// Create paged embed
			var paginationArray = cappedMonsters;
			var elementsPerPage = 15;
			var fieldTitle = totalCount + " monsters / " + uniq_array.length + " entries";
			var embedTemplate = new Discord.EmbedBuilder()
				.setColor('#0099ff')
            	.setTitle(username + "'s Captures")
				.setDescription("Use \"" + prefix + "caps [monster name]\" to view a monster's details!");
			
			// Add main monster thumbnail if it exists
			var mainMonster = lib.readFile(dir + "/main_monster.txt");
			if(lib.exists(mainMonster)){
				embedTemplate.setThumbnail(mainMonster);
			}

			// Send embed
			lib.createPagedFieldEmbed(paginationArray, elementsPerPage, embedTemplate, fieldTitle, message);

        }
	},
};