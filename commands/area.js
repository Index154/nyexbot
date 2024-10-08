var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'area',
	usages: ['', '[area name]', 'check [area name]', 'checkshiny [area name]'],
	descriptions: ['Displays a list of areas', 'Displays a list of monsters in an area', 'Displays a list of monsters the user has yet to capture, available in the specified area', 'Displays a list of shiny monsters the user has yet to capture, available in the specified area'],
    shortDescription: 'Check areas and their monsters',
    weight: 20,
    addendum: [
        '- You can `{prefix}move` between regular areas at will',
        '- The area you are in determines which monsters you can encounter',
        '- Some areas called realms are only accessible through special items called fragments',
        '- The [area name] argument can be replaced with the word "current" to inspect a realm you are currently in',
        '- You can also replace the [area name] argument with the word "all" to check all monsters in the game',
        '\n**What are realms?**',
        '- Realms are special areas with additional restrictions and benefits. You **cannot** enter a realm by using `{prefix}move`',
        '- To enter a regular realm you must use a Dimensional Fragment. You can `{prefix}buy` these',
        '- Interacting with monsters inside of a realm will reduce your HP. Running out of HP throws you out of the realm',
        '- You can obtain Vortexes by fighting monsters inside of realms',
        '- There are also unique realms which can only be accessed with a Unique Fragment',
        '- Only one unique realm is accessible at a time. The active unique realm changes every Monday',
        '- The current weekly unique realm can be checked in the `{prefix}shop`',
        '- All unique realm monsters of the same rank share the same drop table',
        '- S and SS rank monsters from unique realms can drop special Shards that allow you to upgrade equipment from the corresponding rank'
    ],
    category: 'info',
	
	execute(message, user, args, prefix) {
	    var allArgs = args.join(" ");
        
        // Set important variables
        var username = user.username;
        var dir = "userdata/" + user.id;
        
        // Get user's current area
        var userArea = parseInt(lib.readFile(dir + "/area.txt"));
        var originalUserArea = userArea;

        // Set list of available areas
        var areas_raw = lib.readFile("data/area_names.txt");
        var areas = areas_raw.split(",");
        // Remove areas above ID 13 (Realms) except for the one the user is in, if any
        if(userArea < 14){
            areas = areas.slice(0, 14);
        }else if(userArea == 14){
            areas = areas.slice(0, 15);
        }else{
            areas.splice(userArea + 1, areas.length - 1 - userArea);
            areas.splice(14, userArea - 14);
            userArea = 14;
        }
        var area_list_lower = areas.join("|").toLowerCase();
        areas[parseInt(userArea)] = "**" + areas[parseInt(userArea)] + "** - `You are here!`";
        areas_raw = areas.join("\n");
        
        // Give out a list of areas if the user submitted no argument. Otherwise try to match their input to an area
        if(args.length > 0){
            allArgs = allArgs.toLowerCase();
            // Check for check input
            if(args[0] == "check" || args[0] == "checkshiny"){
                if(args.length == 1){allArgs += " current";}
                var checkArg = "check";
                if(args[0] == "checkshiny"){ checkArg = "checkshiny";}
                var checkSplit = allArgs.split(args[0] + " ");
                args[0] = checkSplit[1];
            }else{
                var checkArg = "nocheck";
            }
            
            if(area_list_lower.includes(args[0]) || args[0] == "all" || args[0] == "current"){
                // Get area id by name
                var area = "";
                var area_name = "All";
                if(args[0] == "current"){
                    area_name = areas[parseInt(userArea)].split("**")[1];
                    area = "_" + originalUserArea;
                }else if(args[0] != "all"){
                    var split = area_list_lower.split(args[0]);
                    var left_side = split[0].replace(/[^|]/g, "");
                    var key = left_side.length;
                    area_name = areas[key];
                    area = "_" + key;
                }
                // Remove "** - `You are here!`" from area name
                if(area_name.includes("You are here")){
                    area_name = area_name.slice(0, -18);
                }
                                
				// Create paged embed
				var embedTemplate = new Discord.EmbedBuilder()
					.setColor('#0099ff')
                	.setTitle(area_name + " - Monsters");

                // Add image if it is not a realm
                if(userArea < 14) embedTemplate.setThumbnail(lib.getAreaImage(userArea, area_name));
                
                // Create monster list for displaying
                var monsters_raw = lib.readFile("data/monsters/monsters" + area + ".txt");
                var monster_groups = monsters_raw.split("#################################################################################\n");                
                // Get captures if the user passed the "check" argument
                if(checkArg == "check" || checkArg == "checkshiny"){
                    var captures = lib.readFile(dir + "/all_captures.txt");
                    check = " that you haven't captured";
                    for_user = username + ", here are all ";
                    var group = "Monsters";
                    if(checkArg == "checkshiny"){group = "Shinies";}
                    embedTemplate
                        .setDescription(group + " you've never captured before");
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
                        var specialIcon = "";
                        if(monster_values[4].substring(0, 9) == "(Special)"){ specialIcon = "\uD83D\uDFE3"; }
                        monster_name = icon_array[i] + specialIcon + monster_name;
                        
                        // If the user entered "check" as the second argument, only add uncaught monsters
                        if(checkArg == "check" || checkArg == "checkshiny"){
                            // Get ID
                            var id = monster_values[7];
                            // Check if the monster is captured
                            var toCheck = i + "," + id + ",0";
                            if(checkArg == "checkshiny"){
                                toCheck = i + "," + id + ",1";
                                monster_name = icon_array[i] + specialIcon + "\u2728" + monster_values[0];
                            }
                            if(!captures.includes(toCheck)){
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
				var elementsPerPage = 17;
				var fieldTitle = "Sorted by rank";
				lib.createPagedFieldEmbed(paginationArray, elementsPerPage, embedTemplate, fieldTitle, message);
				
            }else{
                message.reply({ content: "\u274C That area could not be found!", allowedMentions: { repliedUser: false }});
            }
            
        }else{
            // Create an embed for the output
    	    var outputEmbed = new Discord.EmbedBuilder()
            	.setColor('#0099ff')
            	.setTitle("Area list")
            	.setDescription(areas_raw);
            
            // With button :)
            var button = new ButtonBuilder()
                .setCustomId("any|area current")
                .setLabel('View current area monsters')
                .setStyle(1)
            var row = new ActionRowBuilder().addComponents([button]);
            
            message.reply({ embeds: [outputEmbed], components: [row], allowedMentions: { repliedUser: false }});
        }

	},
};