var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'shop',
	usages: ['', 'shiny'],
	descriptions: ['Displays the current weekly shop', 'Displays the shiny shop'],
    shortDescription: 'Check the weekly shop',
    weight: 10,
    addendum: [
        '- You can use `{prefix}buy` and `{prefix}sell` to interact with the shop',
        '- The regular items on sale are randomized once every week',
        '- Some special items are always for sale',
        '- Also displays the weekly event realm (unique realm)',
        '- When a shiny is bought from the shop, it will be replaced by a new shiny',
        '- There may be slight price modifier fluctuations every week'
    ],
    category: 'info',
	
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
            current_event = unique_realms[new_id];
            
            // Update files
            lib.saveFile("data/weekly_realm.txt", current_event);
            lib.saveFile("data/realm_week.txt", week);
        }

        // Generate new shop if necessary
        var last_week = lib.readFile("data/shop_week.txt");
        if(last_week != week){
            var shop_data = lib.updateShop(item_array, week).split("|");
            var monster_keys = shop_data[12];
            lib.saveFile("data/shiny_shop.txt", monster_keys);
            lib.saveFile("data/shiny_shop_user.txt", "");
            shop_data.splice(12, 1);
        }else{
            // Load existing shop
            var shop_data = lib.readFile("data/shop.txt").split("|");
            var monster_keys = lib.readFile("data/shiny_shop.txt");
        }
        
        // If the user used the shiny argument, try to load the shiny shop
	    if(args[0] == "shiny"){
	        
    		// Get the price
    		var rankPrices = [7500, 10000, 12500, 15000, 20000, 30000];
		    var monster_keys_array = monster_keys.split(",");
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
            
            // Always show full price
            result_price = result_price * 2;
			
			// Get monster info for output
			var monster_groups = lib.readFile("data/monsters/monsters_shiny.txt").split("#################################################################################\n");
    		var monsters = monster_groups[monster_keys_array[0]].split(";\n");
    		var monster_data_raw = monsters[monster_keys_array[1]];
    		var monster_data = monster_data_raw.split("|");
    		var rarity_names = ["D", "C", "B", "A", "S", "SS"];
            var rarity = rarity_names[monster_keys_array[0]];
    		
    		// Get normal variant data for comparison
    		var reg_monster_groups = lib.readFile("data/monsters/monsters.txt").split("#################################################################################\n");
    		var reg_monsters = reg_monster_groups[monster_keys_array[0]].split(";\n");
    		var reg_monster_data = reg_monsters[monster_keys_array[1]].split("|");
    		
    		// Reserve the shiny for the user
    		lib.saveFile("data/shiny_shop_user.txt", user.id.toString());
    		
    		// Create embed
            var outputEmbed = new Discord.MessageEmbed()
            	.setColor('#8f1ee6')
            	.setTitle("Current shiny offer")
            	.setDescription("The thumbnail in the top right depicts the non-shiny version of the monster for comparison")
            	.setFooter({ text: "The price is halved for users who have reached 100% monster collection completion!" })
            	.setImage("https://cdn.discordapp.com/attachments/731848120539021323/" + monster_data[5])
            	.setThumbnail("https://cdn.discordapp.com/attachments/731848120539021323/" + reg_monster_data[5])
            	.addFields(
            	    { name: 'Name', value: monster_data[0], inline: true },
            		{ name: 'Price', value: result_price + " Gold", inline: true },
            		{ name: 'Rank', value: rarity, inline: true }
            	);
			
			// Create button
			var button1 = new MessageButton()
			.setCustomId(user.id + "|buy shinymon")
			.setLabel('Buy')
			.setStyle('SUCCESS')
			var row = new MessageActionRow().addComponents([button1]);
			
			// Output
			message.reply({ embeds: [outputEmbed], components: [row], allowedMentions: { repliedUser: false }});
            return;
	    }
        
        // Split shop data into variables
        var buying = parseFloat(shop_data[0]);
        var selling = parseFloat(shop_data[1]);
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
        
        // Always set the 6th item as Unique Fragment, the 7th as Mindwipe Tonic, the 8th as Reality Shifter, the 9th as Dimensional Fragment, the 10th as Stasis Cube and the 11th as Memory Fragment
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
        var item11 = 162;
        var item11_data = item_array[item11].split("|");
        var price11 = item11_data[11];
        
        // If the user is a Merchant, check for abilities
        var prices = [price1, price2, price3, price4, price5, price6, price7, price8, price9, price10, price11];
        var shopItems = [item1, item2, item3, item4, item5, item6, item7, item8, item9, item10, item11];
		var user_data = lib.readFile(dir + "/stats.txt").split("|");
		var prices_column = "Prices";
        if(user_data[0] == "Merchant" && user_data[10] >= 30){
            if(parseInt(user_data[10]) >= 50){
                merch_mod = 0.87;
            }else if(parseInt(user_data[10]) >= 30){
                merch_mod = 0.93;
            }
            
            prices_column = "Prices (lvl " + user_data[10] + " Merchant)";
            for(i = 0; i < prices.length; i++){
                price = Math.round(prices[i] * merch_mod);
            }
        }
        
        // Fetch item names
        var icon_array = {D: "<:real_black_circle:856189638153338900>", C: "\uD83D\uDD35", B: "\uD83D\uDFE2", A: "\uD83D\uDD34", S: "\uD83D\uDFE1", SS: "\uD83D\uDFE0", Special: "\u2728", Vortex: "\uD83C\uDF00"};
        var area_names = lib.readFile("data/area_names.txt").split(",");
        var item1_data = item_array[item1].split("|");
        var item1_name = icon_array[item1_data[12]] + item1_data[0];
        var item2_data = item_array[item2].split("|");
        var item2_name = icon_array[item2_data[12]] + item2_data[0];
        var item3_data = item_array[item3].split("|");
        var item3_name = icon_array[item3_data[12]] + item3_data[0];
        var item4_data = item_array[item4].split("|");
        var item4_name = icon_array[item4_data[12]] + item4_data[0];
        var item5_data = item_array[item5].split("|");
        var item5_name = icon_array[item5_data[12]] + item5_data[0];
        var item6_name = icon_array[item6_data[12]] + item6_data[0];
        var item7_name = icon_array[item7_data[12]] + item7_data[0];
        var item8_name = icon_array[item8_data[12]] + item8_data[0];
        var item9_name = icon_array[item9_data[12]] + item9_data[0];
        var item10_name = icon_array[item10_data[12]] + item10_data[0];
        var item11_name = icon_array[item11_data[12]] + item11_data[0];
        
        //Change price fluctuation format to %
        buying = Math.round(buying * 100 * 0.75);
        selling = Math.round(selling * 100);
        var t_buying = Math.round(buying * 0.35); // ???
        
        // Get current shiny
	    var monster_keys_array = monster_keys.split(",");
	    var monster_groups = lib.readFile("data/monsters/monsters_shiny.txt").split("#################################################################################\n");
		var monsters = monster_groups[monster_keys_array[0]].split(";\n");
		var monster_data_raw = monsters[monster_keys_array[1]];
		var monster_data = monster_data_raw.split("|");
        
        // Create embed
        var outputEmbed = new Discord.MessageEmbed()
        	.setColor('#0099ff')
        	.setTitle("This week's shop")
        	.setDescription("Buying regular consumable items at **" + buying + "%** price!\nSelling regular items at **" + selling + "%** price!\n**Weekly unique realm: " + area_names[parseInt(current_event)] + "**\n**Current shiny: " + monster_data[0] + "**")
        	.addFields(
        		{ name: 'Items for sale', value: item1_name + "\n" + item2_name + "\n" + item3_name + "\n" + item4_name + "\n" + item5_name + "\n\u200B\n" + item6_name + "\n" + item7_name + "\n" + item8_name + "\n" + item9_name + "\n" + item10_name + "\n" + item11_name, inline: true },
        		{ name: prices_column, value: prices[0] + " Gold\n" + prices[1] + " Gold\n" + prices[2] + " Gold\n" + prices[3] + " Gold\n" + prices[4] + " Gold\n\u200B\n" + prices[5] + " Gold\n" + prices[6] + " Gold\n" + prices[7] + " Gold\n" + prices[8] + " Gold\n" + prices[9] + " Gold\n" + prices[10] + " Gold", inline: true }
        	);
        
        //Send embed output
        message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false }});
        
	},
};