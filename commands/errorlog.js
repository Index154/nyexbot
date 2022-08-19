var { prefix } = require('../config.json');

module.exports = {
	name: 'errorlog',
	usages: ['', 'clear', 'restart', 'pull'],
	descriptions: ["Generates a viewable copy of the bot's error log", "Clears the main error log. The most recently generated copy is left untouched", "Restarts the whole bot (for applying changes made to the main functions)", "Fetches the contents of the messages in the nyex-plans channel on the main server and saves them"],
    shortDescription: 'Many functions',
	aliases: ['el'],
	addendum: ['Can only be used by Index154'],
    category: 'admin',
	
	execute(message, user, args) {
	    
        // Check if the server has a custom prefix and load it
        if(message.guild !== null){
            var serverID = message.guildId;
            if(fs.existsSync("./data/configs/" + serverID)){
                prefix = lib.readFile("./data/configs/" + serverID + "/prefix.txt");
            }
        }
        
        // Set important variables
        var id = user.id;
        
        // If the user isn't me, end the command
        if(id != "214754022832209921"){
            message.reply({ content: "\u274C This command is only useable by Index154", allowedMentions: { repliedUser: false }});
            return;
        }

        // Pull nyex-plans content from Discord if I want to
        if(lib.exists(args[0]) && args[0].toLowerCase() == "pull"){
            message.client.channels.cache.get('846802831322775562').messages.fetch('846804108936871997')
                .then(message => lib.saveFile("./data/nyex-plans/1_main_goals.txt", message.content))
                .catch(console.error);

            message.client.channels.cache.get('846802831322775562').messages.fetch('983429707360006144')
                .then(message => lib.saveFile("./data/nyex-plans/additional_goals.txt", message.content))
                .catch(console.error);
            
            message.client.channels.cache.get('846802831322775562').messages.fetch('983429732727156817')
                .then(message => lib.saveFile("./data/nyex-plans/lower_priority.txt", message.content))
                .catch(console.error);
            
            message.client.channels.cache.get('846802831322775562').messages.fetch('983429746782248960')
                .then(message => lib.saveFile("./data/nyex-plans/possibilities.txt", message.content))
                .catch(console.error);
            
            message.reply({ content: "Nyex-plans fetched successfully!", allowedMentions: { repliedUser: false }});
            return;
        }

        // Do prepared SQL insertions if I want to
        if(lib.exists(args[0]) && args[0].toLowerCase() == "pop"){
            
            var newImages = lib.readFile("./data/monsters/temp.txt").split("\n");
            var shinyLists = lib.readFile("./data/monsters/monsters_shiny.txt").split("#################################################################################\n");
            for(i = 0; i < shinyLists.length; i++){
                var shinyList = shinyLists[i].split(";\n");
                for(o = 0; o < shinyList.length - 1; o++){
                    var shiny = shinyList[o].split("|");
                    if(!shiny[5].includes("shiny")){
                        for(e = 0; e < newImages.length; e++){
                            var image = newImages[e].split("/");
                            image = image[1].split(".");
                            if(shiny[0].toLowerCase().replaceAll(/ /g, "_") == image[0]){
                                shiny[5] = newImages[e];
                            }
                        }
                    }
                    shinyList[o] = shiny.join("|");
                }
                shinyLists[i] = shinyList.join(";\n");
            }
            lib.saveFile("./data/monsters/monsters_shiny.txt", shinyLists.join("#################################################################################\n"));
            message.reply({ content: "Operation completed!", allowedMentions: { repliedUser: false }});
            return;

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

                message.reply({ content: "The query has been processed! Reply:\n" + JSON.stringify(rows), allowedMentions: { repliedUser: false }});
            }
            doQuery();
            return;
        }
        
        // Restart whole bot if wanted
        if(lib.exists(args[0]) && args[0].toLowerCase() == "restart"){
            async function botRestart(){
                await message.reply({ content: "Restarting bot process!", allowedMentions: {repliedUser: false}});
                await console.log("Triggered manual restart through command");
                process.exit();
            }
            botRestart();
        }
            
        // Get error log
        var log = lib.readFile("/root/.pm2/logs/app-error.log");
        if(!lib.exists(log)){log = "Empty";}
        
        // If I want to clear the error log, do it
        if(args[0] == "clear"){
            lib.saveFile("/root/.pm2/logs/app-error.log", "Cleared");
            message.reply({ content: "Error log cleared!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // Split log into lines
        var log_array = log.split("\n");
        
        // If the log is empty, don't do anything
        if(log_array.length < 2){
            message.reply({ content: "\u274C The error log is empty!", allowedMentions: { repliedUser: false }});
            return;
        }

        // Get link
        var log_out = log_array.join("\n");
        lib.saveFile("../indexnight/nyexbot_logs/error-0_log", log_out);
        var output = "Created temporary log file:\nhttps://indexnight.com/nyexbot_logs/error-0_log";

        // Output
        message.reply({ content: output, allowedMentions: { repliedUser: false }});
        
	},
};