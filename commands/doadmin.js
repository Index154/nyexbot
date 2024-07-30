var { prefix } = require('../config.json');

module.exports = {
	name: 'doadmin',
	usages: ['restart', 'pull/push', 'update', 'pop', 'query', 'sendme', 'lc [JSON]'],
	descriptions: ["Restarts the whole bot (for applying changes made to the main functions)", "Fetches the contents of the messages in the nyex-plans channel on the main server and saves them", "Posts update text to my channel and moves it to the history file", "Populates a new database table using manually defined logic. Edit this command first!", "Performs a custom SQL query for debugging purposes", "Sends the bot owner a pre-defined DM"],
    shortDescription: 'Many functions',
    weight: 5,
	aliases: ['da', 'do'],
    addendum: [
        '- Can only be used by Index154'
    ],
    category: 'admin',
	
	execute(message, user, args, prefix) {
	    
        // Set important variables
        var id = user.id;
        
        // If the user isn't me, end the command
        if(id != "214754022832209921"){
            message.reply({ content: "\u274C This command is only useable by Index154", allowedMentions: { repliedUser: false }});
            return;
        }

        // Test
        if(lib.exists(args[0]) && (args[0].toLowerCase() == "test" )){
            message.reply({ content: "Testing!", allowedMentions: { repliedUser: false }});
            return;
        }

        // Lethal Company spawning simulation
        if(lib.exists(args[0]) && (args[0].toLowerCase() == "lc" )){
            // Define enemy stats
            let enemyStats = {
                "flowerman": {"power": 3, "maxCount": 1},
                "spider": {"power": 2, "maxCount": 1},
                "butler": {"power": 2, "maxCount": 7},
                "coilhead": {"power": 1, "maxCount": 5},
                "girl": {"power": 2, "maxCount": 1},
                "barber": {"power": 1, "maxCount": 8},
                "lootbug": {"power": 1, "maxCount": 8},
                "blob": {"power": 1, "maxCount": 2},
                "jester": {"power": 3, "maxCount": 1},
                "masked": {"power": 1, "maxCount": 10},
                "nutcracker": {"power": 1, "maxCount": 10},
                "centipede": {"power": 1, "maxCount": 4},
                "puffer": {"power": 1, "maxCount": 2},
                "thumper": {"power": 3, "maxCount": 4},
                "baboon": {"power": 0.5, "maxCount": 15}, // They always spawn in twos
                "worm": {"power": 2, "maxCount": 3},
                "mouthdog": {"power": 2, "maxCount": 8},
                "giant": {"power": 3, "maxCount": 3},
                "oldbird": {"power": 3, "maxCount": 20}
            }
            
            // Define test data
            if(args.length < 2){
                message.reply({ content: "\u274C Missing argument", allowedMentions: { repliedUser: false }});
                return;
            }
            args.splice(0, 1);
            let jsonArgs = args.join(" ");
            let testValues = JSON.parse(jsonArgs);

            // Add extra values to the list
            totalWeight = 0;
            testValues.days = 0;
            testValues.totalspawns = 0;
            Object.keys(testValues.enemies).forEach(function(key){
                testValues.enemies[key].total = 0;
                testValues.enemies[key].dayswith = 0;
                totalWeight += testValues.enemies[key].weight;
            });

            // Loop simulating enemy spawning day by day
            let days = 100000;
            for(x = 0; x < days; x++){
                // Create temp list copy
                let tempList = {"totalpower": 0, "enemies": {}}
                for(let key in testValues.enemies){
                    if(testValues.enemies[key].weight < 1){
                        delete testValues.enemies[key];
                    }else{
                        tempList.enemies[key] = structuredClone(testValues.enemies[key]);
                        tempList.enemies[key].spawned = 0;
                        tempList.enemies[key].canspawn = true;
                    }
                }

                // Loop for one spawning event
                let canSpawn = true;
                let tryBaboonPair = false;
                while(canSpawn){
                    // Remove unspawnable enemies from list and sum up the weights
                    let weightSum = 0;
                    for(let key in tempList.enemies){
                        if(tempList.enemies[key].spawned >= enemyStats[key].maxCount){
                            tempList.enemies[key].canspawn = false;
                        }
                        if((tempList.totalpower + enemyStats[key].power) > testValues.maxpower){
                            tempList.enemies[key].canspawn = false;
                        }
                        if(tempList.enemies[key].canspawn){
                            weightSum += parseInt(tempList.enemies[key].weight);
                        }
                    }

                    // Roll random number
                    if(weightSum <= 0){break;}
                    let roll = lib.rand(1, weightSum);
                    let tallyWeight = 0;
                    if(tryBaboonPair && tempList.enemies["baboon"].canSpawn){
                        roll = 1;   // This works because baboon is always first in slot!
                    }
                    for(let key in tempList.enemies){
                        tallyWeight += tempList.enemies[key].weight;
                        if(roll <= tallyWeight){
                            testValues.enemies[key].total++;
                            testValues.totalspawns++;
                            if(tempList.enemies[key].spawned == 0){testValues.enemies[key].dayswith++;}
                            tempList.enemies[key].spawned++;
                            tempList.totalpower += enemyStats[key].power;
                            if(key == "baboon" && !tryBaboonPair) {tryBaboonPair = true;}
                            break;
                        }
                    }
                }

                testValues.days++;
            }

            // Calculate the simulated appearance rates
            paddings = ["        ", "   ", "   "];
            headers = ["Name", "Weight", "Of total"];
            outputString = "## " + testValues.moon + " enemy spawns\n`Number of simulated days: " + testValues.days + "`\n```Name" + paddings[0] + "Weight" + paddings[1] + "Of total" + paddings[2] + "Days with at least 1";
            for(let key in testValues.enemies){
                testValues.enemies[key].totalSpawnPercentage = (Math.round(((testValues.enemies[key].total / testValues.totalspawns) * 100) * 10) / 10) + "%";
                testValues.enemies[key].daysWithPercentage = (Math.round(((testValues.enemies[key].dayswith / testValues.days) * 100) * 10) / 10) + "%";
                testValues.enemies[key].weightPercentage = (Math.round(((testValues.enemies[key].weight / totalWeight) * 100) * 10) / 10) + "%";

                outputString += "\n";

                // Create padding strings
                padStrings = [key.charAt(0).toUpperCase() + key.slice(1), testValues.enemies[key].weightPercentage, testValues.enemies[key].totalSpawnPercentage]
                for(i = 0; i < padStrings.length; i++){
                    newPadding = "";
                    padCount = (headers[i].length + paddings[i].length) - padStrings[i].length;
                    for(y = 0; y < padCount; y++){
                        newPadding += " ";
                    }
                    outputString += padStrings[i] + newPadding;
                }
                outputString += testValues.enemies[key].daysWithPercentage;
            }
            outputString += "\n```";

            // Output
            message.reply({ content: outputString, allowedMentions: { repliedUser: false }});
            return;
        }

        // Send text to me if I want to
        if(lib.exists(args[0]) && (args[0].toLowerCase() == "sendme" || args[0].toLowerCase() == "send")){
            message.client.users.fetch(id, false).then((tempUser) => {
                var sendContent = "```\n";
                sendContent += "STUFF";
                sendContent += "```"

                tempUser.send(sendContent);
            });
            message.reply({ content: "DM sent!", allowedMentions: { repliedUser: false }});
            return;
        }

        // Prepare update message and save it to history if I want to
        if(lib.exists(args[0]) && args[0].toLowerCase() == "update"){            
            var currentPatch = lib.readFile("../nyextest/info/nyex-plans/zz-current_patch.txt");
            var history = lib.readFile("../nyextest/info/nyex-plans/zzz-patch_history.txt");
            
            message.client.channels.cache.get("516288921127092234").send("```\n" + currentPatch + "```");
            lib.saveFile("../nyextest/info/nyex-plans/zzz-patch_history.txt", currentPatch + "\n\n" + history);
            lib.saveFile("../nyextest/info/nyex-plans/zz-current_patch.txt", "");

            message.reply({ content: "Update text successfully pushed to your channel and saved to history!", allowedMentions: { repliedUser: false }});
            return;
        }

        // Pull nyex-plans content from Discord if I want to
        if(lib.exists(args[0]) && (args[0].toLowerCase() == "pull" || args[0].toLowerCase() == "push")){
            try {
                message.client.channels.cache.get('846802831322775562').messages.fetch('846804108936871997')
                    .then(message => lib.saveFile("../nyextest/info/nyex-plans/1_main_goals.txt", message.content));

                message.client.channels.cache.get('846802831322775562').messages.fetch('983429707360006144')
                    .then(message => lib.saveFile("../nyextest/info/nyex-plans/additional_goals.txt", message.content));
                
                message.client.channels.cache.get('846802831322775562').messages.fetch('983429732727156817')
                    .then(message => lib.saveFile("../nyextest/info/nyex-plans/lower_priority.txt", message.content));
                
                message.client.channels.cache.get('846802831322775562').messages.fetch('983429746782248960')
                    .then(message => lib.saveFile("../nyextest/info/nyex-plans/possibilities.txt", message.content));

                message.client.channels.cache.get('846802831322775562').messages.fetch('1012060594918141982')
                    .then(message => lib.saveFile("../nyextest/info/nyex-plans/z-known_issues.txt", message.content));
            }catch (error){
                lib.error(message, error, "");
            }          
            
            message.reply({ content: "Nyex-plans fetched successfully!", allowedMentions: { repliedUser: false }});
            return;
        }

        // Do prepared SQL insertions if I want to
        if(lib.exists(args[0]) && args[0].toLowerCase() == "pop"){
            
            async function insertStuff(){
                // Read some file / list of things to prepare for insertion
                var tablename = "";
                var fields = "";
                var values = "";
                if(!lib.exists(tablename) || !lib.exists(fields) || !lib.exists(values)){
                    message.reply({ content: "\u274C Missing variables! Edit this command first", allowedMentions: { repliedUser: false }});
                    return;
                }

                // Process query
                var [rows] = await con.execute({sql: `insert into ${tablename} (${fields}) values ${values};`, rowsAsArray: false });
                message.reply({ content: "Table populated! SQL reply:\n" + JSON.stringify(rows), allowedMentions: { repliedUser: false }});
            }
            insertStuff();
            return;
        }

        // If I want to run an SQL query then do it
        if(lib.exists(args[0]) && args[0].toLowerCase() == "query"){
            async function doQuery(){
                args.splice(0, 1);

                // SQL query
                var [rows] = await con.execute({sql: args.join(' '), rowsAsArray: false });
                if(lib.exists(rows[0]) && rows[0].hasOwnProperty('content')){
                    rows[0].content = '<' + rows[0].content + '>';
                }

                message.reply({ content: "The query has been processed! Reply:\n" + JSON.stringify(rows).replace(/,/gi, "\n"), allowedMentions: { repliedUser: false }});
            }
            doQuery();
            return;
        }
        
        // Restart whole bot if wanted
        if(lib.exists(args[0]) && args[0].toLowerCase() == "restart"){
            async function botRestart(){
                await message.reply({ content: "Restarting bot process!", allowedMentions: {repliedUser: false}});
                process.exit();
            }
            botRestart();
        }

        // Failed
        message.reply({ content: "\u274C Try using an argument next time, donut", allowedMentions: { repliedUser: false }});
        return;

	},
};