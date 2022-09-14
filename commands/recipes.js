var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'recipes',
	usages: ['', 'craftable', '[item name]'],
	descriptions: ['Posts a list of all recipes', 'Displays a list of items you are currently able to craft', 'Displays a list of items that can be crafted with the given item. Also lists the item itself if it can be crafted'],
    shortDescription: 'Look at crafting recipes',
    weight: 15,
	aliases: ["rec"],
    category: 'info',
	
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
        
        // If the user included the argument "craftable", check which items they can craft at the moment
        var icon_array = {D: "<:real_black_circle:856189638153338900>", C: "\uD83D\uDD35", B: "\uD83D\uDFE2", A: "\uD83D\uDD34", S: "\uD83D\uDFE1", SS: "\uD83D\uDFE0", Special: "\u2728", Vortex: "\uD83C\uDF00"};
        if(args[0] == "craftable"){
            // Load user equipment as well as inventory
            var inventory = lib.readFile(dir + "/inventory.txt");
            var equipment = lib.readFile(dir + "/equipment.txt");
            var materials = lib.readFile(dir + "/materials.txt");
            var equipment_keys = equipment.split(",");
            var items = lib.readFile("data/items.txt");
            var items_array = items.split(";\n");
            var no_items = false;
            if(materials !== undefined && materials !== ""){
                if(inventory !== "" && inventory !== undefined){
                    inventory = inventory + "," + materials;
                }else{
                    inventory = materials;
                }
            }
            if(inventory.includes(",")){
                var item_keys = (equipment + "," + inventory).split(",");
            }else if(inventory !== ""){
                var item_keys = [equipment_keys[0], equipment_keys[1], equipment_keys[2], inventory];
            }else{
                var item_keys = [equipment_keys[0], equipment_keys[1], equipment_keys[2]];
                no_items = true;
            }
            
            // Get item counts and remove duplicates
            var adc  = require('adc.js');
            var itemCounts = new adc(item_keys).count();
            // Function for removing duplicate array values
            function onlyUnique(value, index, self) {
                return self.indexOf(value) === index;
            }
            var uniq_array = item_keys.filter(onlyUnique);
            
            // Load recipe list
            var recipes = lib.readFile("data/recipes.txt").split(";\n");
            
            // Loop through all recipes, checking if they can be crafted. Add them to the output if they can
            var craftable_list = ["None"];
            for(i = 0; i < recipes.length; i++){
                var craftable = true;
                var recipe_data = recipes[i].split("|");
                if(recipe_data[1].includes(":")){
                    var ingredients = recipe_data[1].split(":");
                }else{
                    var ingredients = [recipe_data[1]];
                }
                for(y = 0; y < ingredients.length && craftable; y++){
                    var ingredient_data = ingredients[y].split(",");
                    var req_count = parseInt(ingredient_data[1]);
                    var user_count = itemCounts[ingredient_data[0]];
                    if(user_count === undefined){user_count = 0;}
                    if(user_count < req_count){craftable = false;}
                }
                
                if(craftable){
                    // Add to output
                    var result_item = items_array[recipe_data[0]].split("|");
                    if(craftable_list[0] == "None"){
                        craftable_list[0] = icon_array[result_item[12]] + "**" + result_item[0] + "** (" + recipe_data[2] + ")";
                    }else{
                        craftable_list[craftable_list.length] = icon_array[result_item[12]] + "**" + result_item[0] + "** (" + recipe_data[2] + ")";
                    }
                }
            }
			
			// Create paged embed and send it
			var paginationArray = craftable_list;
			var elementsPerPage = 15;
			var fieldTitle = "You can use `" + prefix + "craft [item name]` to preview and then craft any of these items!";
			var embedTemplate = new Discord.MessageEmbed()
				.setColor('#0099ff')
            	.setTitle(username + "'s craftable items")
			lib.createPagedEmbed(paginationArray, elementsPerPage, embedTemplate, fieldTitle, message);
        
        // If the user added a different argument then try to match it to an item
        }else if(args.length > 0){
            
            // Construct a list of all item names
            var items = lib.readFile("data/items.txt");
            var items_array = items.split(";\n");
            var item_names = "";
            var item_names2 = "";
            var key_count = items_array.length;
    		for(i = 0; i < key_count; i++){
    			var selected_item = items_array[i];
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
    		
    		// Format the input and the list for matching
			allArgs = allArgs.toLowerCase();
			var item_names_lower = item_names2.toLowerCase();
			item_names_lower = "|" + item_names_lower + "|";
            
            // Check if the search can be matched to an item
			if(item_names_lower.includes(allArgs)){
				// First try searching for exact matches. If there is no match, search for any matches
				var key = 0;
				if(item_names_lower.includes("|" + allArgs + "|")){
				    var item_names_array = item_names_lower.split("|");
					key = item_names_array.indexOf(allArgs);
				}else{
					var split = item_names_lower.split(allArgs);
					var left_side = split[0].replace(/[^|]/g, "");
					key = left_side.length;
				}
				key -= 1;

				// The item's data has been retrieved!
				var item_info = items_array[key].split("|");
				
				// Loop through the recipes list and add every recipe that contains the item key to the output array
				var item_list = ["None"];
                var recipes = lib.readFile("data/recipes.txt").split(";\n");
                for(i = 0; i < recipes.length; i++){
                    var add_it = false;
                    var recipe = "|" + recipes[i];
                    var recipe_data = recipes[i].split("|");
                    if(recipe.includes(":" + key + ",") || recipe.includes("|" + key + "|") || recipe.includes("|" + key + ",")){
                        add_it = true;
                    }
                    
                    if(add_it){
                        // Add to output
                        var result_item = items_array[recipe_data[0]].split("|");
                        if(item_list[0] == "None"){
                            item_list[0] = icon_array[result_item[12]] + "**" + result_item[0] + "** (" + recipe_data[2] + ")";
                        }else{
                            item_list[item_list.length] = icon_array[result_item[12]] + "**" + result_item[0] + "** (" + recipe_data[2] + ")";
                        }
                    }
                }
				
				// Create paged embed and send it
				var paginationArray = item_list;
				var elementsPerPage = 15;
				var fieldTitle = "Found " + item_list.length + " recipes\n";
				var embedTemplate = new Discord.MessageEmbed()
					.setColor('#0099ff')
                	.setTitle("Items that can be crafted with [" + item_info[0] + "]")
                	.setDescription("(The item itself is also included if it is craftable)");
				lib.createPagedEmbed(paginationArray, elementsPerPage, embedTemplate, fieldTitle, message);
				
			}else{
			    // No match found. Send error message
			    message.reply({ content: "\u274C That item could not be found. Please try again!", allowedMentions: { repliedUser: false }});
			}
            
        }else{
            // Default output message
            message.reply({ content: 'The full crafting recipe list is currently unavailable.\nYou may instead use `' + prefix + 'recipes craftable` to see which items you are able to craft right now.', allowedMentions: { repliedUser: false }});
        }
        
	},
};