var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'guess',
    usages: ['', '[text]', 'list', '[topic name]'],
	descriptions: ['Starts a round of the guessing game', 'Submits a reply for the current round', 'Shows a list of available guessing game topics', 'Switches to the given topic'],
    shortDescription: 'Play a guessing game',
	aliases: ['gu'],
    category: 'minigames',
	
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
        var server = message.guildId;
        
        // If the user isn't registered yet, stop the command
        if(!fs.existsSync(dir)){
            message.reply({ content: "\u274C Use `" + prefix + "encounter` first to create an account!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // If the server doesn't have a directory yet, create it along with the files
        if(!fs.existsSync("data/guess/" + server)){
            fs.mkdirSync("data/guess/" + server);
            lib.saveFile("data/guess/" + server + "/replies.txt", "Base reply");
            lib.saveFile("data/guess/" + server + "/users.txt", "Base user");
            lib.saveFile("data/guess/" + server + "/status.txt", "no");
            lib.saveFile("data/guess/" + server + "/user_ids.txt", "Base ID");
            lib.saveFile("data/guess/" + server + "/current_topic.txt", "gungeon");
            message.reply({ content: "`guess` has been used on this server for the first time!\nFiles have been generated... have fun!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // If there is at least one argument, check what whether it is a special argument or a reply
        var status = lib.readFile("data/guess/" + server + "/status.txt");
        if(args.length > 0){
            var allArgs = args.join(" ").toLowerCase();
            
            // If the argument is "list", "info", "topics" or "help", show a list of topics!
            var topics = lib.readFile("data/guess/topics.txt");
            if(allArgs == "list" || allArgs == "info" || allArgs == "topics" || allArgs == "help"){
                
                message.reply({ content: "Use `" + prefix + "guess` to start a game.\nUse `" + prefix + "guess [text]` to submit a guess.\nUse `" + prefix + "guess [topic name]` to change the server's topic.\n\nHere is a list of available topics:\n" + topics.replace(/,/g, ", "), allowedMentions: { repliedUser: false }});
                return;
            }
            
            // If there is an argument that matches something from the topics list, try to change the topic for the current server
            var check_topics = "," + topics + ",";
            // Check if the input matches a topic name exactly (case-insensitive)
            if(check_topics.includes("," + allArgs + ",")){
                // Switch to the matched topic
                lib.saveFile("data/guess/" + server + "/current_topic.txt", allArgs);
                message.reply({ content: "The guessing topic for the server has been changed to **" + allArgs + "**!", allowedMentions: { repliedUser: false }});
                return;
            }
            
            // Make sure that there is a game in progress, otherwise do not carry on
            if(status == "no"){
                message.reply({ content: "\u274C You have to use `" + prefix + "guess` first to start a game!", allowedMentions: { repliedUser: false }});
                return;
            }
            
            // Fetch previous replies and users for the current game
            var old_replies = lib.readFile("data/guess/" + server + "/replies.txt");
            var old_users = lib.readFile("data/guess/" + server + "/users.txt");
            var old_ids = lib.readFile("data/guess/" + server + "/user_ids.txt");
            
            // Check if the username is already in the list of replies. If they are, do not accept the reply. Otherwise update the relevant files with the new information
            // Also send an output message
            if (old_users.includes(username)) {
                message.reply({ content: "\u274C You already submitted a response for this round!", allowedMentions: { repliedUser: false }});
            }else{
                lib.saveFile("data/guess/" + server + "/users.txt", old_users + "," + username);
                lib.saveFile("data/guess/" + server + "/user_ids.txt", old_ids + "," + user.id);
                lib.saveFile("data/guess/" + server + "/replies.txt", old_replies + "," + allArgs);
                message.reply({ content: "Response submitted for **" + username + "**!", allowedMentions: { repliedUser: false }});
            }
            
            return;
        }
        
        // Prevent the command from working when there is already a game ongoing and there are no arguments
	    if(status == "yes"){
	        message.reply({ content: "\u274C There is already a game in progress!", allowedMentions: { repliedUser: false }});
	        return;
	    }
        lib.saveFile("data/guess/" + server + "/status.txt", "yes");

        // Fetch topic and categories
        var topic = lib.readFile("data/guess/" + server + "/current_topic.txt");
        var categories = lib.readFile("data/guess/topics/" + topic + "/prompts.txt");
        var category_array = categories.split(",");
        
        // Determine the category / prompt
        var rand_num = lib.rand(0, category_array.length - 1);
        var category = category_array[rand_num];
        
        // Fetch solution groups and select one based on the category
        var solutions = lib.readFile("data/guess/topics/" + topic + "/results.txt");
        var solution_groups = solutions.split(";\n");
        var selected_group = solution_groups[rand_num].split(",");
        
        // Select the one true result
        var rand_num_2 = lib.rand(0, selected_group.length - 1);
        var solution = selected_group[rand_num_2];
        
        // Determine which hint to show to the users if the category is items or guns
        var info1 = category;
        var info2 = "";
        if(rand_num > 2){
            var info_rand = lib.rand(0, 1);
            
            if(info_rand === 0){
                info2 = " starting with **\"" + solution.substring(0, 1) + "\"**";
                var info_split = category.split(" from ");
                info1 = info_split[0];
            }
        }

        // Send prompt message and start timeout
        message.reply({ content: "The category is: " + info1 + info2 + "! You have 13 seconds to make your guess!", allowedMentions: { repliedUser: false }});
        
        setTimeout(function(){
            // Executes after the timeout    
            
            // Fetch the submitted replies as well as the users
            var replies_raw = lib.readFile("data/guess/" + server + "/replies.txt");
            var replies_array = replies_raw.split(",");
            var users_raw = lib.readFile("data/guess/" + server + "/users.txt");
            var users_array = users_raw.split(",");
            var users = "";
            var user_ids = lib.readFile("data/guess/" + server + "/user_ids.txt").split(",");
            
            // Go through all the replies and compare them to the solution
            for(y = 0; y < replies_array.length; y++){
                
                if(replies_array[y].localeCompare(solution.toLowerCase()) === 0){
                    // The submission is correct
                    
                    // Update the list of winners
                    if(users !== ""){
                        users += ", ";
                    }
                    users += users_array[y];
                    
                    // Give scrap to the user
                    var scrap_amount = parseInt(lib.readFile("userdata/" + user_ids[y] + "/scrap.txt"));
                    scrap_amount += 15;
                    lib.saveFile("userdata/" + user_ids[y] + "/scrap.txt", scrap_amount);
                    
                }
            }
            
            // Determine the report of who answered correctly if there were any correct answers
            if(users === ""){extra = "";}
            else{extra = "The following users got it right and received 15 scrap each: **" + users + "**";}
            
            // Give scrap to the users
            for(i = 0; i < users_array.length; i++){
                
            }
            
            // Send solution report
            message.reply({ content: "The result was: **" + solution + "**\n" + extra, allowedMentions: { repliedUser: false }});
            
            // Update status and empty submission caches
            lib.saveFile("data/guess/" + server + "/replies.txt", "Base reply");
            lib.saveFile("data/guess/" + server + "/users.txt", "Base user");
            lib.saveFile("data/guess/" + server + "/status.txt", "no");
            lib.saveFile("data/guess/" + server + "/user_ids.txt", "Base ID");
            
        }, 13000); // Timer = 13 seconds
        
	},
};

