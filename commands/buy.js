var { prefix } = require('../config.json');

module.exports = {
	name: 'buy',
	usages: ['[item name]', 'shinymon'],
	descriptions: ['Attempts to purchase a selected item from the shop', 'Attempts to buy the shiny from the shiny shop'],
    shortDescription: 'Buy an item or shiny with Gold',
    weight: 25,
    category: 'items',
	
	execute(message, user, args) {
        
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
	    
	    // If there was no input, end the command
	    if(args.length === 0 || args[0] === undefined){
	        message.reply({ content: "\u274C Please include an item you want to buy!", allowedMentions: { repliedUser: false }});
	        return;
	    }
	    
	    // Get all items
	    var item_array = lib.readFile("data/items.txt").split(";\n");

        // Load unique realm list and get event realm
        var unique_realms = lib.readFile("data/unique_realms.txt").split(",");
        var current_event = lib.readFile("data/weekly_realm.txt");
        
        // Update the weekly event realm if necessary
        var week = lib.getWeek();
        var last_realm_week = lib.readFile("data/realm_week.txt");
        if(last_realm_week != week){
            // Load next weekly realm ID
            var new_id = unique_realms.indexOf(current_event) + 1;
            if(new_id >= unique_realms.length){new_id = 0;}
            var new_event = unique_realms[new_id];
            
            // Update files
            lib.saveFile("data/weekly_realm.txt", new_event);
            lib.saveFile("data/realm_week.txt", week);
        }

        // Generate new shop if necessary
        var last_week = lib.readFile("data/shop_week.txt");
        if(last_week != week){
            var shop_data = lib.updateShop(item_array, week).split("|");
            lib.saveFile("data/shiny_shop.txt", shop_data[12]);
            lib.saveFile("data/shiny_shop_user.txt", "");
        }else{
            // Load existing shop
            var shop_data = lib.readFile("data/shop.txt").split("|");
        }
        
        // If the user used the shinymon argument, try to buy the shiny from the shiny shop
	    if(args[0] == "shinymon"){
	        // Get current shiny
	        var monster_keys = lib.readFile("data/shiny_shop.txt");
		    var monster_keys_array = monster_keys.split(",");
		    var monster_groups = lib.readFile("data/monsters/monsters.txt").split("#################################################################################\n");
    		var monsters = monster_groups[monster_keys_array[0]].split(";\n");
    		var monster_data_raw = monsters[monster_keys_array[1]];
    		var monster_data = monster_data_raw.split("|");
	        
	        // Reserve the shiny for the user to make sure they don't accidentally buy the next shiny
	        var reservedUser = lib.readFile("data/shiny_shop_user.txt");
	        if(reservedUser !== user.id){
	            // Create button
    			var button1 = new MessageButton()
    			.setCustomId(user.id + "|buy shinymon")
    			.setLabel('Confirm')
    			.setStyle('SUCCESS')
    			var row = new MessageActionRow().addComponents([button1]);
    			
    			// Output
    			lib.saveFile("data/shiny_shop_user.txt", user.id.toString());
    			message.reply({ content: "The current offer is a **[Shiny " + monster_data[0] + "]**, are you sure that you want to purchase it?", components: [row], allowedMentions: { repliedUser: false }});
                return;
	        }
	        
	        // Check if the user has collected all monsters
    		var mons = lib.readFile("data/monsters/monsters.txt").split(";\n");
    		var mon_total = mons.length - 1;
    		// Get a full list of captured monsters
    		var captures = lib.readFile(dir + "/all_captures.txt");
    		var mon_num = 1;
    		if(captures.includes(";")){
    			var monster_key_groups = captures.split(";");
    		}else if(captures !== ""){
    			var monster_key_groups = [captures];
    		}else{
    			mon_num = 0;
    		}
            
    		if(mon_num !== 0){
    			// Remove shiny IDs from monsters
    			var keys = "";
    			for(i = 0; i < monster_key_groups.length; i++){
    				keys = monster_key_groups[i];
    				monster_key_groups[i] = keys.slice(0, -2);
    			}
    			
    			// Remove duplicate monsters and get the total number
    			var monster_key_groups_uniq = monster_key_groups.filter(onlyUnique);
    			mon_num = monster_key_groups_uniq.length;
    		}
    		
    		// Get the price
    		var rankPrices = [7500, 10000, 12500, 15000, 20000, 30000];
		    var result_price = rankPrices[monster_keys_array[0]];
    		
		    // If the user is a Merchant, check for abilities
			var user_data = lib.readFile(dir + "/stats.txt").split("|");
            if(user_data[0] == "Merchant"){
                if(parseInt(user_data[10]) >= 50){
                    result_price = Math.round(result_price * 0.87);
                }else if(parseInt(user_data[10]) >= 30){
                    result_price = Math.round(result_price * 0.93);
                }
            }
            
            // Increase price unless all monsters have been captured
            if(mon_num <= mon_total){
    		    result_price = result_price * 2;
    		}
			
			// Check if the user has enough Gold for the purchase
            if(parseInt(user_data[12]) >= result_price){
                // Update the user's gold
                user_data[12] = parseInt(user_data[12]) - result_price;
                lib.saveFile(dir + "/stats.txt", user_data.join("|"));
            }else{
                message.reply({ content: "\u274C You don't have enough Gold to make this purchase!", allowedMentions: { repliedUser: false }});
                return;
            }
		    
		    // Add it to the captures
		    captures = lib.readFile(dir + "/captures.txt");
		    if(captures === ""){
		        captures = monster_keys;
		    }else{
		        captures += ";" + monster_keys;
		    }
		    lib.saveFile(dir + "/captures.txt", captures);
		    
			// If the monster has never been captured before, add it to the "dex" as well
			var all_captures = lib.readFile(dir + "/all_captures.txt");
			if(!all_captures.includes(monster_keys)){
			   	if(all_captures === ""){
    				all_captures = monster_keys;
    			}else{
    				all_captures = all_captures + ";" + monster_keys;
    			}
    			lib.saveFile(dir + "/all_captures.txt", all_captures);
			}
			
			// Generate new shiny for the shop
			var rankChances = [30, 25, 20, 15, 7, 3];
			var rank = 0;
			var rankRand = lib.rand(1,100);
			var add_previous = 0;
		    for(y = 5; y > 0 && rank === 0; y--){
		        if(rankRand <= (rankChances[y] + add_previous)){
                    rank = y;
                }
                add_previous += rankChances[y];
		    }
		    var monster_groupsLimited = lib.readFile("data/monsters/monsters_0.txt").split("#################################################################################\n");
		    var monstersNew = monster_groupsLimited[rank].split(";\n");
            var monster_key = lib.rand(0, monstersNew.length - 2);
            var monster_info = monstersNew[monster_key].split("|");
            monster_key = monster_info[7];
            var newMonster = rank + "," + monster_key + ",1";
            lib.saveFile("data/shiny_shop.txt", newMonster);
            lib.saveFile("data/shiny_shop_user.txt", "");
			
			// Output
			message.reply({ content: "You've successfully purchased the **[Shiny " + monster_data[0] + "]** for " + result_price + " Gold!", allowedMentions: { repliedUser: false }});
            return;
	    }
        
        // Split shop data into variables
        var buying = shop_data[0];
        var selling = shop_data[1];
        var item1 = shop_data[2];
        var price1 = shop_data[3];
        var item2 = shop_data[4];
        var price2 = shop_data[5];
        var item3 = shop_data[6];
        var price3 = shop_data[7];
        var item4 = shop_data[8];
        var price4 = shop_data[9];
        var item5 = shop_data[10];
        var price5 = shop_data[11];
        
        // Always set the 6th item as Unique Fragment, the 7th as Mindwipe Tonic, the 8th as Reality Shifter, the 9th as Dimensional Fragment and the 10th as Stasis Cube
        var item6 = 324;
        var item6_data = item_array[item6].split("|");
        var price6 = item6_data[11];
        var item7 = 283;
        var item7_data = item_array[item7].split("|");
        var price7 = item7_data[11];
        var item8 = 286;
        var item8_data = item_array[item8].split("|");
        var price8 = item8_data[11];
        var item9 = 114;
        var item9_data = item_array[item9].split("|");
        var price9 = item9_data[11];
        var item10 = 227;
        var item10_data = item_array[item10].split("|");
        var price10 = item10_data[11];
        
        // Fetch item names
        var item1_data = item_array[item1].split("|");
        var item1_name = item1_data[0];
        var item2_data = item_array[item2].split("|");
        var item2_name = item2_data[0];
        var item3_data = item_array[item3].split("|");
        var item3_name = item3_data[0];
        var item4_data = item_array[item4].split("|");
        var item4_name = item4_data[0];
        var item5_data = item_array[item5].split("|");
        var item5_name = item5_data[0];
        var item6_name = item6_data[0];
        var item7_name = item7_data[0];
        var item8_name = item8_data[0];
        var item9_name = item9_data[0];
        var item10_name = item10_data[0];
        
        //Merge sold items into a list
        var offer_names = [item1_name, item2_name, item3_name, item4_name, item5_name, item6_name, item7_name, item8_name, item9_name, item10_name];
        var offers = offer_names.join("|").toLowerCase();
        var offer_keys = [item1, item2, item3, item4, item5, item6, item7, item8, item9, item10];
        var prices = [price1, price2, price3, price4, price5, price6, price7, price8, price9, price10];
        
        // Check if the user included an amount of items to buy
        var buyCount = 1;
        if(!isNaN(args[0])){
            buyCount = parseInt(args[0]);
            args.splice(0, 1);
        }
        
        // Check if the input can be matched to an item in the shop
        var allArgs = args.join(" ").toLowerCase();
        offers = "|" + offers + "|";
		if(args.length > 0 && offers.includes(allArgs)){
			var result_key = 0;
			var key = 0;
			if(offers.includes("|" + allArgs + "|")){
			    var item_names_array = offers.split("|");
				key = item_names_array.indexOf(allArgs);
			}else{
				var split = offers.split(allArgs);
				var left_side = split[0].replace(/[^|]/g, "");
				key = left_side.length;
			}
			
			key--;
			var result_key = offer_keys[key];
			var result_price = parseInt(prices[key]);
			
			// If the user is a Merchant, check for abilities
			var user_data = lib.readFile(dir + "/stats.txt").split("|");
            if(user_data[0] == "Merchant"){
                if(parseInt(user_data[10]) >= 50){
                    result_price = Math.round(result_price * 0.87);
                }else if(parseInt(user_data[10]) >= 30){
                    result_price = Math.round(result_price * 0.93);
                }
            }
			
			// Check if the user has enough Gold for the purchase
			result_price = result_price * buyCount;
            if(parseInt(user_data[12]) >= result_price){
                // Update the user's gold
                user_data[12] = parseInt(user_data[12]) - result_price;
                lib.saveFile(dir + "/stats.txt", user_data.join("|"));
                
                // Give them their purchased item
                var inv_path = dir + "/inventory.txt";
                var old_inventory = lib.readFile(inv_path);
                for(i = 0; i < buyCount; i++){
                    if(old_inventory !== "" && old_inventory !== undefined){
                        old_inventory += "," + result_key;
                    }else{
                        old_inventory = result_key;
                    }
                }
                lib.saveFile(inv_path, old_inventory);
                
                // Output
                message.reply({ content: "You purchased **[" + offer_names[key] + "] x " + buyCount + "** for **" + result_price + "** Gold!", allowedMentions: { repliedUser: false }});
                
            }else{
                message.reply({ content: "\u274C You don't have enough Gold to purchase this item!", allowedMentions: { repliedUser: false }});
            }
			
		}else{
		    message.reply({ content: "\u274C That item could not be found!", allowedMentions: { repliedUser: false }});
		}
        
	},
};