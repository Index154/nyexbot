var { prefix } = require('../config.json');

module.exports = {
	name: 'errorlog',
	usages: ['', 'clear', 'restart'],
	descriptions: ["Generates a viewable copy of the bot's error log", "Clears the main error log. The most recently generated copy is left untouched", "Restarts the whole bot (for applying changes made to the main functions)"],
	aliases: ['el'],
	addendum: ['Can only be used by Index154'],
	
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