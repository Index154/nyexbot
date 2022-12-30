var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'inventory',
	usages: ['', '[item name]', 'weapon/defense/tool', 'random', 'user [ID or username]', 'user random'],
	descriptions: ['Displays your inventory', 'Displays the data of a specified item from your inventory', 'Displays the data of one of your equipment items', 'Displays the data of a random item from your inventory', 'Displays the inventory of a different user', 'Displays the inventory of a random user'],
    shortDescription: 'Check a user\'s items and their details',
    weight: 5,
	aliases: ['inv'],
	category: 'items',
	
	execute(message, user, args) {
	    adc  = require('adc.js');
	    var allArgs = args.join(" ");
	    
	    function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
        }
        
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
        
        // Get a full list of all the user's items
        var inventory = lib.readFile(dir + "/inventory.txt");
        var equipment = lib.readFile(dir + "/equipment.txt");
        var equipment_keys = equipment.split(",");
        var items = lib.readFile("data/items.txt");
        var items_array = items.split(";\n");
        // Get equipment names
        var equip_values0 = items_array[equipment_keys[0]].split("|");
        var name0 = equip_values0[0];
        var equip_values1 = items_array[equipment_keys[1]].split("|");
        var name1 = equip_values1[0];
        var equip_values2 = items_array[equipment_keys[2]].split("|");
        var name2 = equip_values2[0];
		// Get equipment rarities
		var equipRarities = lib.readFile(dir + "/equip_modifiers.txt").split("\n");
		name0 = equipRarities[0].split("|")[0] + name0;
		name1 = equipRarities[1].split("|")[0] + name1;
		name2 = equipRarities[2].split("|")[0] + name2;
        var no_items = false;
        if(inventory.includes(",")){
            var item_keys = (equipment + "," + inventory).split(",");
        }else if(inventory !== ""){
            item_keys = [equipment_keys[0], equipment_keys[1], equipment_keys[2], inventory];
        }else{
            item_keys = [equipment_keys[0], equipment_keys[1], equipment_keys[2]];
            no_items = true;
        }
        
        // Go through the item names and join them into a list
        var icon_array = {D: "<:real_black_circle:856189638153338900>", C: "\uD83D\uDD35", B: "\uD83D\uDFE2", A: "\uD83D\uDD34", S: "\uD83D\uDFE1", SS: "\uD83D\uDFE0", Special: "\u2728", Vortex: "\uD83C\uDF00"};
        var item_names = "";
		var item_names2 = "";
		var key_count = item_keys.length;
		for(i = 0; i < key_count; i++){
			var loop_key = item_keys[i];
			var selected_item = items_array[loop_key];
			var item_values = selected_item.split("|");
			var item_name = item_values[0];
			
			if(i > 2){
				if(i > 3){
					item_names = item_names + " | ";
				}
				item_names = item_names + icon_array[item_values[12]] + item_name;
			}
			if(i > 0){
				item_names2 = item_names2 + "|";
			}
			item_names2 = item_names2 + item_name;
		}
        
        // Check if the user gave an input. If so, look for it in their inventory and give out its info if possible
        if(args.length > 0){
			// There was an argument so check if it matches an item
			allArgs = allArgs.toLowerCase();
			var item_names_lower = item_names2.toLowerCase();
			item_names_lower = "|" + item_names_lower + "|";
			
			// Check if the search can be matched to an item in the user's possession
			if(item_names_lower.includes(allArgs) || allArgs == "random" || allArgs == "weapon" || allArgs == "defense" || allArgs == "tool"){
			    var key = 0;
			    // If the argument was "random", get a random item
				if(allArgs == "random"){
				    item_keys = item_keys.filter(onlyUnique);
					var result_key = item_keys[lib.rand(0, item_keys.length - 1)];
				}else if(allArgs == "weapon" || allArgs == "defense" || allArgs == "tool"){
				    // If the argument was "weapon", "defense" or "tool", pick the corresponding item
				    var equipTypes = {"weapon": 0, "defense": 1, "tool": 2};
				    var result_key = equipment_keys[equipTypes[allArgs]];
				}else{
    				// First try searching for exact matches. If there is no match, search for any matches
    				if(item_names_lower.includes("|" + allArgs + "|")){
    				    var item_names_array = item_names_lower.split("|");
    					key = item_names_array.indexOf(allArgs);
    				}else{
    					var split = item_names_lower.split(allArgs);
    					var left_side = split[0].replace(/[^|]/g, "");
    					key = left_side.length;
    				}
				    
    				var result_key = 0;
    				if(key > 3){
    					// It's a consumable item
    					var inventory_array = inventory.split(",");
    					result_key = inventory_array[key - 4];
    				}else{
    					// The item is equipped
    					var equipment_array = equipment.split(",");
    					result_key = equipment_array[key - 1];
    				}
				}
				// The item has been determined. Prepare paged embed
				var uniqueItems = item_keys.filter(onlyUnique);
				var startingId = uniqueItems.indexOf(result_key);
				lib.createPagedItemEmbed(dir, uniqueItems, item_keys, startingId, message, user, items_array);
				
			}else{
				// Error, item not found
				message.reply({ content: "\u274C That item could not be found!\nPlease try again", allowedMentions: { repliedUser: false }});
				return;
			}
            
        }else{
            // There was no input
            // Fetch gold count
            var user_data = lib.readFile(dir + "/stats.txt").split("|");
            
            // Fetch stasis space data
            var stasis = lib.readFile(dir + "/saved_encounter.txt");
			var stasis_info = "Empty";
			if(stasis !== ""){
				// There is a saved encounter. Get the monster's name
				var monster_groups = lib.readFile("data/monsters/monsters.txt").split("#################################################################################\n");
				var monster_keys_array = stasis.split(",");
				var monsters = monster_groups[monster_keys_array[0]].split(";\n");
				var monster_data = monsters[monster_keys_array[1]].split("|");
				var shiny = "";
				if(monster_keys_array[2] == "1"){
					shiny = "\u2728Shiny ";
					monster_data[0] = monster_data[0] + "\u2728";
				}
				stasis_info = shiny + monster_data[0];
			}

			// Fetch saved capture chain
            var chain = lib.readFile(dir + "/saved_chain.txt");
			var chainInfo = "None";
			if(chain !== ""){
				// There is a saved chain. Get the monster's name and chain value
				var monster_groups = lib.readFile("data/monsters/monsters.txt").split("#################################################################################\n");
				var chainData = chain.split("|");
				var monster_keys_array = chainData[0].split(",");
				var monsters = monster_groups[monster_keys_array[0]].split(";\n");
				var monster_data = monsters[monster_keys_array[1]].split("|");
				chainInfo = monster_data[0] + " (" + chainData[1] + ")";
			}
            
            // Fetch token counter
            var tokens = lib.readFile(dir + "/token_state.txt");
            
            if(!no_items){
                // Since the user has some items, make a FieldsEmbed
                // First count the duplicates
                var item_array = item_names.split(" | ");
                var itemCounts = new adc(item_array).count();
                // Remove duplicate array elements
                var uniq_array = item_array.filter(onlyUnique);
                uniq_array = uniq_array.sort();
                
                // Combine the two arrays (names and counts)
                var consumables = [];
                for(j = 0; j < uniq_array.length; j++){
                    consumables[j] = uniq_array[j] + " x " + itemCounts[uniq_array[j]];
                }
				
				// Create paged embed and send it
				var paginationArray = consumables;
				var elementsPerPage = 10;
				var fieldTitle = "Consumables";
        	    var embedTemplate = new Discord.MessageEmbed()
                	.setColor('#0099ff')
                	.setTitle(username + "'s Inventory")
					.setThumbnail(lib.readFile(dir + "/main_monster.txt"))
                	.addFields(
                		{ name: 'Equipment', value: name0 + "\n" + name1 + "\n" + name2 },
                		{ name: 'Gold', value: user_data[12], inline: true },
                		{ name: 'Stasis Space', value: stasis_info, inline: true },
						{ name: 'Saved chain', value: chainInfo, inline: true}
					)
				
				// Add token points if there are any
				if(lib.exists(tokens) && tokens != "0"){
                    embedTemplate
                        .addFields( { name: "Token Points", value: tokens, inline: true } );
                }
				
				lib.createPagedEmbed(paginationArray, elementsPerPage, embedTemplate, fieldTitle, message);
                
            }else{
                // Assemble only a basic embed
        	    var outputEmbed = new Discord.MessageEmbed()
                	.setColor('#0099ff')
                	.setTitle(username + "'s Inventory")
                	.addFields(
                		{ name: 'Equipment', value: name0 + "\n" + name1 + "\n" + name2 },
                		{ name: 'Gold', value: user_data[12], inline: true },
                		{ name: 'Stasis Space', value: stasis_info, inline: true },
						{ name: 'Saved chain', value: chainInfo, inline: true}
                	)
                	.setFooter({ text: "Use \"" + prefix + "inv [item name]\" to view an item's details!" })
                	.setThumbnail(lib.readFile(dir + "/main_monster.txt"));
                
                // Add token points if there are any
				if(lib.exists(tokens) && tokens != "0"){
                    outputEmbed
                        .addFields( { name: "Token Points", value: tokens, inline: true } );
                }
                
                // Output
			    message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false }});
            }
        }
	},
};