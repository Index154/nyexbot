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
        var first_letter = name.substring(0, 1).toLowerCase();
        if(first_letter == "a" || first_letter == "e" || first_letter == "i" || first_letter == "o" || first_letter == "u"){
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
		var addPrevious = 0;
	    for(y = 5; y > 0 && rank === 0; y--){
	        if(rankRand <= (rankChances[y] + addPrevious)){
                rank = y;
            }
            addPrevious += rankChances[y];
	    }
	    var monster_groups = lib.readFile("data/monsters/monsters_0.txt").split("#################################################################################\n");
	    var monstersNew = monster_groups[rank].split(";\n");
        var monster_key = lib.rand(0, monstersNew.length - 2);
        var monster_data = monstersNew[monster_key].split("|");
        monster_key = monster_data[7];
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
                trophy_extra = "You received the trophy **\u2747<:real_black_circle:856189638153338900>EXP Collector**|10";
            }else
            if(user_level >= 15 && user_level_old < 15){
                levelup_extra = levelup_extra + "\n__From now on you may use__ `" + prefix + "fullradar` __as a more efficient alternative to the radar in exchange for some Gold!__";
            }else
            if(user_level >= 20 && user_level_old < 20){
                levelup_extra = levelup_extra + "\n__From now on you may use__ `" + prefix + "research` __to gain various rewards in exchange for Scrap!__\n(Convert materials into Scrap with `" + prefix + "materials convert [amount] [name]`)";
                trophy_extra = "You received the trophy **\u2747\uD83D\uDD35EXP Collector**!|20";
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
                trophy_extra = "You received the trophy **\u2747\uD83D\uDFE2EXP Collector**!|30";
                levelup_extra = levelup_extra + "\nYou got a new ability: **[" + ab_name + "]**: " + ab_desc;
            }else
            if(user_level >= 40 && user_level_old < 40){
                trophy_extra = "You received the trophy **\u2747\uD83D\uDD34EXP Collector**!|40";
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
                trophy_extra = "You received the trophy **\u2747\uD83D\uDFE1EXP Collector**!|50";
                levelup_extra = levelup_extra + "\nYou've unlocked a new ability: **[" + ab_name + "]**: " + ab_desc + "\nFrom now on your level is locked until you've completed all quests. After completing all quests you can earn stat points by leveling up!";
            }else if(user_level > 50 && user_level_old >= 50){
                if(user_level >= 60 && user_level_old < 60){
                    trophy_extra = "You received the trophy **\u2747\uD83D\uDFE0EXP Collector**!|60";
                }else
                if(user_level >= 70 && user_level_old < 70){
                    trophy_extra = "You received the trophy **\u2747\uD83D\uDFE0EXP Collector**!|70";
                }else
                if(user_level >= 80 && user_level_old < 80){
                    trophy_extra = "You received the trophy **\u2747\uD83D\uDFE0EXP Collector**!|80";
                }else
                if(user_level >= 90 && user_level_old < 90){
                    trophy_extra = "You received the trophy **\u2747\uD83D\uDFE0EXP Collector**!|90";
                }else
                if(user_level >= 100 && user_level_old < 100){
                    trophy_extra = "You received the trophy **\u2747\uD83D\uDFE0EXP Collector**!|100";
                }
                levelup_extra += "\n**You have received a stat point!**";
                stats[13] = parseInt(stats[13]) + 1;
            }
        }
        
        return { levelup_extra, stats, trophy_extra};
    },
	
	// Input: Array, integer, object, string, object, string
    // Function: Creates a paged embed with buttons using another module
	createPagedFieldEmbed(paginationArray, elementsPerPage, embedTemplate, fieldTitle, message){
		const { EmbedBuilder, ButtonBuilder } = require('discord.js');
		
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
		const button1 = new ButtonBuilder()
			.setCustomId('previousbtn')
			.setLabel('Previous')
			.setStyle(2);
		const button2 = new ButtonBuilder()
			.setCustomId('nextbtn')
			.setLabel('Next')
			.setStyle(2);
		buttonList = [ button1, button2 ];
		
		// Send embed
		lib.embedFieldPagination(message, embedTemplate, pages, buttonList, 60000);
	},
	
	// Input: Array, object, integer, object, ?, ?, ?, string, string, object
    // Function: Creates a paged embed with buttons using another module
	createPagedMonsterEmbed(idArray, embedTemplate, startingId, message, monster_groups, monster_names2, items, username, startingName, firstButton, firstAltImage){
		const { EmbedBuilder, ButtonBuilder } = require('discord.js');
		
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
					altImage = "https://artificial-index.com/media/rpg_monsters/" + monsters_array[result_keys[1]].split("|")[0].toLowerCase().replace(/ /g, "_") + ".png";
				}
				
			}else{
			    // Check if the user has the shiny variant as well and find its page number
				var altId = result_keys[0] + "," + result_keys[1] + "," + 1;
				if(idArray.includes(altId)){
				    altIndex = idArray.indexOf(altId);
					altImage = "https://artificial-index.com/media/rpg_monsters/" + shinies_array[result_keys[1]].split("|")[0].toLowerCase().replace(/ /g, "_") + ".png";
				}
			}
			var monster_data = result_monster.split("|");
			
			// Push variant switch button to array
			var button5 = new ButtonBuilder()
    			.setCustomId('comparebtn|' + altIndex)
    			.setLabel('Switch')
    			.setStyle(1);
    		shinyButtons[i] = button5;
			alternateImages[i] = altImage;
			
			// Get rarity
            var rarity_names = ["D", "C", "B", "A", "S", "SS"];
            var rarity = rarity_names[result_keys[0]];
            if(result_keys[2] == "1"){
                rarity = rarity + "++";
            }
			
			// Add types
			if(monster_data[3].includes(",")){
			    var types = monster_data[3].split(",");
			    type = types.join(", ");
			}else{
			    type = monster_data[3];
			}
			
			// Fix error for empty property
			if(monster_data[4] == ""){monster_data[4] = "/";}

			// Assemble embed
            var outputEmbed = new EmbedBuilder()
            	.setColor(embed_color)
            	.setTitle(monster_data[0])
            	.setImage("https://artificial-index.com/media/rpg_monsters/" + monster_data[0].toLowerCase().replace(/ /g, "_") + ".png")
            	.setDescription(monster_data[4])
            	.addFields(
            		{ name: 'Attack', value: monster_data[1], inline: true },
            		{ name: 'Speed', value: monster_data[2], inline: true },
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
			var capture_count = captures_counts[monster_data[0]] - 1; // Subtract one because of all_captures.txt
			outputEmbed
			    .addFields( { name: "Captured count", value: capture_count.toString(), inline: true } );
			
			// Add to list
			pages[i] = outputEmbed;
			i++;
			if(i === idArray.length){i = 0;}
		}
		
		// Create buttons
		const button1 = new ButtonBuilder()
			.setCustomId('previousbtn')
			.setLabel('Previous')
			.setStyle(2);
		const button2 = new ButtonBuilder()
			.setCustomId('randbtn')
			.setLabel('Random')
			.setStyle(1);
		const button3 = new ButtonBuilder()
			.setCustomId('nextbtn')
			.setLabel('Next')
			.setStyle(2);
		if(!lib.exists(message.author)){message.author = message.user;}
		const button4 = new ButtonBuilder()
			.setCustomId(message.author.id + '|captures favorite ' + startingName)
			.setLabel('Favorite')
			.setStyle(3);
		buttonList = [ button1, button2, button3, button4 ];
		
		// Send embed
		lib.monsterPagination(message, pages, buttonList, startingId, 60000, shinyButtons, alternateImages);
	},
	
	// Input: Array, string, integer, object
    // Function: Creates a paged embed with buttons using another module
	createPagedMessage(entryList, stringTemplate, startingId, message){
		const { EmbedBuilder, ButtonBuilder } = require('discord.js');
		
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
		const button1 = new ButtonBuilder()
			.setCustomId('previousbtn')
			.setLabel('Previous')
			.setStyle(2);
		const button2 = new ButtonBuilder()
			.setCustomId('nextbtn')
			.setLabel('Next')
			.setStyle(2);
		const button3 = new ButtonBuilder()
			.setCustomId('randbtn')
			.setLabel('Random')
			.setStyle(1)
		buttonList = [ button1, button3, button2 ];
		
		// Send embed
		lib.embedlessPagination(message, pages, buttonList, startingId, 60000);
	},

	// Input: String, ?, ?, integer, object, object, ?
	// Function: Creates a paged embed with a specific layout for the display of item details. The list of items has to be supplied by the calling function
	createPagedItemEmbed(dir, items, allItems, startingId, message, user, itemList, priceList){
		const { EmbedBuilder, ButtonBuilder } = require('discord.js');

		// Important variables
		var isShop = false;
		if(priceList.length > 0){
			isShop = true;
			var ownedGold = lib.readFile(dir + "/stats.txt").split("|")[12];
		}
		var equipRarities = lib.readFile(dir + "/equip_modifiers.txt").split("\n");
		var statNames = ["Filler", "Attack", "Speed", "Mana", "Monster Luck", "Drop Luck", "Rare Luck", "Unnamed"];

		// Create embeds
		var embeds = [];
		for(i = startingId; !lib.exists(embeds[i]); ){
			var itemData = itemList[items[i]].split("|");
			var itemTitle = itemData[0];
			var itemType = "\uD83C\uDF6F Consumable";
			var itemAbilityOrUseAmount = "";
			var itemValue = "\n\u200b";
			var itemAmount = "\u200b";

			// Assemble embed
            var embed = new EmbedBuilder()
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
				if(isShop){
					itemValue = "**Being sold for:** " + priceList[i] + " Gold";
					itemAmount = "\n**Your Gold:** " + ownedGold;
				}else{
					itemValue =  "**Value:** " + itemData[11] + " Gold";
					var itemCounts = new adc(allItems).count();
					itemAmount = "\n**Your amount:** " + itemCounts[items[i]].toString();
				}
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
				.setDescription(itemData[9] + "\n\n**Type:** " + itemType + "\n" + itemAbilityOrUseAmount + "\n" + itemValue + itemAmount + "\n\n__**Stats**__" + "```\n" + itemStats + "\n```")
				.setTitle(itemTitle);

			embeds[i] = embed;
			i++;
			if(i >= items.length){i = 0;}
		}

		// Create buttons
		const button1 = new ButtonBuilder()
			.setCustomId('previousbtn')
			.setLabel('Previous')
			.setStyle(2);
		buttonList = [ button1 ];
		const button2 = new ButtonBuilder()
			.setCustomId('randbtn')
			.setLabel('Random')
			.setStyle(1);
		if(!isShop){buttonList.push(button2);}
		const button3 = new ButtonBuilder()
			.setCustomId('nextbtn')
			.setLabel('Next')
			.setStyle(2);
		buttonList.push(button3);
		buttonList = [ button1, button2, button3 ];

		// Go to secondary function
		lib.itemEmbedPagination(user, message, embeds, buttonList, startingId, 60000, isShop);
	},

	// Input: Message object, array of embed objects
	// Function: Combines multiple different embeds into one message and allows switching through them with buttons
	createSimplePagedEmbed(message, embeds){
		const { ButtonBuilder } = require('discord.js');

		// Create buttons
		const button1 = new ButtonBuilder()
			.setCustomId('previousbtn')
			.setLabel('Previous')
			.setStyle(2);
		const button2 = new ButtonBuilder()
			.setCustomId('nextbtn')
			.setLabel('Next')
			.setStyle(2);
		buttonList = [ button1, button2 ];

		// Go to secondary function
		lib.fullEmbedPagination(message, embeds, buttonList, timeout = 120000);
	},

	// Input: Message object, array of embed objects
	// Function: Combines multiple different embeds into one message and allows switching through them with buttons
	createSimplePagedEmbedWithReroll(message, rows){
		const { ButtonBuilder } = require('discord.js');

		// Create buttons
		const button1 = new ButtonBuilder()
			.setCustomId('previousbtn')
			.setLabel('Previous')
			.setStyle(2);
		const button2 = new ButtonBuilder()
			.setCustomId('randbtn')
			.setLabel('Random')
			.setStyle(1);
		const button3 = new ButtonBuilder()
			.setCustomId('nextbtn')
			.setLabel('Next')
			.setStyle(2);
		buttonList = [ button1, button2, button3 ];

		// Go to secondary function
		lib.fullEmbedPaginationWithReroll(message, rows, buttonList, timeout = 120000);
	},

	// Input: Object, object, array
    // Function: Sends a message with command buttons that time out
	async buttonReply(message, embeds, buttons){
		const row = new ActionRowBuilder().addComponents(buttons);
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
			var disabledRow = new ActionRowBuilder().addComponents(buttons);
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
			var disabledRow = new ActionRowBuilder().addComponents(buttons);
			newMessage.edit({
				embeds: embeds,
				components: [disabledRow],
			});
		});

	},
	
	// Input: Object, string, array
    // Function: Sends a message with command buttons that time out (without embed)
	async buttonReplyBasic(message, content, buttons){
		const row = new ActionRowBuilder().addComponents(buttons);
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
			var disabledRow = new ActionRowBuilder().addComponents(buttons);
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
			var disabledRow = new ActionRowBuilder().addComponents(buttons);
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

		// Months are a special beast
		function checkForMonths(timestamp){
			let returnValue = 0;
			if(timestamp % 2592000 == 0){ returnValue = 2592000; }else
			if(timestamp % 2678400 == 0){ returnValue = 2678400; }else
			if(timestamp % 2505600 == 0){ returnValue = 2505600; }else
			if(timestamp % 2419200 == 0){ returnValue = 2419200; }
			return returnValue;
		}
		var monthDivideBy = checkForMonths(input);
		var months = 0;
		if(monthDivideBy != 0){
			months = Math.floor(input / monthDivideBy);
			input -= months * monthDivideBy;
		}
	    var days = Math.floor(input / 86400);
	    input -= days * 86400;
	    var hours = Math.floor(input / 3600);
	    input -= hours * 3600;
	    var minutes = Math.floor(input / 60);
	    input -= minutes * 60;
	    
	    // Grammar fix
	    var yearS = "s", monthS = "s", dayS = "s", hourS = "s", minS = "s", secS = "s";
		if(years == 1){yearS = "";}
		if(months == 1){monthS = "";}
	    if(days == 1){dayS = "";}
	    if(hours == 1){hourS = "";}
	    if(minutes == 1){minS = "";}
	    if(input == 1){secS = "";}
	    
	    // Prepare output. Anything that is <= 0 is implied to be 0 so it is not included in the output
	    var output = "";
		if(years > 0){
			output += years + " year" + yearS;
		}
		if(months > 0){
			if(output != ""){output += ", ";}
			output += months + " month" + monthS;
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
    // Dependency: readFile, createPagedMessage
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

				lib.createPagedMessage(newList, thingList[key], randKey, message);
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
    // Dependency: readFile, createPagedMessage
    // Function: Gets one or more results from a database of quotes/clips/images/etc.
	async searchableListNew(fileName, message, args){
		const {EmbedBuilder} = require("discord.js");

		// If there was at least one argument, try to pick entries that match the search
		var rows = [];
		if(args.length > 0){
			
			// Loop through arguments, turning them into parts of the query
			for(i = 0; i < args.length; i++){
				args[i] = "(entries.entryName LIKE '%" + args[i].toLowerCase() + "%')";
			}
			
			// SQL Query
			[rows] = await con.execute({sql: `
				SELECT entries.entryName, entries.content
				FROM entries
				INNER JOIN entryTypes ON entryTypes.entryTypeId=entries.entryTypeId
				WHERE entryTypes.entryTypeName = '${fileName}' AND (${args.join(" AND ")})
				ORDER BY RAND();
			`, rowsAsArray: false });
			
			// If there were no results, get a random one
			if(rows.length < 1){
				[rows] = await con.execute({sql: `
					SELECT entries.entryName, entries.content
					FROM entries
					INNER JOIN entryTypes ON entryTypes.entryTypeId=entries.entryTypeId
					WHERE entryTypes.entryTypeName = '${fileName}'
					ORDER BY RAND();
				`, rowsAsArray: false });
			}

		}else{
			// Get a random result if there was no argument
			[rows] = await con.execute({sql: `
				SELECT entries.entryName, entries.content
				FROM entries
				INNER JOIN entryTypes ON entryTypes.entryTypeId=entries.entryTypeId
				WHERE entryTypes.entryTypeName = '${fileName}'
				ORDER BY RAND();
			`, rowsAsArray: false });
		}

		// Prepare and send output
		if(fileName == "clips"){
			for(i = 0; i < rows.length; i++){
				rows[i] = rows[i].content;
			}
			if(rows.length < 2){
				message.reply({ content: "Found 1 result:\n" + rows[0], allowedMentions: { repliedUser: false }});
			}else{
				var randKey = lib.rand(0, rows.length - 1);
				lib.createPagedMessage(rows, rows[randKey], randKey, message);
			}
		}else{
			if(rows.length < 2){
				var embed = new EmbedBuilder()
					.setTitle(rows[0].entryName)
					.setImage(rows[0].content)
					.setFooter({text: "Result 1/1"});
				message.reply({ embeds: [embed], allowedMentions: { repliedUser: false }});
			}else{
				lib.createSimplePagedEmbedWithReroll(message, rows);
			}
		}
	},

	// Input: Object, array, array, integer, integer
    // Function: Creates an interactive embed message with several pages that can be switched between. The list of entries is filled into the newest field of an embed built with a template
	async embedFieldPagination(msg, embed, pages, buttonList, timeout = 120000){
		const {ActionRowBuilder} = require("discord.js");
		
		if (!msg && !msg.channel) throw new Error("Channel is inaccessible.");
		if (!pages) throw new Error("Pages are not given.");
		if (!buttonList) throw new Error("Buttons are not given.");
		if (buttonList[0].style === 5 || buttonList[1].style === 5)
			throw new Error(
				"Link buttons are not supported"
			);
		if (buttonList.length !== 2) throw new Error("Need two buttons.");
	
		let page = 0;
	
		const row = new ActionRowBuilder().addComponents(buttonList);
		var curPage = "";
		if(pages.length == 1){
			embed.data.fields[embed.data.fields.length - 1].value = pages[page];
			curPage = await msg.reply({
				embeds: [embed.setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
				allowedMentions: { repliedUser: false },
				fetchReply: true,
			});
		}else{
			embed.data.fields[embed.data.fields.length - 1].value = pages[page];
			curPage = await msg.reply({
				embeds: [embed.setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
				components: [row],
				allowedMentions: { repliedUser: false },
				fetchReply: true,
			});
			
			if(!lib.exists(msg.author)){msg.author = msg.user;}
			const filter = (i) =>
				(i.customId === buttonList[0].data.custom_id ||
				i.customId === buttonList[1].data.custom_id) &&
				i.user.id === msg.author.id;
	
			const collector = await curPage.createMessageComponentCollector({
				filter,
				time: timeout,
			});
	
			collector.on("collect", async (i) => {
				switch (i.customId) {
				case buttonList[0].data.custom_id:
					page = page > 0 ? --page : pages.length - 1;
					break;
				case buttonList[1].data.custom_id:
					page = page + 1 < pages.length ? ++page : 0;
					break;
				default:
					break;
				}
				await i.deferUpdate();
				embed.data.fields[embed.data.fields.length - 1].value = pages[page];
				await i.editReply({
					embeds: [embed.setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
					components: [row],
				});
				collector.resetTimer();
			});
	
			collector.on("end", () => {
				const disabledRow = new ActionRowBuilder().addComponents(
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
		const {ActionRowBuilder, ButtonBuilder} = require("discord.js");

		if (!msg && !msg.channel) throw new Error("Channel is inaccessible.");
		if (!pages) throw new Error("Pages are not given.");
		if (!buttonList) throw new Error("Buttons are not given.");
		if (buttonList[0].style === 5 || buttonList[1].style === 5)
		  	throw new Error(
				"Link buttons are not supported"
		  	);
		if (buttonList.length !== 4) throw new Error("Need four buttons.");
	  
		let page = startingId;
		
		var row = new ActionRowBuilder().addComponents(buttonList);
		var singleRow = new ActionRowBuilder().addComponents(buttonList[3]);
		
		if(alternateImages[page] != "Not owned"){
			pages[page].setThumbnail(alternateImages[page]);
		}

		if(extraButtons[page].data.custom_id.split("|")[1] != "None"){
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
				(i.customId === buttonList[0].data.custom_id ||
				i.customId === buttonList[1].data.custom_id ||
				i.customId === buttonList[2].data.custom_id ||
				i.customId === extraButtons[page].data.custom_id) &&
				i.user.id === msg.author.id;
	  
		  	const collector = await curPage.createMessageComponentCollector({
				filter,
				time: timeout,
		  	});
	  
		  	collector.on("collect", async (i) => {
				switch (i.customId) {
				case buttonList[0].data.custom_id:
					page = page > 0 ? --page : pages.length - 1;
					break;
				case buttonList[1].data.custom_id:
					page = lib.rand(0, pages.length - 1);
					break;
				case buttonList[2].data.custom_id:
					page = page + 1 < pages.length ? ++page : 0;
					break;
				case extraButtons[page].data.custom_id:
					page = parseInt(extraButtons[page].data.custom_id.split("|")[1]);
					break;
				default:
					break;
				}
				if(!lib.exists(msg.author)){msg.author = msg.user;}
				buttonList[3] = new ButtonBuilder()
					.setCustomId(msg.author.id + '|captures favorite ' + pages[page].data.title.trim())
					.setLabel('Favorite')
					.setStyle(3);
				row = new ActionRowBuilder().addComponents(buttonList);

				if(alternateImages[page] != "Not owned"){
					pages[page].setThumbnail(alternateImages[page]);
				}else if(pages[page].hasOwnProperty('thumbnail')){
					delete pages[page].thumbnail;
				}
				if(extraButtons[page].data.custom_id.split("|")[1] != "None"){
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
				const row = new ActionRowBuilder().addComponents(
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
	async itemEmbedPagination(user, msg, pages, buttonList, startingId, timeout = 120000, isShop){
		const {ActionRowBuilder, ButtonBuilder} = require("discord.js");

		if (!msg && !msg.channel) throw new Error("Channel is inaccessible.");
		if (!pages) throw new Error("Pages are not given.");
		if (!buttonList) throw new Error("Buttons are not given.");
		if (buttonList[0].style === 5 || buttonList[1].style === 5)
		  	throw new Error(
				"Link buttons are not supported"
		  	);
		
		let page = startingId;
		if(isShop){
			buttonList.push(
				new ButtonBuilder()
					.setCustomId(user.id + "|buy " + pages[page].data.title)
					.setLabel('Buy')
					.setStyle(1)
			);
		}else{
			buttonList.push(
				new ButtonBuilder()
					.setCustomId(user.id + "|use " + pages[page].data.title)
					.setLabel('Use')
					.setStyle(1)
			);
		}

		var row = new ActionRowBuilder().addComponents(buttonList);

		var curPage = await msg.reply({
			embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
			components: [row],
			allowedMentions: { repliedUser: false },
			fetchReply: true
		});
	
		if(!lib.exists(msg.author)){msg.author = msg.user;}
		const filter = (i) =>
			(i.customId === buttonList[0].data.custom_id ||
			i.customId === buttonList[1].data.custom_id ||
			i.customId === buttonList[2].data.custom_id) &&
			i.user.id === msg.author.id;
	
		const collector = await curPage.createMessageComponentCollector({
			filter,
			time: timeout,
		});
	
		collector.on("collect", async (i) => {
			switch (i.customId) {
			case buttonList[0].data.custom_id:
				page = page > 0 ? --page : pages.length - 1;
				break;
			case buttonList[1].data.custom_id:
				page = lib.rand(0, pages.length - 1);
				break;
			case buttonList[2].data.custom_id:
				page = page + 1 < pages.length ? ++page : 0;
				break;
			default:
				break;
			}
			if(isShop){
				buttonList[3] = new ButtonBuilder()
					.setCustomId(user.id + "|buy " + pages[page].data.title)
					.setLabel('Buy')
					.setStyle(1)
			}else{
				buttonList[3] = new ButtonBuilder()
					.setCustomId(user.id + "|use " + pages[page].data.title)
					.setLabel('Use')
					.setStyle(1)
			}
			row = new ActionRowBuilder().addComponents(buttonList);
			await i.deferUpdate();
			await i.editReply({
				embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
				components: [row],
			});
			collector.resetTimer();
		});
		
		collector.on("end", () => {
			const row = new ActionRowBuilder().addComponents(
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
		const {ActionRowBuilder} = require("discord.js");

		if (!msg && !msg.channel) throw new Error("Channel is inaccessible.");
		if (!pages) throw new Error("Pages are not given.");
		if (!buttonList) throw new Error("Buttons are not given.");
		if (buttonList[0].style === 5 || buttonList[1].style === 5)
		  	throw new Error(
				"Link buttons are not supported"
		  	);
		
		let page = 0;
		var row = new ActionRowBuilder().addComponents(buttonList);

		var curPage = await msg.reply({
			embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
			components: [row],
			allowedMentions: { repliedUser: false },
			fetchReply: true
		});
	
		if(!lib.exists(msg.author)){msg.author = msg.user;}
		const filter = (i) =>
			(i.customId === buttonList[0].data.custom_id ||
			i.customId === buttonList[1].data.custom_id) &&
			i.user.id === msg.author.id;
		
		const collector = await curPage.createMessageComponentCollector({
			filter,
			time: timeout,
		});
	
		collector.on("collect", async (i) => {
			switch (i.customId) {
			case buttonList[0].data.custom_id:
				page = page > 0 ? --page : pages.length - 1;
				break;
			case buttonList[1].data.custom_id:
				page = page + 1 < pages.length ? ++page : 0;
				break;
			default:
				break;
			}
			
			row = new ActionRowBuilder().addComponents(buttonList);
			await i.deferUpdate();
			await i.editReply({
				embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
				components: [row],
			});
			collector.resetTimer();
		});
		
		collector.on("end", () => {
			const row = new ActionRowBuilder().addComponents(
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

	// Input: Object, array, array, integer
	// Function: Creates an embed with buttons for switching between pages. The pages have to be supplied by the parent function in their entirety
	async fullEmbedPaginationWithReroll(msg, pages, buttonList, timeout = 120000){
		const {ActionRowBuilder, EmbedBuilder} = require("discord.js");

		if (!msg && !msg.channel) throw new Error("Channel is inaccessible.");
		if (!pages) throw new Error("Pages are not given.");
		if (!buttonList) throw new Error("Buttons are not given.");
		if (buttonList[0].style === 5 || buttonList[1].style === 5)
		  	throw new Error(
				"Link buttons are not supported"
		  	);
		
		let page = 0;
		var row = new ActionRowBuilder().addComponents(buttonList);

		var curPage = await msg.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle(pages[page].entryName)
					.setImage(pages[page].content)
					.setFooter({ text: `Page ${page + 1} / ${pages.length}` })
			],
			components: [row],
			allowedMentions: { repliedUser: false },
			fetchReply: true
		});
	
		if(!lib.exists(msg.author)){msg.author = msg.user;}
		const filter = (i) =>
			(i.customId === buttonList[0].data.custom_id ||
			i.customId === buttonList[1].data.custom_id ||
			i.customId === buttonList[2].data.custom_id) &&
			i.user.id === msg.author.id;
		
		const collector = await curPage.createMessageComponentCollector({
			filter,
			time: timeout,
		});
	
		collector.on("collect", async (i) => {
			switch (i.customId) {
			case buttonList[0].data.custom_id:
				page = page > 0 ? --page : pages.length - 1;
				break;
			case buttonList[1].data.custom_id:
				var newPage = page;
				while(newPage == page && pages.length > 1){
					newPage = lib.rand(0, pages.length - 1);
				}
				page = newPage;
				break;
			case buttonList[2].data.custom_id:
				page = page + 1 < pages.length ? ++page : 0;
				break;
			default:
				break;
			}
			
			row = new ActionRowBuilder().addComponents(buttonList);
			await i.deferUpdate();
			await i.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle(pages[page].entryName)
						.setImage(pages[page].content)
						.setFooter({ text: `Page ${page + 1} / ${pages.length}` })
				],
				components: [row],
			});
			collector.resetTimer();
		});
		
		collector.on("end", () => {
			const row = new ActionRowBuilder().addComponents(
				buttonList[0].setDisabled(true),
				buttonList[1].setDisabled(true),
				buttonList[2].setDisabled(true)
			);
			curPage.edit({
				embeds: [
					new EmbedBuilder()
						.setTitle(pages[page].entryName)
						.setImage(pages[page].content)
						.setFooter({ text: `Page ${page + 1} / ${pages.length}` })
				],
				components: [row],
			});
		});
		
		return curPage;
	},

	// Input: Object, array, array, integer, integer
    // Function: Creates an interactive message with several pages that can be switched between
	async embedlessPagination(msg, pages, buttonList, startingId, timeout = 120000){
		const {ActionRowBuilder} = require("discord.js");

		if (!msg && !msg.channel) throw new Error("Channel is inaccessible.");
		if (!pages) throw new Error("Pages are not given.");
		if (!buttonList) throw new Error("Buttons are not given.");
		if (buttonList[0].style === 5 || buttonList[1].style === 5)
			throw new Error(
				"Link buttons are not supported"
			);
		if (buttonList.length < 2) throw new Error("Need at least two buttons.");
	  
		let page = startingId;
		
		var row = new ActionRowBuilder().addComponents(buttonList);
		
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
				(i.customId === buttonList[0].data.custom_id ||
				i.customId === buttonList[1].data.custom_id ||
				i.customId === buttonList[2].data.custom_id) &&
				i.user.id === msg.author.id;
	  
			const collector = await curPage.createMessageComponentCollector({
				filter,
				time: timeout,
			});
	  
			collector.on("collect", async (i) => {
				switch (i.customId) {
				case buttonList[0].data.custom_id:
					page = page > 0 ? --page : pages.length - 1;
					break;
				case buttonList[1].data.custom_id:
					page = lib.rand(0, pages.length - 1);
					break;
				case buttonList[2].data.custom_id:
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
				const row = new ActionRowBuilder().addComponents(
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

	// Input: Integer
	// Function: Checks if a year is a leap year
	// Output: Boolean
	checkLeapYear(year){
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
		return leapYear;
	},

	// Input: Integer
	// Dependency: lib itself
	// Function: Converts months into the correct number of days based on the current date
	// Output: Integer
	monthsToDays(months){
		let days = 0;
		let daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

		// Add up the days, starting from the current month
		let d = new Date();
		let x = d.getMonth();
		let year = d.getUTCFullYear();
		for(count = 0; count < months; x++){
			if(x == 12) {x = 0; year++}  // Back to January after December. Also increment the year for leap checking
			if(x == 1 && lib.checkLeapYear(year)) days += 1;    // Leap year correction for February
			days += daysPerMonth[x];
			count++
		}
		return days;
	},

	// Input: Integer
	// Dependency: lib itself
	// Funtion: Adjusts a timestamp to land on the same day of the month as today when added to the current epoch
	// Output: Integer
	getSameDayInMonth(timestamp){
		let d = new Date();
		let dayCount = timestamp / 86400;

		// Calculate the amount of months
		let monthCount;
		if(dayCount % 31 == 0){monthCount = dayCount / 31}else
		if(dayCount % 30 == 0){monthCount = dayCount / 30}else
		if(dayCount % 29 == 0){monthCount = dayCount / 29}else
		if(dayCount % 28 == 0){monthCount = dayCount / 28}else
		{ monthCount = Math.floor(dayCount / 30); }

		// Turn the months back into days with leap days and day counts factored in
		return lib.monthsToDays(monthCount) * 24 * 60 * 60;
	},

	// Input: Integer / Unix timestamp in seconds
	// Dependency: lib itself
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
		for(o = 0; o < loopCount; o++){
			if(lib.checkLeapYear(year)){
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

			var outputEmbed = new Discord.EmbedBuilder()
				.setColor('#fc0303')
				.setTitle("Command response error")
				.setDescription("```javascript\n" + error.toString() + customMessage + "```" + causeInfo)
				.setFooter({ text: message.createdTimestamp.toString() });

			var {isTestBranch} = require('./config.json');
			if(isTestBranch){
				message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false } });
			}else{
				message.reply({ content: "@ __**" + username + "**__```dust\n{ An error has occurred! }```All relevant details have automatically been sent to the main server for further investigation", allowedMentions: { repliedUser: false }});
				message.client.channels.cache.get("859477509178654792").send({ embeds: [outputEmbed] });
			}
		}
	},

	// Input: String
    // Dependency: Lib itself
    // Function: Generates one or more nicknames
    // Output: String, String
	generateNicks(allArgs){

		var args = allArgs.split(" ");
		// Default to type4
		if(args.length == 1 && args[0] == '') args = ['type4']

		// Set starting variables
		var words = lib.readFile("../nyextest/data/imported/words.txt");
		var output = "";
		var count = 1;
		var trueNameFlag = false;

		// Get count argument if it exists
		if(lib.exists(args[0])){
			if(!isNaN(args[0])){
				if(parseInt(args[0]) > 20 || parseInt(args[0]) < 1){
					// Bad number
					message.reply({ content: "\u274C You may only generate between 1 and 20 nicknames at a time!", allowedMentions: { repliedUser: false }});
					return ["error", "error"];
				}
				count = parseInt(args[0]);
				args.splice(0, 1);
			}
		}
		
		// Get truename argument if it exists
		if(lib.exists(args[0])){
			args[0] = args[0].toLowerCase();
			if(args[0] == "truename"){
				args.splice(0, args.length);
				trueNameFlag = true;
			}
		}
		
		// Split word list
		var wordLists = words.split("\n#####################################################\n");
		var adjectives = wordLists[0].split("\n");
		var nouns = wordLists[1].split("\n");
		var mhwTitles = wordLists[2].split("\n");
		var userWords = wordLists[3].split("\n");
		
		// Go through a loop generating random nicknames
		var usableNick = "";
		for(i = 0; i < count; i++){

			// Deconstruct a maximum of 2 args, preparing the word order
			var wordTypes = [];
			var customWord = "";
			var customWordUsed = false;
			var nextWordPosition = lib.rand(0, 1);

			// Evaluate type1 and type2 first
			if(args.includes("type1")){
				wordTypes[0] = "type1";
				args.splice(args.indexOf("type1"), 1);
				nextWordPosition = 1;
			}
			if(args.includes("type2")){
				wordTypes[0] = "type2";
				args.splice(args.indexOf("type2"), 1);
				nextWordPosition = 1;
			}

			for(p = 0; p < args.length && p < 2; p++){
				args[p] = args[p].toLowerCase();

				// Determine the position of the theoretical next word
				var position = nextWordPosition;
				if(position == 0){nextWordPosition = 1;}else
				if(position == 1){nextWordPosition = 0;}

				if(args[p] == "type4" || args[p] == "type3"){
					wordTypes[position] = "type4";

				}else if(!customWordUsed && args[p] != "type2" && args[p] != "type1" && lib.exists(args[p])){
					wordTypes[position] = "customWord";

					// Modify the custom word
					args[p] = args[p].replaceAll(/_/g, " ");
					customWord = args[p].charAt(0).toUpperCase() + args[p].slice(1);

					// Save custom word if it is new
					if(!userWords.includes(args[p])){
						lib.saveFile("../nyextest/data/imported/words.txt", words + "\n" + args[p]);
					}
					customWordUsed = true;
				}
			}

			// Do the following twice (for both of the words) unless truenames are being generated
			var loopCount = 2;
			var tempOutput = "";
			if(trueNameFlag){loopCount = 1;}
			for(p = 0; p < loopCount; p++){
			   
				if(trueNameFlag){
					// Generate a new random word
					var consonants = ['w','r','t','z','p','s','d','f','g','h','j','k','l','y','x','c','v','b','n','m'];
					var vowels = ['e','u','i','o','a'];
					var previousChar = "r";     // Set this to r to avoid errors and to allow all starting chars
					var wordLength = lib.rand(3, 4);
					var consonantStart = false;
					for(x = 0; x < wordLength; x++){
						// 50-50 chance to have only one character in the first segment
						var odd = false;
						if(x === 0){if(lib.rand(0, 1) === 1){odd = true;}}
						if(lib.rand(0, 1) === 1 && !(consonantStart && x === 1)){
							var newChar = getNextChar(consonants, previousChar);
							tempOutput += newChar;
							previousChar = newChar;
							consonantStart = true;
	
							if(!odd){
								newChar = getNextChar(vowels, previousChar);
								tempOutput += newChar;
								previousChar = newChar;
								consonantStart = false;
							}
						}
						else{
							var newChar = getNextChar(vowels, previousChar);
							tempOutput += newChar;
							previousChar = newChar;

							if(!odd){
								newChar = getNextChar(consonants, previousChar);
								tempOutput += newChar;
								previousChar = newChar;
							}
						}
					}
					// Function for rerolling characters if they are not allowed
					function getNextChar(array, prevChar) {
						var forbiddenCombos = {
							w: ['w', 'h', 'v'],
							r: ['?'],
							t: ['w', 'd', 'x'],
							z: ['w', 's', 'f', 'h', 'j', 'x'],
							p: ['w', 'x', 'b'],
							s: ['w', 'z', 'x'],
							d: ['t', 'x'],
							f: ['w', 'h', 'x', 'v'],
							g: ['k', 'x'],
							h: ['h'],
							j: ['w', 't', 'z', 'p', 's', 'd', 'f', 'g', 'j', 'k', 'l', 'x', 'c', 'v', 'b'],
							k: ['g', 'x', 'c'],
							l: ['w', 'h', 'x'],
							y: ['y', 'j'],
							x: ['w', 'z', 's', 'f', 'g', 'h', 'j', 'k', 'v'],
							c: ['g', 'k', 'x'],
							v: ['w', 'z', 'f', 'h', 'x'],
							b: ['p', 'h', 'x'],
							n: ['h', 'x'],
							m: ['h', 'x'],
							e: ['?'],
							u: ['?'],
							i: ['w', 'i', 'y'],
							o: ['?'],
							a: ['?']
						};
						var result = array[lib.rand(0, array.length - 1)];
						while(forbiddenCombos[prevChar].includes(result)){
							result = array[lib.rand(0, array.length - 1)];
						}
						return result;
					}

					tempOutput = tempOutput.charAt(0).toUpperCase() + tempOutput.slice(1);
				}else{
					// Set starting variables
					var randNum = lib.rand(1, 100);
					// If the user included one of the keywords, set the word pool for every loop manually
					if(wordTypes[p] == "type1" && p == 0){
						randNum = 51;
					}else if(wordTypes[p] == "type2" && p == 0){
						randNum = 66;
					}else if(wordTypes[p] == "type4"){
						randNum = 1;
					}else if(wordTypes[p] == "customWord"){
						randNum = 0;
					}else{

					}
					
					// Determine result
					if(randNum >= 50 && p == 1){
						randNum = lib.rand(1, 49)
					}
					if(randNum >= 50 && p == 0){
						if(randNum >=65){
							var chosenList = adjectives;
						}else{
							var chosenList = mhwTitles;
						}
					}else{
						if(randNum <= 5){
							if(randNum == 0){
								var chosenList = [customWord];
							}else{
								var chosenList = userWords;
							}
						}else{
							var chosenList = nouns;
						}
					}

					// Add this loop's word to the nick
					var selectedWord = chosenList[lib.rand(0, chosenList.length - 1)];
					if(p == 1){
						tempOutput += " ";
					}
					tempOutput += selectedWord.charAt(0).toUpperCase() + selectedWord.slice(1);
					
				}
			}

			// Add this loop's nick to the final output
			if(i > 0){
				output = output + "\n";
			}
			output = output + tempOutput;

			// Use this as the main nick if there is only one being generated
			if(count == 1){
				usableNick = tempOutput;
			}
			
		}

		// Footer preparation
		if(usableNick != ""){
			usableNick = "/nick new_nick:" + usableNick;
		}

		return [output, usableNick];
	},

	// Input: String
    // Dependency: Lib itself
    // Function: Generates one or more abilities
    // Output: String
	generateAbilities(allArgs){

		// Set starting variables
		var words = lib.readFile("../nyextest/data/imported/words.txt");
		var output = "";
		var count = 1;

		// Get count argument if it exists
		if(lib.exists(allArgs)){
			if(!isNaN(allArgs)){
				if(parseInt(allArgs) > 20 || parseInt(allArgs) < 1){
					// Bad number
					message.reply({ content: "\u274C You may only generate between 1 and 20 abilities at a time!", allowedMentions: { repliedUser: false }});
					return "error";
				}
				count = parseInt(allArgs);
			}
		}

		// Split word list
		var wordLists = words.split("\n#####################################################\n");
		var adjectives = wordLists[0].split("\n");
		var nouns = wordLists[1].split("\n");
		var verbs = lib.readFile("../nyextest/data/imported/verbs.txt").split("\n");
		
		// Go through a loop generating random abilities
		for(i = 0; i < count; i++){

			// In 10% of cases, use an adjective instead of a noun
			var chosenList = nouns;
			if(lib.rand(1, 10) == 1){ chosenList = adjectives; }

			// Random ability String
			var tempOutput = verbs[lib.rand(0, verbs.length - 1)] + " " + chosenList[lib.rand(0, chosenList.length - 1)];

			// Add this loop's ability to the final output
			if(i > 0){
				output = output + "\n";
			}
			output = output + tempOutput;
			
		}

		return output;

	},

	// Input: String
    // Dependency: Lib itself
    // Function: Generates a comment
    // Output: String, String
	generateComment(allArgs){

		// Set starting variables
		var words = lib.readFile("../nyextest/data/imported/words.txt");
		var wordLists = words.split("\n#####################################################\n");
		var nouns = wordLists[1].split("\n");
		var comments = lib.readFile("../nyextest/data/imported/comments.txt").split("\n");
		var output = "";
		var chosenWord = "";

		// Get random template ID
		var id = lib.rand(0, comments.length - 1);

		// Get ID or word argument if it exists
		if(lib.exists(allArgs)){
			if(!isNaN(allArgs)){

				// ID
				if(parseInt(allArgs) > comments.length || parseInt(allArgs) < 1){
					// Bad number
					message.reply({ content: "\u274C This comment ID does not exist! There are currently only " + comments.length + " templates!", allowedMentions: { repliedUser: false }});
					return ["error", "error"];
				}
				id = parseInt(allArgs) - 1;

			}else{
				// Custom word
				chosenWord = allArgs;
			}
		}
		
		// Replace placeholder in a comment template with the word
		if(chosenWord == ""){ chosenWord = nouns[lib.rand(0, nouns.length - 1)]; }
		output = comments[id].replace(/#W#/g, chosenWord.toLowerCase());

		return [output, "Template ID: " + (id + 1)];

	},

	// Input: Object, String, String, String, String
    // Dependency: Lib itself
    // Function: Adds a reroll button to the output embed for easy re-activation of the command
	async rerollbuttonReply(message, content, allArgs, footer, commandType){
		const Discord = require('discord.js');

		// Make reroll button
        var button = new ButtonBuilder()
            .setCustomId("rerollbutton")
            .setLabel('Reroll')
            .setStyle(1);
		var buttons = [button];

		// Create first embed message
		var row = new ActionRowBuilder().addComponents(buttons);
		var outputEmbed = new Discord.EmbedBuilder()
			.setColor("#0099ff")
			.setTitle("Here you go:")
			.setDescription(content);
		if(footer != ""){
			outputEmbed.setFooter({ text: footer });
		}

		const newMessage = await message.reply({
			embeds: [outputEmbed],
			components: [row],
			allowedMentions: { repliedUser: false },
			fetchReply: true,
		});

		if(!lib.exists(message.author)){message.author = message.user;}
		const filter = (i) =>
			i.user.id === message.author.id && 
			i.customId === buttons[0].data.custom_id;
			
		const collector = await newMessage.createMessageComponentCollector({
			filter,
			time: 20000,
		});

		// When the reroll button is pressed
		collector.on("collect", async (i) => {
			var newDesc = "Error: Could not recall command";
			var newFooter = "";

			// Re-run the original command again to get new values for the embed
			if(commandType == "nickname"){

				var nickResult = lib.generateNicks(allArgs);
				newDesc = nickResult[0];
				newFooter = nickResult[1];

			}else if(commandType == "ability"){

				newDesc = lib.generateAbilities(allArgs);

			}else if(commandType == "comment"){

				var commentResult = lib.generateComment(allArgs);
				newDesc = commentResult[0];
				newFooter = commentResult[1];

			}

			// Modify the embed
			outputEmbed = new Discord.EmbedBuilder()
				.setColor("#0099ff")
				.setTitle("Here you go:")
				.setDescription(newDesc);
			if(newFooter != ""){
				outputEmbed.setFooter({ text: newFooter });
			}

			await i.deferUpdate();
			await i.editReply({
				embeds: [outputEmbed]
			});
			collector.resetTimer();
		});

		// Upon timeout of the collector
		collector.on("end", () => {
			// Set all buttons to disabled
			for(y = 0; y < buttons.length; y++){
				buttons[y].setDisabled(true);
			}
			var disabledRow = new ActionRowBuilder().addComponents(buttons);
			newMessage.edit({
				components: [disabledRow]
			});
		});

	},

	// Input: Object, Object, String
	// Dependency: Lib itself
	// Funtion: Creates the files necessary for new user accounts and returns an introductory message to be attached to a command output
	// Output: String
	createUserFiles(message, user, prefix){
		const Discord = require('discord.js');
		var dir = "userdata/" + user.id;
		var username = user.username;

		fs.mkdirSync(dir);
		lib.saveFile(dir + "/ability.txt", "0|0|0");
		lib.saveFile(dir + "/ability_cd.txt", "");
		lib.saveFile(dir + "/ability_timestamp.txt", "");
		lib.saveFile(dir + "/all_captures.txt", "");
		lib.saveFile(dir + "/area.txt", "4");
		lib.saveFile(dir + "/boss_cd.txt", "1");
		lib.saveFile(dir + "/captures.txt", "");
		lib.saveFile(dir + "/charges.txt", "0");
		lib.saveFile(dir + "/chain.txt", "0|0");
		lib.saveFile(dir + "/commandmode.txt", "single");
		lib.saveFile(dir + "/confirm.txt", "");
		lib.saveFile(dir + "/confirm_conv.txt", "no");
		lib.saveFile(dir + "/cooldown.txt", "1");
		lib.saveFile(dir + "/crafting_queue.txt", "");
		lib.saveFile(dir + "/current_buff.txt", "");
		lib.saveFile(dir + "/current_quest.txt", "0");
		lib.saveFile(dir + "/daily.txt", "1|0");
		lib.saveFile(dir + "/daily_radar.txt", "1");
		lib.saveFile(dir + "/dmupdates.txt", "Off|Off|Off");
		lib.saveFile(dir + "/equipment.txt", "0,1,2");
		lib.saveFile(dir + "/equip_modifiers.txt", "|0|0|0|0|0|0\n|0|0|0|0|0|0\n|0|0|0|0|0|0");
		lib.saveFile(dir + "/fav_mats.txt", "");
		lib.saveFile(dir + "/hp.txt", "0");
		lib.saveFile(dir + "/inventory.txt", "");
		lib.saveFile(dir + "/main_monster.txt", "");
		lib.saveFile(dir + "/materials.txt", "");
		lib.saveFile(dir + "/mon_cd.txt", "1");
		lib.saveFile(dir + "/monster_mode.txt", "normal");
		lib.saveFile(dir + "/new_equip.txt", "");
		lib.saveFile(dir + "/new_modifier.txt", "");
		lib.saveFile(dir + "/projects.txt", "");
		lib.saveFile(dir + "/radar_values.txt", "0,0");
		lib.saveFile(dir + "/research.txt", "");
		lib.saveFile(dir + "/saved_chain.txt", "");
		lib.saveFile(dir + "/saved_encounter.txt", "");
		lib.saveFile(dir + "/scrap.txt", "0");
		lib.saveFile(dir + "/stats.txt", "Classless|5|5|3|0|0|0|0|0|D|1|0|0|0");
		lib.saveFile(dir + "/token_state.txt", "");
		lib.saveFile(dir + "/username.txt", username);

		// If the user is an alpha tester, give them their trophy to start with
		var userId = user.id.toString().trim();
		newInfo = "- Use`" + prefix + "enc` at any time to start an encounter\n- You can either `" + prefix + "capture` or `" + prefix + "fight` monsters\n- Check out `" + prefix + "quest` to make progress and learn more\n- Use `" + prefix + "help` for more concentrated information\n- And please use `" + prefix + "submit` to send feedback and bug reports!";
		if(userId == "266598133683847169" || userId == "690236539971698719" || userId == "480412132538712070" || userId == "270597404342878210"){
			lib.saveFile(dir + "/trophies.txt", "10|Tester|Special|**Alpha Tester** - One of the special people!");
			newInfo = "**Welcome back, alpha tester! Your trophy has been added**\n" + newInfo;
		}else if(userId == "214754022832209921"){
			lib.saveFile(dir + "/trophies.txt", "10|Tester|Special|**Creator** - Real!");
			newInfo = "**You deleted your account again? So dedicated!**\n" + newInfo;
		}else{
			newInfo = "**Welcome to the game!**\n" + newInfo;
			lib.saveFile(dir + "/trophies.txt", "");
		}

		// Output embed
        var outputEmbed = new Discord.EmbedBuilder()
        	.setTitle("@ __**" + username + "**__")
        	.setDescription(newInfo);

		// Make buttons
		var button1 = new ButtonBuilder()
			.setCustomId(userId + "|encounter|embedEdit")
			.setLabel('Encounter')
			.setStyle(1);
		var row = new ActionRowBuilder().addComponents([button1]);

		// Output
		message.reply({ embeds: [outputEmbed], components: [row], allowedMentions: { repliedUser: false } });
		return;
	},

	// Input: Integer, String
	// Dependency: Lib itself
	// Funtion: Prepares a link to an area image
	// Output: String
	getAreaImage(areaId, areaName) {
		let areaImageCounts = [4, 15, 3, 4, 8, 9, 5, 5, 4, 8, 5, 6, 7, 5];
		let num = lib.rand(1, areaImageCounts[areaId]);
		let areaImage = 'https://artificial-index.com/media/rpg_areas/' + areaName.toLowerCase().replace(/ /g, '_') + '_' + num + '.png';
		return areaImage;
	},

	// Input: Object, Object
	// Dependency: Lib itself
	// Funtion: Executes a random event from a selection of possible outcomes
	// Output: None
	randomEvent(message, user) {
		// Important variables
        var dir = "userdata/" + user.id;

		// Pick an event
		var output = "";
		var chosenEvent = null;
		var events = [
			{name: '+treasure', weight: 4}, // 30
			{name: '+specialItem', weight: 2}, // 10
			{name: '+gold', weight: 5}, // 50
			{name: '-gold', weight: 2}, // 30
			{name: '+scrap', weight: 5}, // 50
			{name: '-scrap', weight: 2}, // 30
			{name: 'realm', weight: 0}, // 20
			{name: 'buff', weight: 0}, // 30
			{name: 'extremeBuff', weight: 0}, // 20
			{name: '+radar', weight: 0}, // 20
			{name: 'loseEncounter', weight: 2}, // 10
			{name: 'makeShiny', weight: 0}, // 1
			{name: '+exp', weight: 0}, // 20
			{name: 'abilityCd', weight: 0}, // 40
			{name: 'nothing', weight: 5} // 100
		];
		var weightSum = 0;
		for(x = 0; x < events.length; x++){ weightSum = weightSum + events[x].weight; }
		var eventRoll = lib.rand(1, weightSum);
		for(x = 0; x < events.length && chosenEvent == null; x++){
			if(eventRoll <= events[x].weight){
				chosenEvent = events[x].name;
			}else{
				eventRoll -= events[x].weight;
			}
		}

		var icon_array = {D: "<:real_black_circle:856189638153338900>", C: "🔵", B: "🟢", A: "🔴", S: "🟡", SS: "🟠", Special: "✨", Vortex: "🌀"};
		switch(chosenEvent){
			case '+treasure':
				// Get treasure loot data
				var items = lib.readFile("data/items.txt").split(";\n");
				var treasures = lib.readFile("data/treasure_drops.txt").split(";\n");
				var common_drops = treasures[0].split(",");
				var rare_drops = treasures[1].split(",");
				var veryrare_drops = treasures[2].split(",");
				var veryrare_chance = 2;
				var rare_chance = 5 + veryrare_chance;
				
				// Determine results
				var rarity_roll = lib.rand(1, 100);
				if(rarity_roll <= veryrare_chance){
					var drop_pool = veryrare_drops;
				}else if(rarity_roll <= rare_chance){
					var drop_pool = rare_drops;
				}else{
					var drop_pool = common_drops;
				}
				var drop_roll = lib.rand(0, drop_pool.length - 1);
				var item_key = drop_pool[drop_roll];
				var item = items[item_key].split("|");
				
				// Add it to the inventory
				var inventory = lib.readFile(dir + "/inventory.txt");
				if(inventory !== ""){
					inventory = inventory + "," + item_key;
				}else{
					inventory = inventory + item_key;
				}
				lib.saveFile(dir + "/inventory.txt", inventory);

				output = "You got " + icon_array[item[12]] +"**" + item[0] + "**!";
				break;

			case '+specialItem':
				var items = lib.readFile("data/items.txt").split(";\n");
				var possibleRewards = [
					{name: "Lure Vortex", id: 354},
					{name: "Lure Vortex", id: 354},
					{name: "Special Vortex", id: 351},
					{name: "Ability Changer", id: 346},
					{name: "Token", id: 340},
					{name: "Token", id: 340},
					{name: "Token", id: 340},
					{name: "Token", id: 340},
					{name: "Token", id: 340},
					{name: "Dimensional Fragment", id: 114},
					{name: "Dimensional Fragment", id: 114},
					{name: "Unique Fragment", id: 324},
					{name: "Shapeless Shard", id: 325},
					{name: "Shapeless Shard", id: 325},
					{name: "Unstable Vortex", id: 231},
					{name: "Unstable Vortex", id: 231}
				];
				
				// Determine results
				var roll = lib.rand(0, possibleRewards.length - 1);
				var item = items[possibleRewards[roll].id].split("|");
				
				// Add it to the inventory
				var inventory = lib.readFile(dir + "/inventory.txt");
				if(inventory !== ""){
					inventory = inventory + "," + possibleRewards[roll].id;
				}else{
					inventory = inventory + possibleRewards[roll].id;
				}
				lib.saveFile(dir + "/inventory.txt", inventory);

				output = "You got " + icon_array[item[12]] +"**" + item[0] + "**!";
				break;

			case '+gold':
				var possibleAmounts = [50, 100, 100, 150, 150, 150, 150, 200, 200, 300, 500];
				var roll = lib.rand(0, possibleAmounts.length - 1);
				var userData = lib.readFile(dir + "/stats.txt").split("|");
				userData[12] = parseInt(userData[12]) - possibleAmounts[roll];
				lib.saveFile(dir + "/stats.txt", userData.join("|"));
				output = "You got **" + possibleAmounts[roll] + " Gold**!";
				break;

			case '-gold':
				var possibleAmounts = [50, 50, 100, 100, 150, 150, 150, 150, 200, 200, 200, 300, 400];
				var roll = lib.rand(0, possibleAmounts.length - 1);
				var userData = lib.readFile(dir + "/stats.txt").split("|");
				userData[12] = parseInt(userData[12]) - possibleAmounts[roll];
				if(userData[12] < 0){userData[12] = 0;}
				lib.saveFile(dir + "/stats.txt", userData.join("|"));
				output = "You lost **" + possibleAmounts[roll] + " Gold**!";
				break;

			case '+scrap':
				var possibleAmounts = [5, 5, 10, 10, 15, 15, 15, 15, 20, 30];
				var roll = lib.rand(0, possibleAmounts.length - 1);
				var scrap = parseInt(lib.readFile(dir + "/scrap.txt"));
				scrap += possibleAmounts[roll];
				lib.saveFile(dir + "/scrap.txt", scrap);
				output = "You got **" + possibleAmounts[roll] + " Scrap**!";
				break;

			case '-scrap':
				var possibleAmounts = [5, 5, 5, 10, 10, 10, 10, 15, 15, 20];
				var roll = lib.rand(0, possibleAmounts.length - 1);
				var scrap = parseInt(lib.readFile(dir + "/scrap.txt"));
				scrap -= possibleAmounts[roll];
				if(scrap < 0){scrap = 0;}
				lib.saveFile(dir + "/scrap.txt", scrap);
				output = "You lost **" + possibleAmounts[roll] + " Scrap**!";
				break;

			case 'realm':

				break;

			case 'buff':

				break;

			case 'extremeBuff':

				break;

			case '+radar':

				break;

			case 'loseEncounter':
				message.message.embeds[0].data.description = "```diff\n-The encounter was lost...```\u2800\n\u2800\n\u2800";
				output = "You lost the encounter!";
				message.message.components[0].components.splice(0, 2);
				lib.saveFile(dir + "/current_encounter.txt", "");
				break;

			case 'makeShiny':

				break;

			case '+exp':

				break;

			case 'abilityCd':

				break;

			default:
				// Nothing happens
				output = "Nothing happened..."
		}

		// Edit the message
		output = "Event: " + output;
		message.deferUpdate();
		message.message.components[0].components.splice(message.message.components[0].components.length - 1, 1);
		message.message.embeds[0].data.description = message.message.embeds[0].data.description.slice(0, -1);
		if(!message.message.embeds[0].data.description.includes("```")){message.message.embeds[0].data.description += "\n\u2800\n";}
		message.message.embeds[0].data.description += output;
		message.message.edit({ embeds: [message.message.embeds[0]], components: [message.message.components[0]] });
	}

};