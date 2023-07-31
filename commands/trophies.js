// Alpha Tester trophy string:
// 10|Tester|Special|**Alpha Tester** - One of the special people!;

var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'trophies',
	usages: ['', 'top', 'user [ID or username]', 'user random'],
	descriptions: ['Displays a list of your trophies', 'Displays a list of all users ranked by their cumulative trophy scores', 'Displays the trophies of a different user', 'Displays the trophies of a random user'],
    shortDescription: 'Check a user\'s trophies or the rankings',
    weight: 25,
	aliases: ['tro'],
    addendum: [
        '- Trophies do not serve a concrete purpose for now besides providing an arbitrary score / ranking system',
        '- Rarer trophies are usually displayed closer to the top of the list',
        '- Boss trophies are usually placed at the bottom of the list as they are randomly generated to some extent'
    ],
    category: 'userinfo',
	
	execute(message, user, args, prefix) {
        
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
        
        // If the argument was "top", go through all users and sort them by their cumulative trophy scores
        if(args[0] == "top"){
            // Define static trophy score values
            var trophyValues = {
                "Tester": {"Special": 200},
                "Level": {"D": 100, "C": 150, "B": 200, "A": 250, "S": 300, "SS": 400},
                "Quest": {"C": 100, "B": 150, "A": 200, "S": 250},
                "Slayer1": {"D": 15, "C": 20, "B": 25, "A": 30, "S": 35, "SS": 40},
                "Slayer2": {"D": 10, "C": 15, "B": 20, "A": 25, "S": 30, "SS": 35},
                "Slayer3": {"D": 5, "C": 10, "B": 15, "A": 20, "S": 25, "SS": 30},
                "Slime": {"A": 100, "S": 300},
                "Beast": {"A": 100, "S": 300},
                "Demon": {"A": 100, "S": 300},
                "Undead": {"A": 100, "S": 300},
                "Arthropod": {"A": 100, "S": 300},
                "Dark": {"A": 100, "S": 300},
                "Water": {"A": 100, "S": 300},
                "Plant": {"A": 100, "S": 300},
                "Reptile": {"A": 100, "S": 300},
                "Armored": {"A": 100, "S": 300},
                "Flying": {"A": 100, "S": 300},
                "Fire": {"A": 100, "S": 300},
                "Holy": {"A": 100, "S": 300},
                "Intangible": {"A": 100, "S": 300},
                "Frost": {"A": 100, "S": 300},
                "Lightning": {"A": 100, "S": 300},
                "Legendary": {"A": 150, "S": 350},
                "Dragon": {"A": 150, "S": 350}
            };
            
            // Loop through all users and calculate their trophy scores
            var files = fs.readdirSync("userdata");
            files = files + "";
            files = files.split(",");
            var scoreboard = [];
            for(i = 0; i < files.length; i++){
                // Get the user's name
                var scoreDir = "userdata/" + files[i];
                var scoreName = lib.readFile(scoreDir + "/username.txt");
                // Get the user's trophies
                var trophies = lib.readFile(scoreDir + "/trophies.txt");
                if(trophies === "" || trophies === undefined){
                    var trophy_list = [];
                }else if(trophies.includes(";")){
                    var trophy_list = trophies.split(";\n");
                }else{
                    var trophy_list = [trophies];
                }
                // Calculate the combined trophy score
                var score = 0;
                for(x = 0; x < trophy_list.length; x++){
                    var trophy_data = trophy_list[x].split("|");
                    score += trophyValues[trophy_data[1]][trophy_data[2]];
                }
                scoreboard.push(score + "|" + scoreName);
            }
            
            // Sort the list by score
            scoreboard.sort(function(a, b) {
                aNum = parseInt(a.split("|")[0]);
                bNum = parseInt(b.split("|")[0]);
                return aNum - bNum;
            });
            scoreboard.reverse();
            
            // Modify the list for the output
            for(u = 0; u < scoreboard.length; u++){
                scoreData = scoreboard[u].split("|");
                var scoreRank = "**" + (u + 1) + ". ";
                if(scoreRank == "**1. "){scoreRank = "\uD83E\uDD47**";}else
                if(scoreRank == "**2. "){scoreRank = "\uD83E\uDD48**";}else
                if(scoreRank == "**3. "){scoreRank = "\uD83E\uDD49**";}
                scoreboard[u] = scoreRank + scoreData[1] + ":** __" + scoreData[0] + "__ points";
            }
            
			// Create paged embed and send it
			var paginationArray = scoreboard;
			var elementsPerPage = 10;
			var fieldTitle = "Out of " + scoreboard.length + " users";
			var embedTemplate = new Discord.EmbedBuilder()
				.setColor('#0099ff')
            	.setTitle("Global Trophy Scoreboard");
			lib.createPagedEmbed(paginationArray, elementsPerPage, embedTemplate, fieldTitle, message);
            return;
        }
        
        // Get trophy list or cancel if there are none
        var trophies = lib.readFile(dir + "/trophies.txt");
        if(trophies === "" || trophies === undefined){
            message.reply({ content: "You don't have any trophies yet!", allowedMentions: { repliedUser: false }});
            return;
        }else if(trophies.includes(";")){
            var trophy_list = trophies.split(";\n");
        }else{
            var trophy_list = [trophies];
        }
        
        // Sort the trophies by weight and then remove the weight from the output. Also turn each trophy into a readable format
        trophy_list.sort();
        for(i = 0; i < trophy_list.length; i++){
            var trophy_data = trophy_list[i].split("|");
            var icon_list = {D: "<:real_black_circle:856189638153338900>", C: "\uD83D\uDD35", B: "\uD83D\uDFE2", A: "\uD83D\uDD34", S: "\uD83D\uDFE1", SS: "\uD83D\uDFE0", Slayer1: "\uD83E\uDD47", Slayer2: "\uD83E\uDD48", Slayer3: "\uD83E\uDD49", Tester: "\uD83D\uDD2C", Special: "\u2728", Level: "\u2747", Quest: "\uD83D\uDCAC", "(Special)": "\uD83D\uDFE3", Vortex: "\uD83C\uDF00", Slime: "<:slime:860529740057935872>", Beast: "\uD83D\uDC3B", Demon: "\uD83D\uDC79", Undead: "\uD83D\uDC80", Arthropod: "\uD83E\uDD97", Dark: "<:darkness:860530638821261322>", Water: "\uD83D\uDCA7", Plant: "\uD83C\uDF3F", Reptile: "\uD83E\uDD8E", Armored: "\uD83D\uDEE1", Flying: "<:wing:860530400539836456>", Fire: "\uD83D\uDD25", Holy: "\uD83D\uDD31", Intangible: "\uD83D\uDC7B", Frost: "\uD83E\uDDCA", Lightning: "\uD83C\uDF29", Legendary: "\u269C", Dragon: "\uD83D\uDC32"};
            trophy_data[0] = "";
            trophy_data[1] = icon_list[trophy_data[1]];
            trophy_data[2] = icon_list[trophy_data[2]];
            
            trophy_list[i] = trophy_data.join("");
        }
		
		// Create paged embed and send it
		var paginationArray = trophy_list;
		var elementsPerPage = 10;
		var fieldTitle = trophy_list.length + " total";
		var embedTemplate = new Discord.EmbedBuilder()
			.setColor('#0099ff')
        	.setTitle(username + "'s Trophies")
        	.setThumbnail(lib.readFile(dir + "/main_monster.txt"))
		lib.createPagedEmbed(paginationArray, elementsPerPage, embedTemplate, fieldTitle, message);
        
	},
};