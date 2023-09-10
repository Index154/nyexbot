var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'area',
	usages: ['', '[area name]', 'check [area name]'],
	descriptions: ['Displays a list of areas', 'Displays a list of monsters in an area', 'Displays a list of monsters the user has yet to capture, available in the specified area'],
    shortDescription: 'Check areas and their monsters',
    weight: 20,
    addendum: [
        '- You can `{prefix}move` between regular areas at will',
        '- The area you are in determines which monsters you can encounter',
        '- Some areas called realms are only accessible through special items called fragments',
        '- The [area name] argument can be replaced with the word "realm" to inspect a realm you are currently in'
    ],
    category: 'info',
	
	execute(message, user, args, prefix) {
	    var allArgs = args.join(" ");
        
        // Set important variables
        var username = user.username;
        var dir = "userdata/" + user.id;
        
        // Get user's current area
        var userArea = parseInt(lib.readFile(dir + "/area.txt"));

        // Set list of available areas
        var areas_raw = lib.readFile("data/area_names.txt");
        var areas = areas_raw.split(",");
        // Remove areas above ID 13 (Realms)
        areas = areas.slice(0, 14);
        var area_list_lower = areas.join("|").toLowerCase();
        areas[parseInt(userArea)] = "**" + areas[parseInt(userArea)] + "** - `You are here!`";
        areas_raw = areas.join("\n");
        
        // Give out a list of areas if the user submitted no argument. Otherwise try to match their input to an area
        if(args.length > 0){
            if(args.length > 1){
                allArgs = allArgs.toLowerCase();
                // Check for check input
                if(args[0] == "check"){
                    var checkArg = "check";
                    var checkSplit = allArgs.split("check ");
                    args[0] = checkSplit[1];
                }else{
                    var checkArg = "nocheck";
                }
            }
            
            if(area_list_lower.includes(args[0]) || args[0] == "realm" && userArea >= 14){
                // If the user is looking at their current realm, reobtain the area list and don't remove realms this time
                areas_raw = lib.readFile("data/area_names.txt");
                areas = areas_raw.split(",");
                area_list_lower = areas.join("|").toLowerCase();
                areas_raw = areas.join("\n");
                
                if(args[0] == "realm" && userArea >= 14){
                    var key = userArea;
                }else{
                    var split = area_list_lower.split(args[0]);
    				var left_side = split[0].replace(/[^|]/g, "");
    				var key = left_side.length;
                }
                var area_name = areas[key];
                
                // Set area monster path
                var area = "";
                area = "_" + key;
                
				// Create paged embed
				var embedTemplate = new Discord.EmbedBuilder()
					.setColor('#0099ff')
                	.setTitle(area_name + " - Monsters");
                
                // Create monster list for displaying
                var monsters_raw = lib.readFile("data/monsters/monsters" + area + ".txt");
                var monster_groups = monsters_raw.split("#################################################################################\n");
                var monster_groups_main = lib.readFile("data/monsters/monsters.txt").split("#################################################################################\n");
                if(lib.readFile(dir + "/monster_mode.txt") == "funny"){monster_groups_main = lib.readFile("data/monsters/monsters_alt.txt").split("#################################################################################\n");}
                // Get captures if the user passed the "check" argument
                if(checkArg == "check"){
                    var captures = lib.readFile(dir + "/all_captures.txt");
                    check = " that you haven't captured";
                    for_user = username + ", here are all ";
                    embedTemplate
                        .setDescription("Only showing monsters that " + username + " has never captured before");
                }
                
                // Go through all the monster names and add them to the embed
                var icon_array = ["<:real_black_circle:856189638153338900>", "\uD83D\uDD35", "\uD83D\uDFE2", "\uD83D\uDD34", "\uD83D\uDFE1", "\uD83D\uDFE0"];
                var hub_array = [];
                // Go through the groups
                for(i = 0; i < 6; i++){
                    var monsters_array = monster_groups[i].split(";\n");
                    var monster_count = monsters_array.length;
                    // Go through the individual monsters of the group
                    for(y = 0; y < monster_count - 1; y++){
                        var selected_monster = monsters_array[y];
                        var monster_values = selected_monster.split("|");
                        var monster_name = monster_values[0];
                        
                        // If the area is Hub, put the rank in the name of every monster and save them in an array
                        monster_name = icon_array[i] + monster_name;
                        
                        // If the user entered "check" as the second argument, only add uncaught monsters
                        if(checkArg == "check"){
                            // Get ID
                            var id = monster_values[7];
                            // Check if the monster is captured
                            if(captures.includes(i + "," + id + ",0")){}else{
                                hub_array[hub_array.length] = monster_name;
                            }
                        }else{
                            hub_array[hub_array.length] = monster_name;
                        }
                        
                    }
                    
                }
                
                // If the list is empty, add a single element saying "None"
                if(hub_array.length < 1){
                    hub_array.push("No monsters found");
                }
                
                // Send embed
				var paginationArray = hub_array;
				var elementsPerPage = 20;
				var fieldTitle = "Sorted by rank";
				lib.createPagedEmbed(paginationArray, elementsPerPage, embedTemplate, fieldTitle, message);
				
            }else{
                message.reply({ content: "\u274C That area could not be found!", allowedMentions: { repliedUser: false }});
            }
            
        }else{
            // Create an embed for the output
    	    var outputEmbed = new Discord.EmbedBuilder()
            	.setColor('#0099ff')
            	.setTitle("Area list")
            	.setDescription(areas_raw);
            
            message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false }});
        }

	},
};