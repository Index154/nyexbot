// Input: 
    // Dependency: 
    // Function: 
    // Output: 

module.exports = {
	
    // Input: String, String
    // Dependency: fs
    // Function: Saves the contents in the filepath
    saveFile(path, contents){
	contents = contents.toString();
        fs.writeFile(path, contents, function(err) {
            if(err) {
                console.error(Date() + " - writeFile error: ");
				console.error(err);
            }
        });
    },
    
    // Input: String
    // Dependencies: fs and lib itself
    // Function: Reads the file in the filepath
    // Output: String (?)
    readFile(path){
        try {
            const data = fs.readFileSync(path, 'utf8')
            return data
        } catch (err) {
            console.error(Date() + " - readFile error: ");
			console.error(err);
			return "";
        }
    },
    
    // Input: Number, number
    // Function: Picks a random number between the two inputs (inclusive)
    // Output: Number
    rand(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
		if(max < min){
			console.error(Date() + " - rand() Error: Max is smaller than min");
		}
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // Input: Array, string
    // Dependency: adc.js
    // Function: Counts occurrence of a string in an array
    // Output: Number
    countInArray(pattern, list){
        var count = 0;
        if(list.includes(pattern)){
            var counts = new adc(list).count();
            count = counts[pattern];
        }
        return count;
    },
    
    // Input: String
    // Function: Checks whether "an" is needed instead of "a" before the given word
    // Output: String
    nCheck(name){
        var first_letter = name.substring(0, 1);
        if(first_letter == "A" || first_letter == "E" || first_letter == "I" || first_letter == "O" || first_letter == "U"){
            return "n";
        }else{
            return "";
        }
    },
    
    // Function: Gets the amount of weeks that have passed since Monday, December 29th 1969
    // Output: Number
    getWeek(){
        var d = new Date();
        var week = Math.floor((d.getTime() + (3 * 86400000)) / 604800000 );
        return week;
    },
    
    // Input: Array, Number
    // Dependency: lib itself (must not be var nor const)
    // Function: Generates a shop
    // Output: String
    updateShop(item_array, week){
        lib.saveFile("data/shop_week.txt", week);
        // Define shop pools
        var common = [3, 7, 15, 17, 18, 19, 27, 28, 37, 40, 78, 80, 81, 82, 84, 86, 87, 89, 91, 95, 101];
        var uncommon = [4, 12, 13, 38, 42, 75, 76, 77, 88, 92, 93, 104, 105, "lure", "lure", "lure", "lure", "lure", "lure"];
        var rare = [26, 30, 52, 74, 106, 107, 110, 344, 345];
        var lures = [326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 339, 341, 342, 343];
        
        // Define possible price fluctuations
        var common_p = [0.97, 0.98, 0.99, 1, 1, 1, 1.01, 1.02, 1.03];
        var uncommon_p = [0.93, 1.07];
        var rare_p = [0.87, 0.88, 1.12, 1.13];
        
        // Choose items
        var item1 = "";
        var item2 = "";
        var item3 = "";
        var item4 = "";
        var item5 = "";
        for(i = 0; i < 5; i++){
            // Pick the pool
            var i_roll = lib.rand(1,100);
            if(i_roll <= 10){
                var i_pool = rare;
            }else if(i_roll <= 35){
                var i_pool = uncommon;
            }else{
                var i_pool = common;
            }
            // Pick the result
            var i_roll2 = lib.rand(0, i_pool.length - 1);
            var result = i_pool[i_roll2];
            i_pool.splice(i_roll2, 1);
            
            // Check for lures and get a random sub-lure
            if(result == "lure"){
                var lure_roll = lib.rand(0, lures.length - 1);
                result = lures[lure_roll];
                lures.splice(lure_roll, 1);
            }
            
            if(i == 0){item1 = result;}else
            if(i == 1){item2 = result;}else
            if(i == 2){item3 = result;}else
            if(i == 3){item4 = result;}else
            {item5 = result;}
        }
        
        // Fetch item prices
        var item1_data = item_array[item1].split("|");
        var price1 = item1_data[11];
        var item2_data = item_array[item2].split("|");
        var price2 = item2_data[11];
        var item3_data = item_array[item3].split("|");
        var price3 = item3_data[11];
        var item4_data = item_array[item4].split("|");
        var price4 = item4_data[11];
        var item5_data = item_array[item5].split("|");
        var price5 = item5_data[11];
        
        // Generate price fluctuations
        var buying = 1;
        var selling = 1;
        for(y = 0; y < 2; y++){
            // Pick the pool
            var p_roll = lib.rand(1,10);
            if(p_roll <= 1){
                var p_pool = rare_p;
            }else if(p_roll <= 4){
                var p_pool = uncommon_p;
            }else{
                var p_pool = common_p;
            }
            // Pick the result
            var p_roll2 = lib.rand(0, p_pool.length - 1);
            var result = p_pool[p_roll2];
            if(y == 0){
                buying = result;
            }else{
                selling = result;
            }
        }
        // Apply price fluctuations
        price1 = Math.round(price1 * selling);
        price2 = Math.round(price2 * selling);
        price3 = Math.round(price3 * selling);
        price4 = Math.round(price4 * selling);
        price5 = Math.round(price5 * selling);
        
        // Also update shiny shop
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
	    var monster_groups = lib.readFile("data/monsters/monsters_0.txt").split("#################################################################################\n");
	    var monstersNew = monster_groups[rank].split(";\n");
        var monster_key = lib.rand(0, monstersNew.length - 2);
        var monster_info = monstersNew[monster_key].split("|");
        monster_key = monster_info[7];
        var newMonster = rank + "," + monster_key + ",1";
        lib.saveFile("data/shiny_shop_user.txt", "");
        
        // Save shop
        var shop_data = buying + "|" + selling + "|" + item1 + "|" + price1 + "|" + item2 + "|" + price2 + "|" + item3 + "|" + price3 + "|" + item4 + "|" + price4 + "|" + item5 + "|" + price5;
        lib.saveFile("data/shop.txt", shop_data);
        return shop_data + "|" + newMonster;
    },
    
    // Input: Array, array, string, string
    // Function: Checks for levelups, creates an output message and modifies stats if necessary
    // Output: Object containing String and array
    levelCheck(levels, stats, levelup_extra, prefix, dir){
        // Get total quest count and user completion for level cap
		var quests = lib.readFile("data/quests.txt").split(";\n");
		var quest_total = quests.length;
		var quest_num = parseInt(lib.readFile(dir + "/current_quest.txt"));
        var canLevel = true;
        if(parseInt(stats[10]) >= 50 && quest_num < quest_total){canLevel = false;}
        
        if(parseInt(stats[10]) >= 50){var for_levelup = parseInt(levels[50]) + (400 * (parseInt(stats[10]) - 50));}
        else{var for_levelup = levels[stats[10]];}
        var user_level_old = parseInt(stats[10]);
        var trophy_extra = "";
        while(canLevel && parseInt(stats[11]) >= for_levelup){
            stats[10] = parseInt(stats[10]) + 1;
            stats[11] = parseInt(stats[11]) - for_levelup;
            levelup_extra = "As a result you leveled up!";
            if(stats[10] >= 50){for_levelup = parseInt(levels[50]) + (100 * (stats[10] - 50));}
            else{for_levelup = levels[stats[10]];}
            
            // If the user reached a level milestone, tell them!
            var user_level = stats[10];
            if(user_level >= 5 && user_level_old < 5){
                levelup_extra = levelup_extra + "\n__From now on you may use__ `" + prefix + "radar` __to increase your chance of encountering shinies!__";
            }else
            if(user_level >= 10 && user_level_old < 10){
                levelup_extra = levelup_extra + "\n__You may now use__ `" + prefix + "class` __to select a character class!__";
                trophy_extra = "You've also received the trophy **\u2747<:real_black_circle:856189638153338900>EXP Collector**|10";
            }else
            if(user_level >= 15 && user_level_old < 15){
                levelup_extra = levelup_extra + "\n__From now on you may use__ `" + prefix + "fullradar` __as a more efficient alternative to the radar in exchange for some Gold!__";
            }else
            if(user_level >= 20 && user_level_old < 20){
                levelup_extra = levelup_extra + "\n__From now on you may use__ `" + prefix + "research` __to gain various rewards in exchange for Scrap!__\n(Convert materials into Scrap with `" + prefix + "materials convert [amount] [name]`)";
                trophy_extra = "You've also received the trophy **\u2747\uD83D\uDD35EXP Collector**!|20";
            }else
            if(user_level >= 30 && user_level_old < 30){
                // If the user reached level 30, give them their boost
                var ab_name = "";
                var ab_desc = "";
                if(stats[0] == "Warrior"){
                    ab_name = "Aggressive Aura";
                    ab_desc = "You're more likely to attract stronger monsters!";
                    stats[4] = parseInt(stats[4]) + 5;
                }else
                if(stats[0] == "Thief"){
                    ab_name = "Looting";
                    ab_desc = "You're more likely to receive item drops!";
                    stats[5] = parseInt(stats[5]) + 6;
                }else
                if(stats[0] == "Tamer"){
                    ab_name = "Radar Master";
                    ab_desc = "From now on you will get more daily radar charges!";
                }else
                if(stats[0] == "Alchemist"){
                    ab_name = "Advanced Alchemy";
                    ab_desc = "Items will now rarely not be consumed upon use!";
                }else
                if(stats[0] == "Merchant"){
                    ab_name = "Bargaining";
                    ab_desc = "Your items will now sell for more and purchases at the shop will be cheaper!";
                }else
                if(stats[0] == "Craftsman"){
                    ab_name = "Nimble Fingers";
                    ab_desc = "Converting materials and equipment will now yield more Scrap!";
                }
                trophy_extra = "You've also received the trophy **\u2747\uD83D\uDFE2EXP Collector**!|30";
                levelup_extra = levelup_extra + "\nYou got a new ability: **[" + ab_name + "]**: " + ab_desc;
            }else
            if(user_level >= 40 && user_level_old < 40){
                trophy_extra = "You've also received the trophy **\u2747\uD83D\uDD34EXP Collector**!|40";
            }else
            if(user_level >= 50 && user_level_old < 50){
                // If the user reached level 50, tell them about their new ability
                var ab_name = "";
                var ab_desc = "";
                if(stats[0] == "Warrior"){
                    ab_name = "Overwhelming Strength";
                    ab_desc = "Your chance to win fights now has a higher cap!";
                }else
                if(stats[0] == "Thief"){
                    ab_name = "Superior Dexterity";
                    ab_desc = "Your chance to win fights now has a higher cap!";
                }else
                if(stats[0] == "Tamer"){
                    ab_name = "Monster Affinity";
                    ab_desc = "Your chance to capture monsters now has a higher cap!";
                }else
                if(stats[0] == "Alchemist"){
                    ab_name = "Master Alchemy";
                    ab_desc = "Increased chances for both of your other abilities to activate!";
                }else
                if(stats[0] == "Merchant"){
                    ab_name = "Silver Tongue";
                    ab_desc = "You items will now sell for even more Gold and purchases at the shop will be even cheaper!";
                }else
                if(stats[0] == "Craftsman"){
                    ab_name = "Master Craftsmanship";
                    ab_desc = "Increased chance for crafting ingredients not to be consumed and you also gain even more Scrap upon conversion!";
                }
                trophy_extra = "You've also received the trophy **\u2747\uD83D\uDFE1EXP Collector**!|50";
                levelup_extra = levelup_extra + "\nYou've unlocked a new ability: **[" + ab_name + "]**: " + ab_desc + "\nFrom now on your level is locked until you've completed all quests. After completing all quests you can earn stat points by leveling up!";
            }else if(user_level > 50 && user_level_old >= 50){
                if(user_level >= 60 && user_level_old < 60){
                    trophy_extra = "You've also received the trophy **\u2747\uD83D\uDFE0EXP Collector**!|60";
                }else
                if(user_level >= 70 && user_level_old < 70){
                    trophy_extra = "You've also received the trophy **\u2747\uD83D\uDFE0EXP Collector**!|70";
                }else
                if(user_level >= 80 && user_level_old < 80){
                    trophy_extra = "You've also received the trophy **\u2747\uD83D\uDFE0EXP Collector**!|80";
                }else
                if(user_level >= 90 && user_level_old < 90){
                    trophy_extra = "You've also received the trophy **\u2747\uD83D\uDFE0EXP Collector**!|90";
                }else
                if(user_level >= 100 && user_level_old < 100){
                    trophy_extra = "You've also received the trophy **\u2747\uD83D\uDFE0EXP Collector**!|100";
                }
                levelup_extra += "\n**You have received a stat point!**";
                stats[13] = parseInt(stats[13]) + 1;
            }
        }
        
        return { levelup_extra, stats, trophy_extra};
    },
	
	// Input: Array, integer, object, string, object, string
    // Function: Creates a paged embed with buttons using another module
	createPagedEmbed(paginationArray, elementsPerPage, embedTemplate, fieldTitle, message){
		const { MessageEmbed, MessageButton } = require('discord.js');
		
		// Create embed page field contents
		var ongoingID = 0;
		var pageCount = Math.ceil(paginationArray.length / elementsPerPage);
		if(pageCount < 1){pageCount = 1;}
		pages = [];
		embedTemplate.addFields(
			{ name: fieldTitle, value: "e", inline: false }
		);
		for(i = 0; i < pageCount; i++){
			var pageList = "";
			if(i == pageCount - 1 && paginationArray.length % elementsPerPage !== 0){ elementsPerPage = paginationArray.length % elementsPerPage;}
			for(y = 0; y < elementsPerPage; y++){
				pageList += "\n" + paginationArray[ongoingID];
				ongoingID++;
			}
			pages.push(pageList);
		}
		
		// Create buttons
		const button1 = new MessageButton()
			.setCustomId('previousbtn')
			.setLabel('Previous')
			.setStyle('SECONDARY');
		const button2 = new MessageButton()
			.setCustomId('nextbtn')
			.setLabel('Next')
			.setStyle('SECONDARY');
		buttonList = [ button1, button2 ];
		
		// Send embed
		lib.embedFieldPagination(message, embedTemplate, pages, buttonList, 30000);
	},
	
	// Input: Array, object, integer, object, ?, ?, ?, string, string, object
    // Function: Creates a paged embed with buttons using another module
	createPagedMonsterEmbed(idArray, embedTemplate, startingId, message, monster_groups, monster_names2, items, username, startingName, firstButton, firstAltImage){
		const { MessageEmbed, MessageButton } = require('discord.js');
		
		var shinies = lib.readFile("data/monsters/monsters_shiny.txt");
		var shiny_groups = shinies.split("#################################################################################\n");

		// Create embeds
		var pages = [];
		var shinyButtons = [];
		var alternateImages = [];
		pages[startingId] = embedTemplate;
		shinyButtons[startingId] = firstButton;
		alternateImages[startingId] = firstAltImage;
		var startingMod = 1;
		if(startingId + 1 == idArray.length){startingMod = -1 * startingId;}
		for(i = startingId + startingMod; i < idArray.length && (i > startingId || i < startingId); ){
			
			var result_keys = idArray[i].split(",");
			var monsters_array = monster_groups[result_keys[0]].split(";\n");
			var shinies_array = shiny_groups[result_keys[0]].split(";\n");
			// The monster's data has been retrieved!
			var result_monster = monsters_array[result_keys[1]];
			
			// Get embed color
            var embed_colors = ["#b0b0b0", "#0099ff", "#2AA189", "#b80909", "#e3b712", "#e39f0e"];
            var embed_color = embed_colors[result_keys[0]];
			
			// If the monster is shiny, get the shiny entry instead
			var altIndex = "None";
			var altImage = "Not owned";
			if(result_keys[2] == "1"){
			    embed_color = "#8f1ee6";
				result_monster = shinies_array[result_keys[1]];
				
				// Check if the user has the normal variant as well and find its page number as well as its thumbnail
				var altId = result_keys[0] + "," + result_keys[1] + "," + 0;
				if(idArray.includes(altId)){
				    altIndex = idArray.indexOf(altId);
					altImage = "https://cdn.discordapp.com/attachments/731848120539021323/" + monsters_array[result_keys[1]].split("|")[5];
				}
				
			}else{
			    // Check if the user has the shiny variant as well and find its page number
				var altId = result_keys[0] + "," + result_keys[1] + "," + 1;
				if(idArray.includes(altId)){
				    altIndex = idArray.indexOf(altId);
					altImage = "https://cdn.discordapp.com/attachments/731848120539021323/" + shinies_array[result_keys[1]].split("|")[5];
				}
			}
			var monster_info = result_monster.split("|");
			
			// Push variant switch button to array
			var button5 = new MessageButton()
    			.setCustomId('comparebtn|' + altIndex)
    			.setLabel('Switch')
    			.setStyle('PRIMARY');
    		shinyButtons[i] = button5;
			alternateImages[i] = altImage;
			
			// Get rarity
            var rarity_names = ["D", "C", "B", "A", "S", "SS"];
            var rarity = rarity_names[result_keys[0]];
            if(result_keys[2] == "1"){
                rarity = rarity + "++";
            }
			
			// Add types
			if(monster_info[3].includes(",")){
			    var types = monster_info[3].split(",");
			    type = types.join(", ");
			}else{
			    type = monster_info[3];
			}
			
			// Assemble embed
            var outputEmbed = new MessageEmbed()
            	.setColor(embed_color)
            	.setTitle(monster_info[0])
            	.setImage("https://cdn.discordapp.com/attachments/731848120539021323/" + monster_info[5]) //Alternative source (server): 'https://indexnight.com/monsters/' + monster_info[0].toLowerCase().replace(/ /g, "_") + ".png"
            	.setDescription(monster_info[4])
            	.addFields(
            		{ name: 'Attack', value: monster_info[1], inline: true },
            		{ name: 'Speed', value: monster_info[2], inline: true },
            		{ name: "Rank", value: rarity, inline: true},
            		{ name: 'Type', value: type, inline: true }
            	)
			
			// Get item drops and add them
			if(result_keys[2] == "1"){
			    // Shiny drop item
			    var drop_pool = ["106", "100"];
			}else{
			    var drop_pool_groups = lib.readFile("data/drops.txt").split("#######################\n");
			    var drop_pools = drop_pool_groups[result_keys[0]].split(";\n");
			    var drop_pool = drop_pools[result_keys[1]].split("|");
			}
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
			var capture_count = captures_counts[monster_info[0]] - 1; // Subtract one because of all_captures.txt
			outputEmbed
			    .addFields( { name: username + "'s capture count", value: capture_count.toString(), inline: true } );
			
			// Add to list
			pages[i] = outputEmbed;
			i++;
			if(i === idArray.length){i = 0;}
		}
		
		// Create buttons
		const button1 = new MessageButton()
			.setCustomId('previousbtn')
			.setLabel('Previous')
			.setStyle('SECONDARY');
		const button2 = new MessageButton()
			.setCustomId('randbtn')
			.setLabel('Random')
			.setStyle('PRIMARY');
		const button3 = new MessageButton()
			.setCustomId('nextbtn')
			.setLabel('Next')
			.setStyle('SECONDARY');
		if(!lib.exists(message.author)){message.author = message.user;}
		const button4 = new MessageButton()
			.setCustomId(message.author.id + '|captures favorite ' + startingName)
			.setLabel('Favorite')
			.setStyle('SUCCESS');
		buttonList = [ button1, button2, button3, button4 ];
		
		// Send embed
		lib.monsterPagination(message, pages, buttonList, startingId, 30000, shinyButtons, alternateImages);
	},
	
	// Input: Array, string, integer, object
    // Function: Creates a paged embed with buttons using another module
	createPagedNightEmbed(entryList, stringTemplate, startingId, message){
		const { MessageEmbed, MessageButton } = require('discord.js');
		
		// Create embeds
		var pages = [];
		pages[startingId] = stringTemplate;
		var startingMod = 1;
		if(startingId + 1 == entryList.length){startingMod = -1 * startingId;}
		for(i = startingId + startingMod; i < entryList.length && (i > startingId || i < startingId); ){
			// Add to list
			pages[i] = entryList[i];
			i++;
			if(i === entryList.length){i = 0;}
		}
		
		// Create buttons
		const button1 = new MessageButton()
			.setCustomId('previousbtn')
			.setLabel('Previous')
			.setStyle('SECONDARY');
		const button2 = new MessageButton()
			.setCustomId('nextbtn')
			.setLabel('Next')
			.setStyle('SECONDARY');
		const button3 = new MessageButton()
			.setCustomId('randbtn')
			.setLabel('Random')
			.setStyle('PRIMARY')
		buttonList = [ button1, button3, button2 ];
		
		// Send embed
		lib.embedlessPagination(message, pages, buttonList, startingId, 30000);
	},

	// Input: String, ?, ?, integer, object, object, ?
	// Function: Creates a paged embed with a specific layout for the display of item details. The list of items has to be supplied by the calling function
	createPagedItemEmbed(dir, items, allItems, startingId, message, user, itemList){
		const { MessageEmbed, MessageButton } = require('discord.js');

		// Important variables
		var equipRarities = lib.readFile(dir + "/equip_modifiers.txt").split("\n");
		var statNames = ["Filler", "Attack", "Speed", "Mana", "Monster Luck", "Drop Luck", "Rare Luck", "Unnamed"];

		// Create embeds
		var embeds = [];
		for(i = startingId; !lib.exists(embeds[i]); ){
			var itemData = itemList[items[i]].split("|");
			var itemTitle = itemData[0];
			var itemType = "\uD83C\uDF6F Consumable";
			var itemAbilityOrUseAmount = "";
			var itemValue = "\u200b";
			var itemAmount = "\u200b";

			// Assemble embed
            var embed = new MessageEmbed()
            	.setColor('#0099ff');

			// Apply modifier stats
			var modifierData = equipRarities[0].split("|");
			if(itemData[10] == "Defense" || itemData[10] == "Tool" || itemData[10] == "Weapon"){
				if(itemData[10] == "Defense"){modifierData = equipRarities[1].split("|");}else
				if(itemData[10] == "Tool"){modifierData = equipRarities[2].split("|");}
				// Also re-format the modifier data for displaying later
				for(o = 1; o < modifierData.length; o++){
					itemData[i] = (parseInt(itemData[i]) + parseInt(modifierData[o])).toString();
					if(parseInt(modifierData[o]) === 0){modifierData[o] = "";}
					else{
						if(modifierData[o].includes("-")){modifierData[o] = "(" + modifierData[o] + ")";}
						else{modifierData[o] = "(+" + modifierData[o] + ")";}
					}
				}
				
				// Prepare ability variables
				var abilities = lib.readFile("data/abilities.txt").split("######################################\n");
			}

			if(itemData[10] == "Weapon"){
				itemTitle = equipRarities[0].split("|")[0] + itemTitle;
				itemType = "\u2694 Weapon";

				// Add ability if needed
				var itemAbilities = abilities[0].split(";\n");
				var abilityName = itemAbilities[parseInt(itemData[11])];
				if(abilityName != "None"){
					itemAbilityOrUseAmount = "**Ability:** " + abilityName;
				}
					
			}else if(itemData[10] == "Defense"){
				itemTitle = equipRarities[1].split("|")[0] + itemTitle;
				itemType = "\uD83D\uDEE1 Defensive equipment";

				// Add ability if needed
				var itemAbilities = abilities[1].split(";\n");
				var abilityName = itemAbilities[parseInt(itemData[11])];
				if(parseInt(abilityName) !== 0){
					itemAbilityOrUseAmount = "**Ability Modifier:** " + abilityName;
				}
				
			}else if(itemData[10] == "Tool"){
				itemTitle = equipRarities[2].split("|")[0] + itemTitle;
				itemType = "\uD83D\uDCA0 Divine tool";

				// Add ability
				var itemAbilities = abilities[2].split(";\n");
				var abilityName = itemAbilities[parseInt(itemData[11])];
				itemAbilityOrUseAmount = "**Ability activation:** " + abilityName;
					
			}else{
				// It is a consumable (possibly a special one though)
					
				var item_subinfo = itemData[10].split(",");
				if(itemData[10].includes("Ability") || itemData[10].includes("Vortex") || itemData[10].includes("Realm") || itemData[10].includes("Stasis") || itemData[10].includes("Mindwipe") || itemData[10].includes("Shifter") || itemData[10].includes("Memory")){
					itemAbilityOrUseAmount = "(Instant effect)";
				}else{
					// Add use duration / charge amount otherwise
					if(itemData[10].includes("Charge")){
						itemAbilityOrUseAmount = "**Charge Amount:** ";
					}else if(itemData[10].includes("Token")){
						itemAbilityOrUseAmount = "**Token Value:** ";
					}else{
						itemAbilityOrUseAmount = "**Use Duration:** ";
					}
					itemAbilityOrUseAmount += item_subinfo[1];
				}
				
				// Add price and item count
				itemValue =  "**Value:** " + itemData[11] + " Gold";
				var itemCounts = new adc(allItems).count();
				itemAmount = "**Your amount:** " + itemCounts[items[i]].toString();
			}
			
			var itemStats = "";
			for(x = 1; x < 7; x++){
				statDetails = "\u200b\n";
				if(parseInt(itemData[x]) != 0){statDetails = statNames[x] + ": " + itemData[x] + "\n";}
				itemStats += statDetails;
			}
			if(itemStats.split("\u200b").length == 7){
				itemStats = "\u200b\n\u200b\nThis item does not grant a stat buff\n\u200b\n\u200b\n\u200b\n";
			}

			embed
				.setDescription(itemData[9] + "\n\n**Type:** " + itemType + "\n" + itemAbilityOrUseAmount + "\n" + itemValue + "\n" + itemAmount + "\n\n__**Stats**__" + "```\n" + itemStats + "\n```")
				.setTitle(itemTitle);

			embeds[i] = embed;
			i++;
			if(i >= items.length){i = 0;}
		}

		// Create buttons
		const button1 = new MessageButton()
			.setCustomId('previousbtn')
			.setLabel('Previous')
			.setStyle('SECONDARY');
		const button2 = new MessageButton()
			.setCustomId('randbtn')
			.setLabel('Random')
			.setStyle('PRIMARY');
		const button3 = new MessageButton()
			.setCustomId('nextbtn')
			.setLabel('Next')
			.setStyle('SECONDARY');
		buttonList = [ button1, button2, button3 ];

		// Go to secondary function
		lib.preparedEmbedPagination(user, message, embeds, buttonList, startingId, 30000);
	},

	// Input: Message object, array of embed objects
	// Function: Combines multiple different embeds into one message and allows switching through them with buttons
	createSimplePagedEmbed(message, embeds){
		const { MessageEmbed, MessageButton } = require('discord.js');

		// Create buttons
		const button1 = new MessageButton()
			.setCustomId('previousbtn')
			.setLabel('Previous')
			.setStyle('SECONDARY');
		const button2 = new MessageButton()
			.setCustomId('nextbtn')
			.setLabel('Next')
			.setStyle('SECONDARY');
		buttonList = [ button1, button2 ];

		// Go to secondary function
		lib.fullEmbedPagination(message, embeds, buttonList, timeout = 120000);
	},

	// Input: Object, object, array
    // Function: Sends a message with command buttons that time out
	async buttonReply(message, embeds, buttons){
		const row = new MessageActionRow().addComponents(buttons);
		const newMessage = await message.reply({
			embeds: embeds,
			components: [row],
			allowedMentions: { repliedUser: false },
			fetchReply: true,
		});

		if(!lib.exists(message.author)){message.author = message.user;}
		const filter = (i) =>
			i.user.id === message.author.id;

		const collector = await newMessage.createMessageComponentCollector({
			filter,
			time: 20000,
		});

		collector.on("collect", async (i) => {
			for(y = 0; y < buttons.length; y++){
				buttons[y].setDisabled(true);
			}
			var disabledRow = new MessageActionRow().addComponents(buttons);
			newMessage.edit({
				embeds: embeds,
				components: [disabledRow],
			});
			collector.stop();
		});

		collector.on("end", () => {
			for(y = 0; y < buttons.length; y++){
				buttons[y].setDisabled(true);
			}
			var disabledRow = new MessageActionRow().addComponents(buttons);
			newMessage.edit({
				embeds: embeds,
				components: [disabledRow],
			});
		});

	},
	
	// Input: Object, string, array
    // Function: Sends a message with command buttons that time out (without embed)
	async buttonReplyBasic(message, content, buttons){
		const row = new MessageActionRow().addComponents(buttons);
		const newMessage = await message.reply({
			content: content,
			components: [row],
			allowedMentions: { repliedUser: false },
			fetchReply: true,
		});

		if(!lib.exists(message.author)){message.author = message.user;}
		const filter = (i) =>
			i.user.id === message.author.id

		const collector = await newMessage.createMessageComponentCollector({
			filter,
			time: 20000,
		});

		collector.on("collect", async (i) => {
			for(y = 0; y < buttons.length; y++){
				buttons[y].setDisabled(true);
			}
			var disabledRow = new MessageActionRow().addComponents(buttons);
			newMessage.edit({
				content: content,
				components: [disabledRow],
			});
			collector.stop();
		});

		collector.on("end", () => {
			for(y = 0; y < buttons.length; y++){
				buttons[y].setDisabled(true);
			}
			var disabledRow = new MessageActionRow().addComponents(buttons);
			newMessage.edit({
				content: content,
				components: [disabledRow],
			});
		});

	},
	
	// Input: Number
    // Function: Turns an amount of seconds into a self-adjusting time format
    // Output: String
	secondsToTime(input){
	    // Get individual fragments
	    input = Math.floor(parseInt(input));
		var years = Math.floor(input / 31536000);
		input -= years * 31536000;
	    var days = Math.floor(input / 86400);
	    input -= days * 86400;
	    var hours = Math.floor(input / 3600);
	    input -= hours * 3600;
	    var minutes = Math.floor(input / 60);
	    input -= minutes * 60;
	    
	    // Grammar fix
	    var yearS = "s", dayS = "s", hourS = "s", minS = "s", secS = "s";
		if(years == 1){yearS = "";}
	    if(days == 1){dayS = "";}
	    if(hours == 1){hourS = "";}
	    if(minutes == 1){minS = "";}
	    if(input == 1){secS = "";}
	    
	    // Prepare output. Anything that is <= 0 is implied to be 0 so it is not included in the output
	    var output = "";
		if(years > 0){
			output += years + " year" + yearS;
		}
	    if(days > 0){
			if(output != ""){output += ", ";}
			output += days + " day" + dayS;
		}
	    if(hours > 0){
			if(output != ""){output += ", ";}
			output += hours + " hour" + hourS;
		}
	    if(minutes > 0){
			if(output != ""){output += ", ";}
			output += minutes + " minute" + minS;
		}
	    if(input > 0){
			if(output != ""){output += ", ";}
			output += input + " second" + secS;
		}
	    
	    // Replace the last comma in the output with &
	    output = output.replace(/\,(?=[^,]*$)/, " &");
	    return output;
	},
	
	// Input: Anything
    // Function: Checks if a given varibale is defined
    // Output: Boolean
	exists(input){
	    // Check if input exists
	    if(input !== "" && input !== null && input !== undefined && input !== NaN){
	        return true;
	    }else{
	        return false;
	    }
	},
	
	// Input: Integer
    // Function: Generates a random equipment item modifier with bonus stats
    // Output: String
	generateModifier(gLuck){
	    // Define modifier list and logic
	    var rarities = ["Legendary ", "Rare ", "Uncommon "];
		var rarityChances = [1, 5, 10];
		var uncommonStats = ["1*4", "2*2", "1*-4|2*4"];
		var rareStats = ["2*4", "2*4", "2*4", "2*4", "1*-4|3*4", "1*-4|2*6"];
		var legendaryStats = ["3*4", "3*4", "2*6", "2*6", "1*-4|4*4", "1*-4|2*8"];
		var normalStats = ["0*0"];
	    
	    // Determine modifier
	    var rand = lib.rand(1, 100);
		var rarity = "";
		var add = Math.round(parseInt(gLuck) / 10);
		for(i = 0; rarity === "" && i < 3; i++){
			if(rand <= rarityChances[i] + add){rarity = rarities[i];}
			add += rarityChances[i];
		}
		
		// Determine modifier stat distribution
		if(rarity == "Uncommon "){
			var statPresets = uncommonStats;
		}else if(rarity == "Rare "){
			var statPresets = rareStats;
		}else if(rarity == "Legendary "){
			var statPresets = legendaryStats;
		}else{
		    statPresets = normalStats;
		}
		var distribution = statPresets[lib.rand(0, statPresets.length - 1)];
		
		// Determine stats
		var statList = [0, 1, 2, 3, 4, 5]
		var bonusStats = [0, 0, 0, 0, 0, 0];
		var changes = [];
		if(distribution.includes("|")){
			distribution = distribution.split("|");
			var firstDist = distribution[0].split("*");
			var secondDist = distribution[1].split("*");
			for(i = 0; i < parseInt(firstDist[0]); i++){
				changes.push(parseInt(firstDist[1]));
			}
			for(i = 0; i < parseInt(secondDist[0]); i++){
				changes.push(parseInt(secondDist[1]));
			}
		}else{
			var firstDist = distribution.split("*");
			for(i = 0; i < parseInt(firstDist[0]); i++){
				changes.push(parseInt(firstDist[1]));
			}
		}
		
		// Distribute stats
		for(z = 0; z < changes.length; z++){
			var id = lib.rand(0, statList.length - 1);
			bonusStats[statList[id]] = changes[z];
			statList.splice(id, 1);
		}
		
		// Finalize and return
		return rarity + "|" + bonusStats.join("|");
	},

	// Input: String, object, array
    // Dependency: readFile, createPagedNightEmbed
    // Function: Gets one or more results from a list of quotes/clips/images/etc.
	searchableList(fileName, message, args){
		// Load all things as a list and turn it into a String for searching
		var thingList = lib.readFile("../nyextest/data/imported/" + fileName + ".txt").split("\n");
		var things = thingList.join("|").toLowerCase();
		
		// If there was an argument, try to pick a thing that matches it
		var key = 0;
		var allArgs = args.join(" ");
		if(args.length > 0){
			// Check if the search can be matched to a thing
			allArgs = allArgs.replace(/^\*/g, ".*");
			allArgs = allArgs.replace(/\./g, "[^|]");
			var reg = new RegExp(allArgs, "g");
			things = things.replace(reg, "$REPLACERSTRING$");
			if(things.includes("$REPLACERSTRING$")){
				
				var split = things.split("$REPLACERSTRING$");
				var results = [];
				var combined = 0;
				for(i = 0; i < split.length - 1; i++){
					var left_side = split[i].replace(/[^|]/g, "");
					// Prevent duplicate entries being matched
					if(!results.includes(left_side.length + combined)){
						results.push(left_side.length + combined);
						combined += left_side.length;
					}
				}
				// Pick random result from those found
				var randKey = lib.rand(0, results.length - 1);
				key = results[randKey];
				
				// Make list of matching results
				var newList = [];
				for(i = 0; i < results.length; i++){
					// Re-format MHL
					if(fileName == "mhl"){
						thingList[results[i]] = thingList[results[i]].replace(/\*\*(?=[^*]*$)/, "**\n");
					}
					newList.push(thingList[results[i]]);
				}

				lib.createPagedNightEmbed(newList, thingList[key], randKey, message);
				return;
			}else{
				// Pick a random thing since no matching entry was found
				key = lib.rand(0, thingList.length - 1);
				message.reply({ content: "Random result:\n" + thingList[key], allowedMentions: { repliedUser: false }});
			}
			
		}else{
			// Pick a random thing if there was no argument
			key = lib.rand(0, thingList.length - 1);
			message.reply({ content: "Random result:\n" + thingList[key], allowedMentions: { repliedUser: false }});
		}
		
	},

	// Input: String, object, array
    // Dependency: readFile, createPagedNightEmbed
    // Function: Gets one or more results from a database of quotes/clips/images/etc.
	async searchableListNew(fileName, message, args){

		// If there was at least one argument, try to pick entries that match the search
		if(args.length > 0){
			
			// Loop through arguments, turning them into parts of the query
			for(i = 0; i < args.length; i++){
				args[i] = "(entries.entryTags LIKE '%" + args[i].toLowerCase() + "%' OR entries.entryName LIKE '%" + args[i].toLowerCase() + "%')";
			}
			
			// SQL Query
			var [rows] = await con.execute({sql: `
				SELECT entries.entryName, entries.content, entries.entryTags
				FROM entries
				INNER JOIN entryTypes ON entryTypes.entryTypeId=entries.entryTypeId
				WHERE entryTypes.entryTypeName = '${fileName}' AND (${args.join(" AND ")});
			`, rowsAsArray: false });
			
			// If there were no results, get a random one
			if(rows.length < 1){
				[rows] = await con.execute({sql: `
					SELECT entries.entryName, entries.content, entries.entryTags
					FROM entries
					INNER JOIN entryTypes ON entryTypes.entryTypeId=entries.entryTypeId
					WHERE entryTypes.entryTypeName = '${fileName}'
					ORDER BY RAND()
					LIMIT 1;
				`, rowsAsArray: false });
				rows[0] = rows[0].entryName + ":\n" + rows[0].content + "\nTags: " + rows[0].entryTags;
				message.reply({ content: "No matches found! Random result:\n" + rows[0], allowedMentions: { repliedUser: false }});
				return;
			}

			// Prepare and send output
			// TODO: Remove duplicates! (?)
			for(i = 0; i < rows.length; i++){
				rows[i] = rows[i].entryName + ":\n" + rows[i].content + "\nTags: " + rows[i].entryTags;
			}
			var randKey = lib.rand(0, rows.length - 1);
			lib.createPagedNightEmbed(rows, rows[randKey], randKey, message);

		}else{
			// Get a random result if there was no argument
			[rows] = await con.execute({sql: `
				SELECT entries.entryName, entries.content, entries.entryTags
				FROM entries
				INNER JOIN entryTypes ON entryTypes.entryTypeId=entries.entryTypeId
				WHERE entryTypes.entryTypeName = '${fileName}'
				ORDER BY RAND()
				LIMIT 1;
			`, rowsAsArray: false });

			// Prepare and send output
			rows[0] = rows[0].entryName + ":\n" + rows[0].content + "\nTags: " + rows[0].entryTags;
			message.reply({ content: "Random result:\n" + rows[0], allowedMentions: { repliedUser: false }});
		}
		
	},

	// Input: Object, array, array, integer, integer
    // Function: Creates an interactive embed message with several pages that can be switched between. The list of entries is filled into the newest field of an embed built with a template
	async embedFieldPagination(msg, embed, pages, buttonList, timeout = 120000){
		const {MessageActionRow} = require("discord.js");
		
		if (!msg && !msg.channel) throw new Error("Channel is inaccessible.");
		if (!pages) throw new Error("Pages are not given.");
		if (!buttonList) throw new Error("Buttons are not given.");
		if (buttonList[0].style === "LINK" || buttonList[1].style === "LINK")
			throw new Error(
				"Link buttons are not supported"
			);
		if (buttonList.length !== 2) throw new Error("Need two buttons.");
	
		let page = 0;
	
		const row = new MessageActionRow().addComponents(buttonList);
		var curPage = "";
		if(pages.length == 1){
			embed.fields[embed.fields.length - 1].value = pages[page];
			curPage = await msg.reply({
				embeds: [embed.setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
				allowedMentions: { repliedUser: false },
				fetchReply: true,
			});
		}else{
			embed.fields[embed.fields.length - 1].value = pages[page];
			curPage = await msg.reply({
				embeds: [embed.setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
				components: [row],
				allowedMentions: { repliedUser: false },
				fetchReply: true,
			});
			
			if(!lib.exists(msg.author)){msg.author = msg.user;}
			const filter = (i) =>
				(i.customId === buttonList[0].customId ||
				i.customId === buttonList[1].customId) &&
				i.user.id === msg.author.id;
	
			const collector = await curPage.createMessageComponentCollector({
				filter,
				time: timeout,
			});
	
			collector.on("collect", async (i) => {
				switch (i.customId) {
				case buttonList[0].customId:
					page = page > 0 ? --page : pages.length - 1;
					break;
				case buttonList[1].customId:
					page = page + 1 < pages.length ? ++page : 0;
					break;
				default:
					break;
				}
				await i.deferUpdate();
				embed.fields[embed.fields.length - 1].value = pages[page];
				await i.editReply({
					embeds: [embed.setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
					components: [row],
				});
				collector.resetTimer();
			});
	
			collector.on("end", () => {
				const disabledRow = new MessageActionRow().addComponents(
					buttonList[0].setDisabled(true),
					buttonList[1].setDisabled(true)
				);
				curPage.edit({
					embeds: [embed.setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
					components: [disabledRow],
				});
			});
	
		}
	
		return curPage;
		
	},
	
	// Input: Object, array, array, integer, integer
    // Function: Creates an interactive embed message with several pages that can be switched between. Only used for the captures command due to custom logic
	async monsterPagination(msg, pages, buttonList, startingId, timeout = 120000, extraButtons, alternateImages){
		const {MessageActionRow, MessageButton} = require("discord.js");

		if (!msg && !msg.channel) throw new Error("Channel is inaccessible.");
		if (!pages) throw new Error("Pages are not given.");
		if (!buttonList) throw new Error("Buttons are not given.");
		if (buttonList[0].style === "LINK" || buttonList[1].style === "LINK")
		  	throw new Error(
				"Link buttons are not supported"
		  	);
		if (buttonList.length !== 4) throw new Error("Need four buttons.");
	  
		let page = startingId;
		
		var row = new MessageActionRow().addComponents(buttonList);
		var singleRow = new MessageActionRow().addComponents(buttonList[3]);
		
		if(alternateImages[page] != "Not owned"){
			pages[page].setThumbnail(alternateImages[page]);
		}

		if(extraButtons[page].customId.split("|")[1] != "None"){
			row.addComponents(extraButtons[page]);
			singleRow.addComponents(extraButtons[page]);
		}
		
		var curPage = "";
		if(pages.length == 1){
		  	curPage = await msg.reply({
				embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
				components: [singleRow],
				allowedMentions: { repliedUser: false },
				fetchReply: true
		  	});
		}else{
		  	curPage = await msg.reply({
				embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
				components: [row],
				allowedMentions: { repliedUser: false },
				fetchReply: true
		  	});
	  
			if(!lib.exists(msg.author)){msg.author = msg.user;}
		  	const filter = (i) =>
				(i.customId === buttonList[0].customId ||
				i.customId === buttonList[1].customId ||
				i.customId === buttonList[2].customId ||
				i.customId === extraButtons[page].customId) &&
				i.user.id === msg.author.id;
	  
		  	const collector = await curPage.createMessageComponentCollector({
				filter,
				time: timeout,
		  	});
	  
		  	collector.on("collect", async (i) => {
				switch (i.customId) {
				case buttonList[0].customId:
					page = page > 0 ? --page : pages.length - 1;
					break;
				case buttonList[1].customId:
					page = lib.rand(0, pages.length - 1);
					break;
				case buttonList[2].customId:
					page = page + 1 < pages.length ? ++page : 0;
					break;
				case extraButtons[page].customId:
					page = parseInt(extraButtons[page].customId.split("|")[1]);
					break;
				default:
					break;
				}
				if(!lib.exists(msg.author)){msg.author = msg.user;}
				buttonList[3] = new MessageButton()
					.setCustomId(msg.author.id + '|captures favorite ' + pages[page].title.trim())
					.setLabel('Favorite')
					.setStyle('SUCCESS');
				row = new MessageActionRow().addComponents(buttonList);

				if(alternateImages[page] != "Not owned"){
					pages[page].setThumbnail(alternateImages[page]);
				}else if(pages[page].hasOwnProperty('thumbnail')){
					delete pages[page].thumbnail;
				}
				if(extraButtons[page].customId.split("|")[1] != "None"){
					row.addComponents(extraButtons[page]);
				}

				await i.deferUpdate();
				await i.editReply({
					embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
					components: [row],
				});

				collector.resetTimer();
			});
			
			collector.on("end", () => {
				const row = new MessageActionRow().addComponents(
					buttonList[0].setDisabled(true),
					buttonList[1].setDisabled(true),
					buttonList[2].setDisabled(true),
					buttonList[3].setDisabled(true)
				);
				curPage.edit({
					embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
					components: [row],
				});
			});
		
		}
	  
		return curPage;
	},
	
	// Input: Object, object, array, array, integer, integer
	// Function: Creates an embed with an extra button for using items
	async preparedEmbedPagination(user, msg, pages, buttonList, startingId, timeout = 120000){
		const {MessageActionRow, MessageButton} = require("discord.js");

		if (!msg && !msg.channel) throw new Error("Channel is inaccessible.");
		if (!pages) throw new Error("Pages are not given.");
		if (!buttonList) throw new Error("Buttons are not given.");
		if (buttonList[0].style === "LINK" || buttonList[1].style === "LINK")
		  	throw new Error(
				"Link buttons are not supported"
		  	);
		if (buttonList.length !== 3) throw new Error("Need three buttons.");
		
		let page = startingId;
		buttonList.push(
			new MessageButton()
				.setCustomId(user.id + "|use " + pages[page].title)
				.setLabel('Use')
				.setStyle('PRIMARY')
		);

		var row = new MessageActionRow().addComponents(buttonList);

		var curPage = await msg.reply({
			embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
			components: [row],
			allowedMentions: { repliedUser: false },
			fetchReply: true
		});
	
		if(!lib.exists(msg.author)){msg.author = msg.user;}
		const filter = (i) =>
			(i.customId === buttonList[0].customId ||
			i.customId === buttonList[1].customId ||
			i.customId === buttonList[2].customId) &&
			i.user.id === msg.author.id;
	
		const collector = await curPage.createMessageComponentCollector({
			filter,
			time: timeout,
		});
	
		collector.on("collect", async (i) => {
			switch (i.customId) {
			case buttonList[0].customId:
				page = page > 0 ? --page : pages.length - 1;
				break;
			case buttonList[1].customId:
				page = lib.rand(0, pages.length - 1);
				break;
			case buttonList[2].customId:
				page = page + 1 < pages.length ? ++page : 0;
				break;
			default:
				break;
			}
			buttonList[3] = new MessageButton()
				.setCustomId(user.id + "|use " + pages[page].title)
				.setLabel('Use')
				.setStyle('PRIMARY')
			row = new MessageActionRow().addComponents(buttonList);
			await i.deferUpdate();
			await i.editReply({
				embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
				components: [row],
			});
			collector.resetTimer();
		});
		
		collector.on("end", () => {
			const row = new MessageActionRow().addComponents(
				buttonList[0].setDisabled(true),
				buttonList[1].setDisabled(true),
				buttonList[2].setDisabled(true),
				buttonList[3].setDisabled(true)
			);
			curPage.edit({
				embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
				components: [row],
			});
		});
		
		return curPage;
	},

	// Input: Object, array, array, integer
	// Function: Creates an embed with buttons for switching between pages. The pages have to be supplied by the parent function in their entirety
	async fullEmbedPagination(msg, pages, buttonList, timeout = 120000){
		const {MessageActionRow, MessageButton} = require("discord.js");

		if (!msg && !msg.channel) throw new Error("Channel is inaccessible.");
		if (!pages) throw new Error("Pages are not given.");
		if (!buttonList) throw new Error("Buttons are not given.");
		if (buttonList[0].style === "LINK" || buttonList[1].style === "LINK")
		  	throw new Error(
				"Link buttons are not supported"
		  	);
		if (buttonList.length !== 2) throw new Error("Need two buttons.");
		
		let page = 0;
		var row = new MessageActionRow().addComponents(buttonList);

		var curPage = await msg.reply({
			embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
			components: [row],
			allowedMentions: { repliedUser: false },
			fetchReply: true
		});
	
		if(!lib.exists(msg.author)){msg.author = msg.user;}
		const filter = (i) =>
			(i.customId === buttonList[0].customId ||
			i.customId === buttonList[1].customId) &&
			i.user.id === msg.author.id;
	
		const collector = await curPage.createMessageComponentCollector({
			filter,
			time: timeout,
		});
	
		collector.on("collect", async (i) => {
			switch (i.customId) {
			case buttonList[0].customId:
				page = page > 0 ? --page : pages.length - 1;
				break;
			case buttonList[1].customId:
				page = page + 1 < pages.length ? ++page : 0;
				break;
			default:
				break;
			}
			
			row = new MessageActionRow().addComponents(buttonList);
			await i.deferUpdate();
			await i.editReply({
				embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
				components: [row],
			});
			collector.resetTimer();
		});
		
		collector.on("end", () => {
			const row = new MessageActionRow().addComponents(
				buttonList[0].setDisabled(true),
				buttonList[1].setDisabled(true)
			);
			curPage.edit({
				embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
				components: [row],
			});
		});
		
		return curPage;
	},

	// Input: Object, array, array, integer, integer
    // Function: Creates an interactive message with several pages that can be switched between
	async embedlessPagination(msg, pages, buttonList, startingId, timeout = 120000){
		const {MessageActionRow} = require("discord.js");

		if (!msg && !msg.channel) throw new Error("Channel is inaccessible.");
		if (!pages) throw new Error("Pages are not given.");
		if (!buttonList) throw new Error("Buttons are not given.");
		if (buttonList[0].style === "LINK" || buttonList[1].style === "LINK")
			throw new Error(
				"Link buttons are not supported"
			);
		if (buttonList.length < 2) throw new Error("Need at least two buttons.");
	  
		let page = startingId;
		
		var row = new MessageActionRow().addComponents(buttonList);
		
		var curPage = "";
		if(pages.length == 1){
			curPage = await msg.reply({
				content: pages[page] + `\nResult ${page + 1} / ${pages.length}`,
				allowedMentions: { repliedUser: false },
				fetchReply: true,
			});
		}else{
			curPage = await msg.reply({
				content: pages[page] + `\nResult ${page + 1} / ${pages.length}`,
				components: [row],
				allowedMentions: { repliedUser: false },
				fetchReply: true,
			});
	  
			if(!lib.exists(msg.author)){msg.author = msg.user;}
			const filter = (i) =>
				(i.customId === buttonList[0].customId ||
				i.customId === buttonList[1].customId ||
				i.customId === buttonList[2].customId) &&
				i.user.id === msg.author.id;
	  
			const collector = await curPage.createMessageComponentCollector({
				filter,
				time: timeout,
			});
	  
			collector.on("collect", async (i) => {
				switch (i.customId) {
				case buttonList[0].customId:
					page = page > 0 ? --page : pages.length - 1;
					break;
				case buttonList[1].customId:
					page = lib.rand(0, pages.length - 1);
					break;
				case buttonList[2].customId:
					page = page + 1 < pages.length ? ++page : 0;
					break;
				default:
					break;
				}
				await i.deferUpdate();
				await i.editReply({
					content: pages[page] + `\nResult ${page + 1} / ${pages.length}`,
					components: [row],
				});
				collector.resetTimer();
			});
	  
			collector.on("end", () => {
				const row = new MessageActionRow().addComponents(
					buttonList[0].setDisabled(true),
					buttonList[1].setDisabled(true),
					buttonList[2].setDisabled(true)
				);
				curPage.edit({
					content: pages[page] + `\nResult ${page + 1} / ${pages.length}`,
					components: [row],
				});
			});
	  
		}
		
		return curPage;
	},

	// Input: String or integer, String
    // Dependency: lib itself
    // Function: Deterministically picks a "random" element from a list based on a long number
    // Output: String
	getFate(userId, listPath){
		// Load item list
        var items = lib.readFile(listPath).split("\n");

        // Pick an array index based on the user ID
        var resultIndex = parseInt(userId) % items.length;
        if(resultIndex == 0){resultIndex = parseInt(("" + userId).slice(0, 2));}
        var result = items[resultIndex];
		return result;
	},

	// Input: Integer / Unix timestamp in seconds
	// Function: Checks for leap days between the current time and the given input and adjusts the timestamp to correct yearly dates
    // Output: Integer / Unix timestamp in seconds
	correctLeapDays(timestamp){
		// Get current year
		var d = new Date();
		var todayTimestamp = Math.floor(d.getTime() / 1000);
		var year = d.getUTCFullYear();
		var month = d.getUTCMonth() + 1;

		// Check the day, year and month of the timestamp added to the current time
		var futureTimestamp = todayTimestamp + timestamp;
		var futureD = new Date(futureTimestamp * 1000);
		var futureYear = futureD.getUTCFullYear();
		var futureMonth = futureD.getUTCMonth() + 1;

		// Ignore the future year if the timestamp is before March
		// Ignore the current year if February has already passed
		if(futureMonth < 3){ futureYear--; }
		if(month > 2){ year++; }
		var loopCount = 1 + futureYear - year;

		// Loop through all the years between the current timestamp and the future timestamp and check if they are leap years
		// Add a day to the timestamp for every positive
		for(i = 0; i < loopCount; i++){

			var leapYear = false;
			if(year % 4 == 0){
				if(year % 100 == 0){
					if(year % 400 == 0){
						leapYear = true;
					}
				}else{
					leapYear = true;
				}
			}

			if(leapYear){
				timestamp += 24 * 60 * 60;
			}

			year++;
		}

		return timestamp;
	},

	// Input: String
    // Function: Decodes HTML string
    // Output: String
	decodeHTMLEntity(input) {
		return input
			.replace(/&quot;/g, "\"")
			.replace(/&amp;/g, "&")
			.replace(/&#(\d+);/g, function(match, dec) {
				return String.fromCharCode(dec);
			});
	},

	// Input: String
    // Dependency: Lib itself
    // Function: Fetches an HTML page as a string
    // Output: String
    async getHTML(url) {
        try {
            // Get the response body
            var response = await fetch(url);
            var body = await response.text();
			body = body.split("\n").join("<br>");
			return body;
        }
        catch(exception){
            lib.error("", exception, "getHTML() Error");
			return "error";
        }
    },

	// Input: Object or String, String, Object
    // Dependency: Discord, Lib itself
    // Function: Sends error notifications and logs
	error(message, error, customMessage){
		const Discord = require('discord.js');

		// Check if a message is the error trigger
		var hasMessage = true;
		if(typeof message == "string"){
			hasMessage = false;
			message = {createdAt: Date().toString(), content: "undefined", author: "system"};
		}
		var username = message.author.username;
		var causeInfo = "Error caused by message: " + message.content + " (sent by " + username + ")";
		if(!hasMessage){
			causeInfo = "Not caused by a message";
		}

		// Formatting fix
		if(lib.exists(customMessage)){
			customMessage = " - " + customMessage;
		}

		// Log error to console
		console.error(message.createdAt + " - " + causeInfo + customMessage);
		console.error(error);

        // Send messages if possible
		if(hasMessage){

			console.log(message);

			var outputEmbed = new Discord.MessageEmbed()
				.setColor('#fc0303')
				.setTitle("Command response error")
				.setDescription("```javascript\n" + error.toString() + customMessage + "```" + causeInfo)
				.setFooter({ text: message.createdTimestamp.toString() });

			var testBranch = lib.readFile("./isTestBranch.txt");
			if(testBranch == "YES"){
				message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false } });
			}else{
				message.reply({ content: "@ __**" + username + "**__```dust\n{ An error has occurred! }```All relevant details have automatically been sent to the main server for further investigation", allowedMentions: { repliedUser: false }});
				message.client.channels.cache.get("859477509178654792").send({ embeds: [outputEmbed] });
			}
		}
	}
	
};