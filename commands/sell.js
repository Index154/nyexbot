var { prefix } = require('../config.json');

module.exports = {
	name: 'sell',
	usages: ['[number] [item name]'],
	descriptions: ['Attempts to sell consumables from your inventory to the shop'],
    shortDescription: 'Sell items',
    weight: 30,
    addendum: [
        '- If no number is given then the command defaults to one',
        '- Items generally sell for less Gold than you have to spend to buy them',
        '- You can view the current weekly selling price modifier with `{prefix}shop`',
        '- You can also `{prefix}buy` items from the shop'
    ],
    category: 'items',
	
	execute(message, user, args) {
        
        // Check if the server has a custom prefix and load it
        if(message.guild !== null){
            var serverID = message.guildId;
            if(fs.existsSync("./data/configs/" + serverID)){
                prefix = lib.readFile("./data/configs/" + serverID + "/prefix.txt");
            }
        }
        
        // Set important variables
        var dir = "userdata/" + user.id;
        
        // If the user isn't registered yet, stop the command
        if(!fs.existsSync(dir)){
            message.reply({ content: "\u274C Use `" + prefix + "encounter` first to create an account!", allowedMentions: { repliedUser: false }});
            return;
        }
	    
	    // If there was no input, end the command
	    if(args.length === 0 || args[0] === undefined){
	        message.reply({ content: "\u274C Please include an item you want to sell!", allowedMentions: { repliedUser: false }});
	        return;
	    }
	    
	    // Get all items
	    var item_array = lib.readFile("data/items.txt").split(";\n");
	    
	    // Generate new shop if necessary
        var week = lib.getWeek();
        var last_week = lib.readFile("data/shop_week.txt");
        if(last_week != week){
            var shop_data = lib.updateShop(item_array, week).split("|");
            lib.saveFile("data/shiny_shop.txt", shop_data[12]);
            lib.saveFile("data/shiny_shop_user.txt", "");
        }else{
            // Load existing shop
            var shop_data = lib.readFile("data/shop.txt").split("|");
        }
        
        // Get price modifier from shop data
        var buying = parseFloat(shop_data[0]);
	    
	    // Get a full list of all the user's items
        var inventory = lib.readFile(dir + "/inventory.txt");
        var items = lib.readFile("data/items.txt");
        var item_array = items.split(";\n");
        if(inventory.includes(",")){
            var item_keys = inventory.split(",");
        }else if(inventory !== ""){
            item_keys = [inventory];
        }else{
            message.reply({ content: "\u274C You don't have any sellable items!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // If the user is a Merchant, check for abilities
        var merch_mod = 1;
		var user_data = lib.readFile(dir + "/stats.txt").split("|");
        if(user_data[0] == "Merchant"){
            if(parseInt(user_data[10]) >= 50){
                merch_mod = 1.1;
            }else if(parseInt(user_data[10]) >= 30){
                merch_mod = 1.05;
            }
        }
        
        // Go through the item names and join them into a list
        var item_names = "";
		var key_count = item_keys.length;
		for(i = 0; i < key_count; i++){
			var loop_key = item_keys[i];
			var selected_item = item_array[loop_key];
			var item_values = selected_item.split("|");
			var item_name = item_values[0];
			
			if(i > 0){
				item_names = item_names + "|";
			}
			item_names = item_names + item_name;
		}
	    
	    // If the first argument is a number, use it as the amount to convert
        var count = 1;
        var first_arg = args[0].replace(/[^0-9]/g, "");
        if(first_arg !== "" && args.length > 1){
            count = parseInt(first_arg);
            args.splice(0,1);
        }
        allArgs = args.join(" ");
        allArgs = allArgs.toLowerCase();
        
        var item_names_lower = item_names.toLowerCase();
        item_names_lower = "|" + item_names_lower + "|";
	    // Check if the search can be matched to an item in the user's possession
		if(item_names_lower.includes(allArgs)){
			// First try searching for exact matches. If there is none, search for any matches
			var result_key = 0;
			var key = 0;
			if(item_names_lower.includes("|" + allArgs + "|")){
			    var item_names_array = item_names_lower.split("|");
				key = item_names_array.indexOf(allArgs);
			}else{
				var split = item_names_lower.split(allArgs);
				var left_side = split[0].replace(/[^|]/g, "");
				key = left_side.length;
			}
			
			key--;
			var inventory_array = inventory.split(",");
			result_key = inventory_array[key];
            
            
            // Modify the item's selling price based on the shop values
            var result_item = item_array[result_key];
            var result_item_data = result_item.split("|");
            var fluctuation = 1 + (parseInt(popularities[result_key]) * 0.01);
            var selling_price = Math.round(parseInt(result_item_data[11]) * 0.75 * buying * merch_mod * fluctuation);
            
            // If the user specified an item count, attempt to sell it multiple times, otherwise stop
            if(count > 1){
                // Check if the user has the item often enough
                var adc  = require('adc.js');
                var counted = new adc(inventory_array).count();
                var amount = counted[result_key];
                if(amount >= count){
                    selling_price = selling_price * count;
                }else{
                    message.reply({ content: "\u274C You don't have that many items!", allowedMentions: { repliedUser: false }});
                    return;
                }
            }
            
            // Remove the item/s from the user's inventory
            for(i = 0; i < count; i++){
                inventory_array.splice(inventory_array.indexOf(result_key), 1);
            }
            lib.saveFile(dir + "/inventory.txt", inventory_array);
            
            // Give the user their gold
            var user_data = lib.readFile(dir + "/stats.txt").split("|");
            user_data[12] = parseInt(user_data[12]) + selling_price;
            lib.saveFile(dir + "/stats.txt", user_data.join("|"));
            
            // Output
            message.reply({ content: "You sold **[" + result_item_data[0] + " x " + count + "]** for **" + selling_price + "** Gold!", allowedMentions: { repliedUser: false }});
            
		}else{
		    message.reply({ content: "\u274C That item could not be found!", allowedMentions: { repliedUser: false }});
		}
	},
};