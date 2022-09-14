var { prefix } = require('../config.json');
nick = require('./nickname.js');

module.exports = {
	name: 'worldboss',
	usages: [''],
	descriptions: ['Deals damage to the world boss, marking you as a participant and granting you 20 Gold'],
    shortDescription: 'Fight the current boss',
    weight: 30,
	addendum: 'Can only be used once an hour and only if there is an active boss',
	aliases: ['wb','boss'],
	category: 'tasks',
	
	execute(message, user, args) {
        
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
            message.reply({ content: "\u274C @ __**" + username + "**__, use `" + prefix + "encounter` first to create an account!", allowedMentions: { repliedUser: false }});
            return;
        }
	    
	    // Read world boss file. If the file only contains a rank (recently generated) then generate a random boss based on that rank and save it
	    var boss = lib.readFile("data/worldboss.txt");
	    if(boss === "" || boss === undefined){
	        // There is no boss
	        message.reply({ content: "\u274C @ __**" + username + "**__, there is no active world boss to fight!", allowedMentions: { repliedUser: false }});
	        return;
	    }
	    if(boss == "D" || boss == "C" || boss == "B" || boss == "A" || boss == "S" || boss == "SS"){
	        // The boss has not been generated yet. Do so
	        var rank = boss;
	        var rank_array = {"D": 0, "C": 1, "B": 2, "A": 3, "S": 4, "SS": 5};
	        // Get a random monster of the correct rank
	        var monsters_raw = lib.readFile("data/monsters/monsters_0.txt");
            var monster_groups = monsters_raw.split("#################################################################################\n");
            var monsters = monster_groups[rank_array[boss]].split(";\n");
            var monster = monsters[lib.rand(0, monsters.length - 2)];
            var monster_data = monster.split("|");
	        
	        // Make a random boss name (modifier and nick truename)
            var name = monster_data[0];
            var boss_mods = lib.readFile("data/boss_mods.txt").split(";\n");
            name = generateTrueName() + ", the " + boss_mods[lib.rand(0, boss_mods.length - 1)] + " " + name;
            function generateTrueName(){
				var result = "";
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
						result += newChar;
						previousChar = newChar;
						consonantStart = true;

						if(!odd){
							newChar = getNextChar(vowels, previousChar);
							result += newChar;
							previousChar = newChar;
							consonantStart = false;
						}
					}
					else{
						var newChar = getNextChar(vowels, previousChar);
						result += newChar;
						previousChar = newChar;

						if(!odd){
							newChar = getNextChar(consonants, previousChar);
							result += newChar;
							previousChar = newChar;
						}
					}
				}
				// Function for rerolling characters if they are not allowed to come after the previous character
				function getNextChar(array, prevChar) {
					// ? is a placeholder that means that all chars are allowed
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

				result = result.charAt(0).toUpperCase() + result.slice(1);
				return result;
			}

            // Calculate starting HP based on its stats
            var hp_mod = {"D": 40, "C": 28, "B": 22, "A": 21, "S": 20, "SS": 21};
            var hp = (parseInt(monster_data[1]) + parseInt(monster_data[2])) * hp_mod[rank];

	    }else{
	        // The boss has already been generated. Split its data apart
	        var boss_data = boss.split("|");
	        var name = boss_data[0];
	        var hp = parseInt(boss_data[1]);
	        var rank = boss_data[2];
	    }
	    
	    // Check if the user is still on cooldown for this boss and end the command if necessary
	    var d = new Date();
        var current_sec = Math.floor(d.getTime() / 1000);
	    var last_sec = parseInt(lib.readFile(dir + "/boss_cd.txt"));
	    if(current_sec < last_sec + 3600){
	        var cooldown = lib.secondsToTime(3600 - current_sec + last_sec);
	        message.reply({ content: "\u274C You need to wait **" + cooldown + "** before you can fight a boss again!", allowedMentions: { repliedUser: false }});
	        return;
	    }
	    lib.saveFile(dir + "/boss_cd.txt", current_sec);
	    
	    // Lower the HP of the boss
	    var user_data = lib.readFile(dir + "/stats.txt").split("|");
	    var damage = parseInt(user_data[1]) + parseInt(user_data[2]);
	    if(damage < 0){damage = 0;}
	    hp = hp - damage;
	    
	    // Update user stats and empty the current buff file if the buff timer has reached 0
        var current_buff = lib.readFile(dir + "/current_buff.txt");
        var buff_extra = "";
        if(current_buff !== "" && current_buff !== undefined){
            var buff_stats = current_buff.split("|");
            var buff_stat_subdiv = buff_stats[10].split(",");
            var buff_timer = parseInt(buff_stat_subdiv[1]);
            var item_name = buff_stats[0];
            if(buff_timer === 0){
                // Remove old item's values from the user's stats
                for(y = 1; y < 7; y++){
                    var base = parseInt(user_data[y]);
                    var minus = parseInt(buff_stats[y]);
                    user_data[y] = base - minus;
                }
                
                buff_extra = "*Your **" + item_name + "**'s effect ran out!*";
                current_buff = "";
                lib.saveFile(dir + "/current_buff.txt", "");
            }
        }
        
        // Update buff timer
        if(current_buff !== "" && current_buff !== undefined){
            // Modify and repack the timer
            buff_timer--;
            buff_stat_subdiv[1] = buff_timer;
            buff_stats[10] = buff_stat_subdiv.join(",");
            
            lib.saveFile(dir + "/current_buff.txt", buff_stats.join("|"));
            if(buff_timer === 0){
                buff_extra = "*Your **" + item_name + "**'s buff will run out after this fight!*";
            }else{
                var ex_s = "s";
                if(buff_timer == 1){
                    ex_s = "";
                }
                buff_extra = "*Your **" + item_name + "**'s buff will last for **" + buff_timer + "** more encounter" + ex_s + " / boss fight" + ex_s + "*";
            }
            
            // Update charge count if the buff is the radar
            if(buff_stats[9] == "Special"){
                lib.saveFile(dir + "/charges.txt", buff_timer)
            }
        }
	    
	    // Get participation list
	    var players = lib.readFile("data/boss_participants.txt");
	    if(players === undefined || players === ""){
	        player_list = ["None"];
	    }else if(players.includes(";")){
	        player_list = players.split(";");
	    }else{
	        player_list = [players];
	    }
	    // Check if the player is already on the list
	    var found = false;
	    var key = "";
	    for(i = 0; i < player_list.length && !found; i++){
	        var player_data = player_list[i].split("|");
	        if(player_data[1] == user.id){
	            // Player has been found!
	            key = i;
	            found = true;
	        }
	    }
	    
	    // Add the player to the list or update their score
	    if(found){
	        // Update
	        var player_data = player_list[key].split("|");
	        player_data[2] = parseInt(player_data[2]) + damage;
	        player_list[key] = player_data.join("|");
	        players = player_list.join(";");
	    }else{
	        // New addition
	        if(player_list[0] == "None"){
	            // First player for this boss
	            players = username + "|" + user.id + "|" + damage;
	            player_list = [players];
	        }else{
	            players = players + ";" + username + "|" + user.id + "|" + damage;
	            player_list = players.split(";");
	        }
	    }
        
	    // Update boss file and send output
	    // If the boss died then send a world notification and reward all the participants
	    if(hp <= 0){
	        lib.saveFile("data/worldboss.txt", "");
	        lib.saveFile("data/boss_participants.txt", "");
	        
	        // Prepare tangible reward
	        var boss_rewards = {"D": 231, "C": 231, "B": 232, "A": 232, "S": 233, "SS": 233};
	        var boss_reward_item = boss_rewards[rank];
	        
	        // Give the reward item to all users and save the scores in a separate array
	        var scores = [];
	        var scores2 = [];
	        for(x = 0; x < player_list.length; x++){
	            var data = player_list[x].split("|");
	            var u_data = lib.readFile("userdata/" + data[1] + "/stats.txt").split("|");
	            var user_reward_item = boss_rewards[u_data[9]];
	            if(user_reward_item < boss_reward_item){
	                var reward_item = user_reward_item;
	            }else{
	                var reward_item = boss_reward_item;
	            }
	            
	            scores[x] = data[2];
	            scores2[x] = data[2];
	            var inv = lib.readFile("userdata/" + data[1] + "/inventory.txt");
	            
	            if(inv === undefined || inv === ""){
	                inv = reward_item;
	            }else{
	                inv = inv + "," + reward_item;
	            }
	            lib.saveFile("userdata/" + data[1] + "/inventory.txt", inv);
	        }
	        
	        // Determine top 3 contributors and give them their trophies
	        function giveTrophy(weight, rank, trophyRank, userid, name, damage){
	            var path = "userdata/" + userid + "/trophies.txt";
	            var trophies = lib.readFile(path);
	            var new_trophy = weight + "|" + rank + "|" + trophyRank + "|" + "**Boss slayer** - Dealt " + damage + " damage to [" + name + "]";
	            if(trophies === "" || trophies === undefined){
	                trophies = new_trophy;
	            }else{
	                trophies = trophies + ";\n" + new_trophy;
	            }
	            lib.saveFile(path, trophies);
	        }
	        scores.sort(function(a, b){return b - a});
	        var first = scores2.indexOf(scores[0]);
	        var first_data = player_list[first].split("|");
	        var player_one = first_data[0];
	        var top_players = "\uD83E\uDD47 1. " + player_one + " (" + scores[0] + " total damage dealt)";
	        giveTrophy("90", "Slayer1", rank, first_data[1], name, scores[0]);
	        scores2[scores2.indexOf(scores[0])] = -1;
	        if(scores.length > 1){
	            var second = scores2.indexOf(scores[1]);
	            var second_data = player_list[second].split("|");
	            var player_two = second_data[0];
	            top_players = top_players + "\n\uD83E\uDD48 2. " + player_two + " (" + scores[1] + " total damage dealt)";
	            giveTrophy("91", "Slayer2", rank, second_data[1], name, scores[1]);
	            scores2[scores2.indexOf(scores[1])] = -2;
	            if(scores.length > 2){
	                var third = scores2.indexOf(scores[2]);
	                var third_data = player_list[third].split("|");
	                var player_three = third_data[0];
	                top_players = top_players + "\n\uD83E\uDD49 3. " + player_three + " (" + scores[2] + " total damage dealt)";
	                giveTrophy("92", "Slayer3", rank, third_data[1], name, scores[2]);
	            }
	        }

			// Give 20 Gold to the user
			user_data[12] = parseInt(user_data[12]) + 20;
			lib.saveFile(dir + "/stats.txt", user_data.join("|"));

	        // Global output
	        if(buff_extra !== ""){buff_extra = "\n" + buff_extra;}
	        message.reply({ content: "You dealt **" + damage + "** damage to the boss, successfully defeating it! You've received **20 Gold**!" + buff_extra, allowedMentions: { repliedUser: false }});
	        var global_message = "**The world boss [" + name + "] has been defeated!**\nAll participants have received one **[Unstable Vortex]**!\nThe following players have received trophies for being the top contributors:```\n" + top_players + "```";
	        // Alert users in all configured channels
            fs.readdir("data/configs", (err, files) => {
                for(i = 0; i < files.length; i++){
                    var channelID = lib.readFile("data/configs/" + files[i] + "/channel.txt");
                    if(channelID !== "Undefined"){
                        message.client.channels.cache.get(channelID).send(global_message);
                    }
                }
            });

	    }else{
			// Define standard output
			var output = "You dealt **" + damage + " damage** to the boss and received **20 Gold**! Here is the monster's current status:```\n[" + name + "] (Rank " + rank + "X)\n" + hp + " HP remaining```" + buff_extra;

			// Determine if Gold should be taken away or given
			if(lib.rand(1, 8) == 1){
				// Unlucky!
				user_data[12] = parseInt(user_data[12]);
				var loss = 50;
				if(user_data[12] < loss){loss = loss - (loss - user_data[12]);}
				user_data[12] = user_data[12] - loss;
				output = "You dealt **" + damage + " damage** to the boss!\n__Oh no! The boss sneezed on you, making you lose **" + loss + " Gold**!__ Here is the monster's current status:```\n[" + name + "] (Rank " + rank + "X)\n" + hp + " HP remaining```" + buff_extra;
			}else{
				// Normal outcome
				user_data[12] = parseInt(user_data[12]) + 20;
			};
			
			// Update user stats with Gold change
			lib.saveFile(dir + "/stats.txt", user_data.join("|"));

	        // Regular output
	        message.reply({ content: output, allowedMentions: { repliedUser: false }});
	        lib.saveFile("data/worldboss.txt", name + "|" + hp + "|" + rank);
	        lib.saveFile("data/boss_participants.txt", players);
	    }
	    
	    
	    
	},
};