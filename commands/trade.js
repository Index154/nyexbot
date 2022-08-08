var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'trade',
	usages: ['[ID or username] [offer]', 'confirm', 'cancel'],
	descriptions: ['Sends a trade offer to someone', 'Accepts the counteroffer made by the trade partner, completing the trade', 'Cancels the current trade'],
	addendum: '\nOnly players who have reached level 10 can trade.\nThe [offer] argument can be a list of multiple monsters, currencies and items. It should be formatted like this: [amount] [monster, currency or item name] + [amount] [monster, currency or item name] + ...\nExample usage: `trade TerraDoge 100 gold + 3 imp + 2 blue slime gel + 4 cloth`\nEvery user can only have one active trade at a time. You can\'t offer more than 15 different things in a single trade (the amount per thing is irrelevant). Equipment can not be traded and materials can only be traded to players of a matching or higher rank. Accepted currencies are gold and scrap',
    category: 'misc',
	
	execute(message, user, args) {
	    fs = require('fs');
	    adc  = require('adc.js');
	    const lib = require("../library.js");
	    var allArgs = args.join(" ").toLowerCase();
	    args = allArgs.split(" ");
	    function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
        }
        function splitList(list, separator){
            if(list.includes(separator)){
                list = list.split(separator);
            }else if(list !== ""){
                list = [list];
            }else{
                list = [];
            }
            return list;
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
        
        // If the user hasn't reached level 10 yet then stop
        var userData = lib.readFile(dir + "/stats.txt").split("|");
        if(parseInt(userData[10]) < 10){
            message.reply({ content: "\u274C You must be at least **level 10** to use this command!\nYour current level is " + userData[10], allowedMentions: { repliedUser: false }});
            return;
        }
        
        if(args[0] == "confirm"){
            // The user tried to confirm a trade
            // Check trade status
            var tradeRaw = lib.readFile(dir + "/trade.txt");
            if(tradeRaw === null || tradeRaw === undefined || tradeRaw === ""){
                // There is no active trade
                message.reply({ content: "\u274C You have no active trade!", allowedMentions: { repliedUser: false }});
                return;
            }
            var trade = tradeRaw.split("|");
            var otherDir = "userdata/" + trade[0];
            var otherUsername = lib.readFile(otherDir + "/username.txt");
            var otherTradeRaw = lib.readFile(otherDir + "/trade.txt");
            if(otherTradeRaw === null || otherTradeRaw === undefined || otherTradeRaw === ""){
                // The other user has not replied to the offer
                message.reply({ content: "\u274C " + otherUsername + " has not replied to your offer yet!", allowedMentions: { repliedUser: false }});
                return;
            }
            var otherTrade = otherTradeRaw.split("|");
            if(otherTrade[0] != user.id){
                // The other user is no longer trading with this user
                message.reply({ content: "\u274C The trade has unexpectedly ended!", allowedMentions: { repliedUser: false }});
                lib.saveFile(dir + "/trade.txt", "");
                return;
            }
            if(trade[2] != "finisher"){
                // This user has sent the latest trade offer so they cannot finish the trade
                message.reply({ content: "\u274C This trade must be confirmed by the other user because you made the latest offer!", allowedMentions: { repliedUser: false }});
                return;
            }
            
            // Load some stuff
            var monster_groups = lib.readFile("data/monsters/monsters.txt").split("#################################################################################\n");
            var inventory = splitList(lib.readFile(dir + "/inventory.txt"), ",");
            var materials = splitList(lib.readFile(dir + "/materials.txt"), ",");
            var captures = splitList(lib.readFile(dir + "/captures.txt"), ";");
            var allCaptures = splitList(lib.readFile(dir + "/all_captures.txt"), ";");
            var scrap = parseInt(lib.readFile(dir + "/scrap.txt"));
            var stats = lib.readFile(dir + "/stats.txt").split("|");
            var otherInventory = splitList(lib.readFile(otherDir + "/inventory.txt"), ",");
            var otherMaterials = splitList(lib.readFile(otherDir + "/materials.txt"), ",");
            var otherCaptures = splitList(lib.readFile(otherDir + "/captures.txt"), ";");
            var otherAllCaptures = splitList(lib.readFile(otherDir + "/all_captures.txt"), ";");
            var otherScrap = parseInt(lib.readFile(otherDir + "/scrap.txt"));
            var otherStats = lib.readFile(otherDir + "/stats.txt").split("|");
            
            var inventories = [inventory, otherInventory, inventory];
            var materialies = [materials, otherMaterials, materials];
            var capturies = [captures, otherCaptures, captures];
            var allCapturies = [otherAllCaptures, allCaptures];
            var scraps = [scrap, otherScrap, scrap];
            var staties = [stats, otherStats, stats];
            var trades = [trade, otherTrade];
            var dirs = [otherDir, dir];
            var trophyMessages = ["", ""];
            var trophyIcons = {D: "<:real_black_circle:856189638153338900>", C: "\uD83D\uDD35", B: "\uD83D\uDFE2", A: "\uD83D\uDD34", S: "\uD83D\uDFE1", SS: "\uD83D\uDFE0", Slayer1: "\uD83E\uDD47", Slayer2: "\uD83E\uDD48", Slayer3: "\uD83E\uDD49", Tester: "\uD83D\uDD2C", Special: "\u2728", Level: "\u2747", Quest: "\uD83D\uDCAC", "(Special)": "\uD83D\uDFE3", Vortex: "\uD83C\uDF00", Slime: "<:slime:860529740057935872>", Beast: "\uD83D\uDC3B", Demon: "\uD83D\uDC79", Undead: "\uD83D\uDC80", Arthropod: "\uD83E\uDD97", Dark: "<:darkness:860530638821261322>", Water: "\uD83D\uDCA7", Plant: "\uD83C\uDF3F", Reptile: "\uD83E\uDD8E", Armored: "\uD83D\uDEE1", Flying: "<:wing:860530400539836456>", Fire: "\uD83D\uDD25", Fish: "\uD83D\uDC1F", Holy: "\uD83D\uDD31", Alien: "\uD83D\uDC7D", Intangible: "\uD83D\uDC7B", Frost: "\uD83E\uDDCA", Lightning: "\uD83C\uDF29", Legendary: "\u269C", Dragon: "\uD83D\uDC32"};
            
            // For each user, remove the traded entries
            for(o = 0; o < 2; o++){
                // Update scrap files on the second runthrough
                if(o == 1){
                    scraps[2] = scraps[0];
                }
                
                var thisInventory = inventories[o];
                var altInventory = inventories[o + 1];
                var thisMaterials = materialies[o];
                var altMaterials = materialies[o + 1];
                var thisCaptures = capturies[o];
                var altCaptures = capturies[o + 1];
                var altAllCaptures = allCapturies[o];
                
                thisTrade = trades[o];
                if(thisTrade[1].includes("#")){
                    tradeEntries = thisTrade[1].split("#");
                }else{
                    tradeEntries = [thisTrade[1]];
                }
                
                // Remove every trade entry and give it to the other user
                var new_trophies = [];
                var tempDir = dirs[o];
                for(i = 0; i < tradeEntries.length; i++){
                    var entryData = tradeEntries[i].split(";");
                    var amount = parseInt(entryData[0]);
                    var id = entryData[1];
                    
                    // Find out which file the entry belongs to and move it accordingly
                    if(id == "Gold" || id == "Scrap"){
                        if(id == "Gold"){
                            var thisGold = parseInt(staties[o][12]);
                            var altGold = parseInt(staties[o + 1][12]);
                            if(thisGold < amount){
                                // Not enough!
                                message.reply({ content: "\u274C Some of the trade offers could no longer be found in one of the users' possessions!", allowedMentions: { repliedUser: false }});
                                return;
                            }
                            staties[o][12] = thisGold - amount;
                            staties[o + 1][12] = altGold + amount;
                        }else{
                            var thisScrap = scraps[o];
                            var altScrap = scraps[o + 1];
                            if(thisScrap < amount){
                                // Not enough!
                                message.reply({ content: "\u274C Some of the trade offers could no longer be found in one of the users' possessions!", allowedMentions: { repliedUser: false }});
                                return;
                            }
                            scraps[o] = thisScrap - amount;
                            scraps[o + 1] = altScrap + amount;
                        }
                    }else
                    if(thisInventory.includes(id)){
                        for(y = 0; y < amount; y++){
                            if(thisInventory.indexOf(id) == -1){
                                // Not enough!
                                message.reply({ content: "\u274C Some of the trade offers could no longer be found in one of the users' possessions!", allowedMentions: { repliedUser: false }});
                                return;
                            }
                            thisInventory.splice(thisInventory.indexOf(id), 1);
                            altInventory.push(id);
                        }
                    }else
                    if(thisMaterials.includes(id)){
                        for(y = 0; y < amount; y++){
                            if(thisMaterials.indexOf(id) == -1){
                                // Not enough!
                                message.reply({ content: "\u274C Some of the trade offers could no longer be found in one of the users' possessions!", allowedMentions: { repliedUser: false }});
                                return;
                            }
                            thisMaterials.splice(thisMaterials.indexOf(id), 1);
                            altMaterials.push(id);
                        }
                    }else
                    if(thisCaptures.includes(id)){
                        for(y = 0; y < amount; y++){
                            if(thisCaptures.indexOf(id) == -1){
                                // Not enough!
                                message.reply({ content: "\u274C Some of the trade offers could no longer be found in one of the users' possessions!", allowedMentions: { repliedUser: false }});
                                return;
                            }
                            thisCaptures.splice(thisCaptures.indexOf(id), 1);
                            altCaptures.push(id);
                            
                            // If the monster has never been captured before, add it to the "dex"
                			if(!altAllCaptures.includes(id)){
                			   	altAllCaptures.push(id);
                    			
                    			// Check for trophies
                    			var keys = id.split(",");
                    			var monsters = monster_groups[keys[0]].split(";\n");
                    			var monster_data = monsters[keys[1]].split("|");
                			    // Count the amount of unique monsters matching the type(s) of the one captured
                			    if(keys[2] != "1" && monster_data[3] !== "None"){
                			        if(monster_data[3].includes(",")){
                			            var checkTypes = monster_data[3].split(",");
                			        }else{
                			            var checkTypes = [monster_data[3]];
                			        }
                			        // For each type: Count all monsters that have the same type and count how many of them the user has captured before
                			        for(y = 0; y < checkTypes.length; y++){
                			            var type_count = 0;
                			            var has_count = 0;
                			            var id_list = [];
                    			        for(i = 0; i < monster_groups.length; i++){
                    			            var temp_monsters = monster_groups[i].split(";\n");
                    			            for(x = 0; x < temp_monsters.length - 1; x++){
                    			                var temp_m_data = temp_monsters[x].split("|");
                    			                if(temp_m_data[3].includes(checkTypes[y])){
                    			                    type_count++;
                    			                    var matchID = i + "," + x + ",0";
                    			                    if(altAllCaptures.includes(matchID)){has_count++;}
                    			                }
                    			            }
                    			        }
                    			        
                    			        // Add a trophy if a milestone has been reached
                    			        if(has_count == type_count){
                    			            // Full type completion
                    			            trophyMessages[o] += "\n" + trophyIcons[checkTypes[y]] + "\uD83D\uDFE1[" + checkTypes[y] + "] Master**!";
                    			            new_trophies.push("50" + "|" + checkTypes[y] + "|" + "S" + "|**[" + checkTypes[y] + "] Master** - Collected all " + checkTypes[y] + " monsters");
                    			        }else
                    			        if(has_count == Math.floor(type_count / 2)){
                    			            // 50% type completion
                    			            trophyMessages[o] += "\n" + trophyIcons[checkTypes[y]] + "\uD83D\uDD34[" + checkTypes[y] + "] Enthusiast**!";
                    			            new_trophies.push("51" + "|" + checkTypes[y] + "|" + "A" + "|**[" + checkTypes[y] + "] Enthusiast** - Collected 50% of " + checkTypes[y] + " monsters");
                    			        }
                			        }
                			    }
                			}
                        }
                        
                        // Save capture dex for the receiving user
                        lib.saveFile(tempDir + "/all_captures.txt", altAllCaptures.join(";"));
                        
                    }
                    else{
                        // The entry could not be found!
                        message.reply({ content: "\u274C Some of the trade offers could no longer be found in one of the users' possessions!", allowedMentions: { repliedUser: false }});
                        return;
                    }
                }
                
                // Give trophies to the receiving user if there were any
		        if(new_trophies.length >= 1){
		            var trophies = lib.readFile(tempDir + "/trophies.txt");
		            for(u = 0; u < new_trophies.length; u++){
                        if(trophies === "" || trophies === undefined){
        	                trophies = new_trophies[u];
        	            }else{
                            trophies += ";\n" + new_trophies[u];
        	            }
		            }
                    lib.saveFile(tempDir + "/trophies.txt", trophies);
                    if(o === 0){
                        trophyMessages[o] = "\n**" + otherUsername + " has received at least one trophy:**" + trophyMessages[o];
                    }else{
                        trophyMessages[o] = "\n**" + username + " has received at least one trophy:**" + trophyMessages[o];
                    }
		        }
            }
            
            // Save the updated arrays to the users' files
            lib.saveFile(dir + "/inventory.txt", inventory.join(","));
            lib.saveFile(otherDir + "/inventory.txt", otherInventory.join(","));
            lib.saveFile(dir + "/materials.txt", materials.join(","));
            lib.saveFile(otherDir + "/materials.txt", otherMaterials.join(","));
            lib.saveFile(dir + "/captures.txt", captures.join(";"));
            lib.saveFile(otherDir + "/captures.txt", otherCaptures.join(";"));
            lib.saveFile(dir + "/stats.txt", stats.join("|"));
            lib.saveFile(otherDir + "/stats.txt", otherStats.join("|"));
            lib.saveFile(dir + "/scrap.txt", scraps[2]);
            lib.saveFile(otherDir + "/scrap.txt", scraps[1]);
            lib.saveFile(dir + "/trade.txt", "");
            lib.saveFile(otherDir + "/trade.txt", "");
            
            // Inform both users about the success of the trade
            var userInServer = false;
            if(message.guild !== null){
                userInServer = message.client.guilds.cache.get(message.guildId).members.cache.has(trade[0]);
            }
            if(userInServer){
                // Send a message in the server for both users
                message.reply({ content: `<@${trade[0]}>\n**The trade has been completed successfully!**\nPlease make sure that everything has been received correctly` + trophyMessages[0] + trophyMessages[1] });
                return;
            }else{
                // The user is not in the same server, send a DM
                var otherUser = message.client.users.cache.get(trade[0]);
                otherUser.send({ content: "**The trade has been completed successfully!**\nPlease make sure that everything has been received correctly" + trophyMessages[0] });
            }
            
            message.reply({ content: "**The trade has been completed successfully!**\nPlease make sure that everything has been received correctly" + trophyMessages[1], allowedMentions: { repliedUser: false }});
            return;
            
        }else if(args[0] == "cancel"){
            // Check if there was an active trade
            var oldTrade = lib.readFile(dir + "/trade.txt");
            if(oldTrade !== null && oldTrade !== undefined && oldTrade !== ""){
                // Cancel current trade
                lib.saveFile(dir + "/trade.txt", "");
                // Inform the other user that the trade has been cancelled (if they were still trading with this user)
                var oldTradeData = oldTrade.split("|");
                var oldTradeOther = lib.readFile("userdata/" + oldTradeData[0] + "/trade.txt");
                if(oldTradeOther !== "" && oldTradeOther !== undefined && oldTradeOther !== null){
                    oldTradeOther = oldTradeOther.split("|");
                    if(oldTradeOther[0] == user.id){
                        lib.saveFile("userdata/" + oldTradeData[0] + "/trade.txt", "");
                        var userInServer = false;
                        if(message.guild !== null){
                            userInServer = message.client.guilds.cache.get(message.guildId).members.cache.has(oldTradeData[0]);
                        }
                        if(userInServer){
                            // Send a message in the same server
                            message.reply({ content: `<@${oldTradeData[0]}>\n__**` + username + "** has cancelled the trade!__" });
                            return;
                        }else{
                            // The user is not in the same server
                            var otherUser = message.client.users.cache.get(oldTradeData[0]);
                            otherUser.send({ content: "__**" + username + "** has cancelled the trade!__" });
                        }
                    }
                }
                
                message.reply({ content: "**You've cancelled your current trade!**", allowedMentions: { repliedUser: false }});
                return;
            }
            
            // There was no trade
            message.reply({ content: "\u274C You don't have an active trade!", allowedMentions: { repliedUser: false }});
            return;
            
        }else if(args[0] !== "" && args[0] !== undefined && args[0] !== null){
            // The user tried to make an offer or a counteroffer
            var saveOffer = "";
            
            // Try to match the first argument to a user
            // Get user ID list
            var otherId = user.id;
            var otherDir = dir;
            var otherUsername = user.username;
            var files = fs.readdirSync("userdata");
            files = files + "";
            files = files.split(",");
            if(parseInt(args[0]) > 1 && args[0].length > 12){
                // An ID was used. Check if it matches one of the users
                for(i = 0; i < files.length; i++){
                    if(files[i] == args[0]){
                        // Use the matched user's data instead of the command user
                        otherId = args[0];
                    }
                }
            }else{
                // The argument was not a number. Check if it can be matched to someone's username
                // Make a list of all usernames
                var nameList = "";
                for(x = 0; x < files.length; x++){
                    var tempName = lib.readFile("userdata/" + files[x] + "/username.txt");
                    nameList += "|" + tempName;
                }
                var nameListArray = nameList.split("|");
                nameList = nameList.toLowerCase() + "|";
                // If the argument was "random", get a random user
                args[0] = args[0].toLowerCase();
				if(args[0] == "random"){
					var key = lib.rand(0, nameListArray.length - 2);
					otherId = files[key];
				}else if(nameList.includes(args[0])){
					// First try searching for exact matches. If there is no match, search for any matches
					var key = 0;
					if(nameList.includes("|" + args[0] + "|")){
					    nameListArray = nameList.split("|");
						key = nameListArray.indexOf(args[0]);
					}else{
						var split = nameList.split(args[0]);
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
					otherId = files[key - 1];
				}
            }
            saveOffer = otherId + "|";
            otherDir = "userdata/" + otherId;
            otherUsername = lib.readFile(otherDir + "/username.txt");
            if(otherUsername == user.username){
                // Didn't find a user
                message.reply({ content: "\u274C A user matching your input could not be found or your own user was found!", allowedMentions: { repliedUser: false }});
                return;
            }
            args.splice(0, 1);
            allArgs = args.join(" ").toLowerCase();
            allArgs.replace(/ + /g, "+");
            
            // If the other user hasn't reached level 10 yet then stop
            var otherUserData = lib.readFile(otherDir + "/stats.txt").split("|");
            if(parseInt(otherUserData[10]) < 10){
                message.reply({ content: "\u274C You cannot trade with the user **" + otherUsername + "** because they are below level 10!", allowedMentions: { repliedUser: false }});
                return;
            }
            
            // Make a list of the user's items, mats and monsters
            var inventory = lib.readFile(dir + "/inventory.txt");
            var materials = lib.readFile(dir + "/materials.txt");
            var captures = lib.readFile(dir + "/captures.txt");
            var monsterGroups = lib.readFile("data/monsters/monsters.txt").split("#################################################################################\n");
            var items = lib.readFile("data/items.txt");
            var items_array = items.split(";\n");
            
            var allIds = "Gold;Scrap";
            if(inventory !== ""){
                allIds = allIds + ";" + inventory;
            }
            if(materials !== ""){
                if(allIds !== ""){allIds = allIds + "," + materials;}
                else{allIds = materials;}
            }
            allIds = allIds.replace(/,/g, ";");
            if(captures !== ""){
                if(allIds !== ""){allIds = allIds + ";" + captures;}
                else{allIds = captures;}
            }
            allIds = allIds.split(";");
            
            // Count duplicates and remove them from the main list
            var counts = new adc(allIds).count();
            allIds = allIds.filter(onlyUnique);
            
            // Go through the items and join them into a list
    		var names = "gold|scrap";
    		var key_count = allIds.length;
    		for(i = 2; i < key_count; i++){
    			var loop_key = allIds[i];
    			var listArray = items_array;
    			var isShiny = false;
    			if(loop_key.includes(",")){
    			    loop_key = loop_key.split(",");
    			    listArray = monsterGroups[loop_key[0]].split(";\n");
    			    if(loop_key[2] == "1"){isShiny = true;}
    			    loop_key = loop_key[1];
    			}
    			var selected = listArray[loop_key];
    			var values = selected.split("|");
    			var name = values[0];
    			if(isShiny){name = "Shiny " + name;}
    			
    			names = names + "|" + name;

    		}
    		
    		// Stop if there were too many offers
    		var offers = allArgs.split("+");
    		if(offers.length > 15){
    		    message.reply({ content: "\u274C You can only offer a maximum of 15 different things per trade!", allowedMentions: { repliedUser: false }});
    		    return;
    		}
    		
    		// Try to match every offer entry to something from the list or a currency
    		var names_lower = names.toLowerCase();
			names_lower = "|" + names_lower + "|";
			var offerList = "";
    		for(y = 0; y < offers.length; y++){
    		    if(y > 0){saveOffer += "#";}
    		    
    		    // Get amount and name of the offer entry
    		    offers[y] = offers[y].trim().split(" ");
    		    var amount = 1;
                if(!isNaN(offers[y][0])){
                    amount = parseInt(offers[y][0]);
                    offers[y].splice(0, 1);
                }
                var offerName = offers[y].join(" ").trim();
    		    
    		    // Check if it exists in the list
    		    if(names_lower.includes(offerName)){
    			    var key = 0;
    				// First try searching for exact matches. If there is no match, search for any matches
    				// Matched entries are removed from the lists to prevent accidentally matching them again
    				if(names_lower.includes("|" + offerName + "|")){
    				    var names_array = names_lower.split("|");
    					key = names_array.indexOf(offerName);
    				}else{
    					var split = names_lower.split(offerName);
    					var left_side = split[0].replace(/[^|]/g, "");
    					key = left_side.length;
    					var names_array = names_lower.split("|");
    				}
				    
    				var result_key = allIds[key - 1];
    				allIds.splice(key - 1, 1);
    				names_array.splice(key, 1);
    				names_lower = names_array.join("|");
    				
    				// The item's data has been retrieved! Update the necessary variables
    				if(result_key == "Gold" || result_key == "Scrap"){
    				    saveOffer += amount + ";" + result_key;
    				    offerList += "\n**[" + result_key + "]** x " + amount;
    				    
    				    // Check if the user has enough of the selected currency
    				    var currencyCount = 0;
    				    if(result_key == "Gold"){
    				        currencyCount = parseInt(lib.readFile(dir + "/stats.txt").split("|")[12]);
    				    }else{
    				        currencyCount = parseInt(lib.readFile(dir + "/scrap.txt"));
    				    }
    				    if(currencyCount < amount){
    				        message.reply({ content: "\u274C You do not have enough of the offer entry **[" + result_key + "]**!", allowedMentions: { repliedUser: false }});
        				    return;
    				    }
    				    
    				}else{
    				    var listArray = items_array;
        				saveOffer += amount + ";" + result_key;
        				var isShiny = false;
        				if(result_key.includes(",")){
            			    result_key = result_key.split(",");
            			    listArray = monsterGroups[result_key[0]].split(";\n");
            			    if(result_key[2] == "1"){isShiny = true;}
            			    result_key = result_key[1];
            			}
        				var data = listArray[result_key].split("|");
        				if(isShiny){data[0] = "Shiny " + data[0];}
        				offerList += "\n**[" + data[0] + "]** x " + amount;
        				
        				// Make sure the other person has a high enough rank for receiving the offer if the selected item is a material
        				if(data[10] == "Material"){
        				    var rankList = ["D", "C", "B", "A", "S", "SS"];
        				    var itemRank = rankList.indexOf(data[12]);
        				    var otherUserData = lib.readFile(otherDir + "/stats.txt").split("|");
        				    if(rankList.indexOf(otherUserData[9]) < itemRank){
        				        message.reply({ content: "\u274C The material **[" + data[0] + "]** cannot be traded to **" + otherUsername + "** because their rank is too low!", allowedMentions: { repliedUser: false }});
        				        return;
        				    }
        				}
        				
        				// Check if the user has enough of the selected thing
        				if(amount > counts[result_key]){
        				    message.reply({ content: "\u274C You do not have enough of the offer entry **[" + data[0] + "]**!", allowedMentions: { repliedUser: false }});
        				    return;
        				}
    				}
    				
    		    }else{
    		        // Item could not be found
    		        message.reply({ content: "\u274C The offer entry **[" + offerName + "]** could not be found in your possessions!", allowedMentions: { repliedUser: false }});
    		        return;
    		    }
    		}
            
            // If this user had another active trade with a different user before, inform the other person that it has been cancelled now
            var oldTrade = lib.readFile(dir + "/trade.txt");
            if(oldTrade !== null && oldTrade !== undefined && oldTrade !== ""){
                // Check if the new trade partner is someone else
                var oldTradeData = oldTrade.split("|");
                if(oldTradeData[0] != otherId){
                    // Inform the other user that the trade has been cancelled (if they were still trading with this user)
                    var oldTradeOther = lib.readFile("userdata/" + oldTradeData[0] + "/trade.txt");
                    if(oldTradeOther !== "" && oldTradeOther !== undefined && oldTradeOther !== null){
                        oldTradeOther = oldTradeOther.split("|");
                        if(oldTradeOther[0] == user.id){
                            lib.saveFile("userdata/" + oldTradeData[0] + "/trade.txt", "");
                            var userInServer = false;
                            if(message.guild !== null){
                                userInServer = message.client.guilds.cache.get(message.guildId).members.cache.has(oldTradeData[0]);
                            }
                            if(userInServer){
                                // Send a message in the same server
                                message.reply({ content: `<${oldTradeData[0]}>\n__**` + username + "** has cancelled their trade with you!__", allowedMentions: { repliedUser: false } });
                            }else{
                                // The user is not in the same server
                                var otherUser = message.client.users.cache.get(oldTradeData[0]);
                                otherUser.send({ content: "__**" + username + "** has cancelled their trade with you!__" });
                            }
                        }
                    }
                }
            }
            
            // Determine the status of this offer and save it
            saveOffer += "|";
            var otherTrade = lib.readFile(otherDir + "/trade.txt");
            // Default: Initiating offer (called finisher because this user will have to confirm the trade after the counteroffer has been made)
            var status = "finisher";
            if(otherTrade !== "" && otherTrade !== null && otherTrade !== undefined){
                var otherTradeData = otherTrade.split("|");
                if(otherTradeData[0] == user.id){
                    // This is a new counteroffer
                    if(otherTradeData[2] == "finisher"){
                        status = "latest";
                    }else{
                        // If the other user did not initiate the trade then this must be an updated offer. The other person now becomes the finisher
                        otherTradeData[2] = "finisher";
                        status = "latest";
                        lib.saveFile(otherDir + "/trade.txt", otherTradeData.join("|"));
                    }
                }
            }
            saveOffer += status;
            lib.saveFile(dir + "/trade.txt", saveOffer);
            
            // Inform the other person
            var userInServer = false;
            if(message.guild !== null){
                userInServer = message.client.guilds.cache.get(message.guildId).members.cache.has(otherId);
            }
            
            if(status == "finisher"){
                // Send a message initiating the trade and asking for a counteroffer
                if(userInServer){
                    // The user is in the same server
                    message.reply({ content: `<@${otherId}>\n__**` + username + "** has sent you a trade offer:__" + offerList + "\nUse the command `" + prefix + "trade " + username + " [offer]` to reply to their offer!" });
                    return;
                }else{
                    // The user is not in the same server
                    var otherUser = message.client.users.cache.get(otherId);
                    otherUser.send({ content: "__**" + username + "** has sent you a trade offer:__" + offerList + "\nUse the command `" + prefix + "trade " + username + " [offer]` to reply to their offer!" });
                }
            }else{
                // Create buttons
                var button1 = new MessageButton()
            			.setCustomId(otherId + "|trade confirm")
            			.setLabel('Confirm')
            			.setStyle('SUCCESS')
            	var button2 = new MessageButton()
            			.setCustomId(otherId + "|trade cancel")
            			.setLabel('Cancel')
            			.setStyle('DANGER')
                var row = new MessageActionRow().addComponents([button1, button2]);
                
                if(userInServer){
                    // Send a message with a confirmation button because the other person must be the finisher
                    message.reply({ content: `<@${otherId}>\n__**` + username + "** has sent you a counteroffer:__" + offerList, components: [row] });
                    return;
                }else{
                    // The user is not in the same server
                    var otherUser = message.client.users.cache.get(otherId);
                    otherUser.send({ content: "__**" + username + "** has sent you a counteroffer:__" + offerList, components: [row] });
                }
            }
            
            // Inform the user about what their offer actually is (only if they are not in the same server as the target user)
            message.reply({ content: "You've sent a trade offer to the user **" + otherUsername + "**!\nYour offers are:" + offerList, allowedMentions: { repliedUser: false }});
            return;
        }
        
        message.reply({ content: "\u274C Arguments are required for this command! Please check `" + prefix + "help trade` for info on how to use it", allowedMentions: { repliedUser: false }});
        
	},
};