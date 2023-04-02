var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'research',
	usages: ['', 'A/B/C'],
	descriptions: ["Displays your available research projects or your currently active project. Also claims a completed project's rewards", 'Starts the selected project'],
    shortDescription: 'Use Scrap to get rewards (level 20 required)',
    weight: 25,
    addendum: [
        '- Can only be used after reaching level 20',
        '- There are five types of research projects with different rewards: Gold, EXP, buff, radar and Vortex',
        '- The Scrap cost of a project depends on its type as well as its size / duration',
        '- The only way to reset your list of available projects is to complete one of them',
        '- Scrap can be obtained by converting `{prefix}materials` or by winning in the `{prefix}guess` minigame'
    ],
	aliases: ['res'],
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
            message.reply({ content: "@ __**" + username + "**__ \u274C Use `" + prefix + "encounter` first to create an account!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // If the user is below level 20, stop the command
        var user_stats = lib.readFile(dir + "/stats.txt").split("|");
        if(parseInt(user_stats[10]) < 20){
            message.reply({ content: "@ __**" + username + "**__ \u274C You must be at least **level 20** to use this command!\nYour current level is " + user_stats[10], allowedMentions: { repliedUser: false }});
            return;
        }
        
        // If there is an active project, show its status
        var research = lib.readFile(dir + "/research.txt");
        if(research !== undefined && research !== ""){
            // Split data into chunks
            var research_data = research.split("|");
            
            // If the project is already finished, give out the rewards
            var d = new Date();
            var current_time = Math.floor(d.getTime() / 1000);
            var remaining = (parseInt(research_data[0]) + parseInt(research_data[1])) - current_time;
            var levelup_extra = "";
            if(remaining <= 0){
                // Decide on the reward details and give the reward
                var reward = "[Nothing]";
                var user_stats = lib.readFile(dir + "/stats.txt").split("|");
                var trophy_extra = "";
                
                if(research_data[2] == "Gold"){
                    // Get Gold based on size
                    var gold_amounts = {Small: 200, Medium: 400, Large: 800};
                    var gold = gold_amounts[research_data[3]];
                    reward = gold + " Gold";
                    user_stats[12] = parseInt(user_stats[12]) + gold;
                    
                    // Update user stats
                    lib.saveFile(dir + "/stats.txt", user_stats.join("|"))
                    
                }else if(research_data[2] == "EXP"){
                    // Get EXP based on size
                    var exp_amounts = {Small: 200, Medium: 400, Large: 800};
                    var exp = exp_amounts[research_data[3]];
                    reward = exp + " EXP";
                    user_stats[11] = parseInt(user_stats[11]) + exp;
                    
                    // Check for levelups
                    var levels = lib.readFile("data/level_reqs.txt").split(",");
                    var levelCheckResults = lib.levelCheck(levels, user_stats, levelup_extra, prefix, dir);
                    levelup_extra = levelCheckResults.levelup_extra;
                    user_stats = levelCheckResults.stats;
                    trophy_extra = levelCheckResults.trophy_extra;
                    
                    // Give a trophy if necessary
                    if(trophy_extra !== ""){
                        var trophy_data = trophy_extra.split("|");
                        var trophy_ranks = {"10": "D", "20": "C", "30": "B", "40": "A", "50": "S", "60": "SS", "70": "SS", "80": "SS", "90": "SS", "100": "SS"};
                        var trophy_weights = {"10": "44", "20": "43", "30": "42", "40": "41", "50": "40", "60": "39", "70": "38", "80": "37", "90": "36", "100": "35"};
                        var new_trophy = trophy_weights[trophy_data[1]] + "|" + "Level" + "|" + trophy_ranks[trophy_data[1]] + "|**EXP Collector** - Reached level " + trophy_data[1];
                        
                        var trophies = lib.readFile(dir + "/trophies.txt");
                        if(trophies === "" || trophies === undefined){
        	                trophies = new_trophy;
        	            }else{
                            trophies = trophies + ";\n" + new_trophy;
        	            }
                        lib.saveFile(dir + "/trophies.txt", trophies);
                        trophy_extra = "\n" + trophy_data[0];
                    }
                    
                    // Update user stats
                    lib.saveFile(dir + "/stats.txt", user_stats.join("|"));
                    
                }else if(research_data[2] == "Buff"){
                    // If the user has an active buff then abort
                    var current_buff = lib.readFile(dir + "/current_buff.txt");
                    if(current_buff !== undefined && current_buff !== ""){
                        message.reply({ content: "@ __**" + username + "**__ \u274C You can not claim a research buff while having an active buff!", allowedMentions: { repliedUser: false }});
                        return;
                    }
                    
                    // Prepare all possible options for the buff
                    var buff_names = ["Null", "Attack", "Speed", "Capture Efficiency", "Monster Luck", "Item Luck", "Greater Item Luck"];
                    var durations = {Small: 10, Medium: 15, Large: 20};
                    var values_small = [0, 15, 15, 10, 20, 5, 10];
                    var values_medium = [0, 20, 20, 15, 30, 10, 15];
                    var values_large = [0, 25, 25, 20, 40, 15, 20];
                    
                    var new_buff = ["Research", 0, 0, 0, 0, 0, 0, 0, 0, "Buff description placeholder", "Item,"];
                    
                    // Generate random buff with duration and effectiveness depending on both the type and size (using the arrays from above)
                    var stat_rand = lib.rand(1,6);
                    var reward = research_data[3] + " " + buff_names[stat_rand] + " Buff";
                    if(research_data[3] == "Medium"){
                        // For medium research there is a chance for the duration and value of the buff to be a mix between large and small
                        switch(lib.rand(1,3)) {
                            case 1:
                                // Small duration and large value
                                var duration = durations["Small"];
                                var value = values_large[stat_rand];
                                break;
                            case 2:
                                // Large duration and small value
                                var duration = durations["Large"];
                                var value = values_small[stat_rand];
                                break;
                            default:
                                // Medium and medium (normal)
                                var duration = durations["Medium"];
                                var value = values_medium[stat_rand];
                        } 
                    }else if(research_data[3] == "Small"){
                        var duration = durations["Small"];
                        var value = values_small[stat_rand];
                    }else{
                        var duration = durations["Large"];
                        var value = values_large[stat_rand];
                    }
                    
                    // Combine values to finalize the buff
                    new_buff[10] = new_buff[10] + duration;
                    new_buff[stat_rand] = value;
                    
                    // Calculate updated stats
                    for(y = 1; y < 7; y++){
                        var base = parseInt(user_stats[y]);
                        var plus = parseInt(new_buff[y]);
                        user_stats[y] = base + plus;
                    }
                    
                    // Update stats
                    lib.saveFile(dir + "/stats.txt", user_stats.join("|"));
                    lib.saveFile(dir + "/current_buff.txt", new_buff.join("|"));
                    
                }else if(research_data[2] == "Vortex"){
                    // Determine the appropriate vortex based on the user's rank
                    var vortexes = {D: 231, C: 231, B: 232, A: 232, S: 233, SS: 233};
                    var vortex = vortexes[user_stats[9]];
                    var items = lib.readFile("data/items.txt").split(";\n");
                    var vortex_data = items[vortex].split("|");
                    reward = vortex_data[0];
                    
                    // Save to inventory
                    var inv = lib.readFile(dir + "/inventory.txt");
                    if(inv !== undefined && inv !== ""){
                        if(inv.includes(",")){
                            inv = inv + "," + vortex;
                        }else{
                            inv = vortex;
                        }
                    }else{
                        inv = vortex;
                    }
                    lib.saveFile(dir + "/inventory.txt", inv);
                    
                }else if(research_data[2] == "Radar"){
                    // Get radar charges based on size
                    var charges = {Small: 15, Medium: 30, Large: 60};
                    var charge_amount = charges[research_data[3]];
                    reward = charge_amount + " radar charges";
                    
                    // Determine new charge amount
                    var old_charge_amount = lib.readFile(dir + "/charges.txt");
                    if(old_charge_amount === "" || old_charge_amount === undefined){old_charge_amount = 0;}
                    charge_amount = charge_amount + parseInt(old_charge_amount);
                    
                    // Give the user their charges (also in their active radar buff if necessary)
                    lib.saveFile(dir + "/charges.txt", charge_amount);
                    var current_buff = lib.readFile(dir + "/current_buff.txt");
                    if(current_buff !== undefined && current_buff !== ""){
                        var buff_data = current_buff.split("|");
                        if(buff_data[0] == "Monster Radar"){
                            buff_data[10] = "Special," + charge_amount;
                            lib.saveFile(dir + "/current_buff.txt", buff_data.join("|"));
                        }
                    }
                    
                }
                
                // Output and clearing of research file
                if(levelup_extra !== ""){levelup_extra = "\n" + levelup_extra;}
                message.reply({ content: "You claimed your research reward:\n**" + reward + "**" + levelup_extra + trophy_extra, allowedMentions: { repliedUser: false }});
                lib.saveFile(dir + "/research.txt", "");
                return;
            }
            
            // Display remaining time on current project as well as its name (regular output)
            remaining = lib.secondsToTime(remaining);
            message.reply({ content: "\u274C You need to wait **" + remaining + "** before you can claim your reward from the **[" + research_data[3] + " " + research_data[2] + " Research]**!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // If no projects have been generated yet, generate them. Otherwise load the existing ones
        var projects = lib.readFile(dir + "/projects.txt");
        var research_durations = {Small: "4 hours", Medium: "8 hours", Large: "15 hours", Unstable: "30 hours"};
        var prices = {Small: 5, Medium: 10, Large: 20, Unstable: 40};
        if(projects === undefined || projects === ""){
            // Clear the user input to prevent accidentally chosing a project right after it is generated
            args[0] = "";
            
            // Set a list of possible rewards (partially restricted by user rank)
            var research_types = ["Gold", "EXP", "Buff", "Vortex", "Radar"];
            var research_sizes = ["Small", "Small", "Medium", "Medium", "Large"];
            
            // Generate three projects with the possible choices from above and save the results
            projects = "";
            for(y = 0; y < 3; y++){
                var type_rand = lib.rand(0, research_types.length - 1);
                var type = research_types[type_rand];
                var size_rand = lib.rand(0, research_sizes.length - 1);
                var size = research_sizes[size_rand];
                if(type == "Vortex"){size = "Unstable"; research_types.splice(3, 1)}
                if(y > 0){
                    projects = projects + "|";
                }
                projects = projects + type + ";" + size;
            }
            lib.saveFile(dir + "/projects.txt", projects);
            
        }
        
        // Extract data from project list
        project_list = projects.split("|");
        projectA_data = project_list[0].split(";");
        projectB_data = project_list[1].split(";");
        projectC_data = project_list[2].split(";");
        
        // If the user's input matches one of the generated projects and they have enough scrap then begin research
        if(args[0] !== "" && args[0] !== undefined){args[0] = args[0].toUpperCase();}
        if(args[0] == "A" || args[0] == "B" || args[0] == "C"){
            var cooldowns = {Small: 14400, Medium: 28800, Large: 54000, Unstable: 108000};
            if(args[0] == "A"){
                var cooldown = cooldowns[projectA_data[1]];
                var price = prices[projectA_data[1]];
                var chosen_type = projectA_data[0];
                var chosen_size = projectA_data[1];
            }else if(args[0] == "B"){
                var cooldown = cooldowns[projectB_data[1]];
                var price = prices[projectB_data[1]];
                var chosen_type = projectB_data[0];
                var chosen_size = projectB_data[1];
            }else{
                var cooldown = cooldowns[projectC_data[1]];
                var price = prices[projectC_data[1]];
                var chosen_type = projectC_data[0];
                var chosen_size = projectC_data[1];
            }
            
            // Check if the user has enough scrap and subtract it if so
            var scrap_amount = lib.readFile(dir + "/scrap.txt");
            if(scrap_amount === undefined || scrap_amount === ""){scrap_amount = 0;}
            if(scrap_amount < price){
                message.reply({ content: "@ __**" + username + "**__ \u274C You don't have enough scrap to start this research project!\n(" + scrap_amount + "/" + price + ")", allowedMentions: { repliedUser: false }});
                return;
            }else{
                // Remove the scrap from the user's scrap count
                scrap_amount = parseInt(scrap_amount) - price;
                lib.saveFile(dir + "/scrap.txt", scrap_amount);
            }
            
            // Start the project
            var d = new Date();
            var starting_time = Math.floor(d.getTime() / 1000);
            research = cooldown + "|" + starting_time + "|" + chosen_type + "|" + chosen_size;
            lib.saveFile(dir + "/research.txt", research);
            lib.saveFile(dir + "/projects.txt", "");
            message.reply({ content: "@ __**" + username + "**__, you started the project **[" + chosen_size + " " + chosen_type + " Research]**!\nUse `" + prefix + "research` again after " + research_durations[chosen_size] + " to claim your reward!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // Create selection buttons
        // Build buttons
		var button1 = new MessageButton()
			.setCustomId(user.id + "|research A")
			.setLabel('A')
			.setStyle('SUCCESS')
		var button2 = new MessageButton()
			.setCustomId(user.id + "|research B")
			.setLabel('B')
			.setStyle('SUCCESS')
		var button3 = new MessageButton()
			.setCustomId(user.id + "|research C")
			.setLabel('C')
			.setStyle('SUCCESS')
		var buttons = [button1, button2, button3];
		
		// Get scrap amount
		var scrapAmount = parseInt(lib.readFile(dir + "/scrap.txt"));
		var notAffordable = ["", "", ""];
		if(scrapAmount < parseInt(prices[projectA_data[1]])){notAffordable[0] = " - **You don't have enough!**"}
		if(scrapAmount < parseInt(prices[projectB_data[1]])){notAffordable[1] = " - **You don't have enough!**"}
		if(scrapAmount < parseInt(prices[projectC_data[1]])){notAffordable[2] = " - **You don't have enough!**"}
        
        // Display project list
	    var outputEmbed = new Discord.MessageEmbed()
        	.setColor('#0099ff')
        	.setTitle(username + "'s available research projects")
        	.setDescription("Available Scrap: " + scrapAmount.toString())
        	.addFields(
        		{ name: "Project A:\n[" + projectA_data[1] + " " + projectA_data[0] + " Research]", value: "Cost: " + prices[projectA_data[1]] + " Scrap" + notAffordable[0] + "\nDuration: " + research_durations[projectA_data[1]], inline: false},
        		{ name: "Project B:\n[" + projectB_data[1] + " " + projectB_data[0] + " Research]", value: "Cost: " + prices[projectB_data[1]] + " Scrap" + notAffordable[1] + "\nDuration: " + research_durations[projectB_data[1]], inline: false},
        		{ name: "Project C:\n[" + projectC_data[1] + " " + projectC_data[0] + " Research]", value: "Cost: " + prices[projectC_data[1]] + " Scrap" + notAffordable[2] + "\nDuration: " + research_durations[projectC_data[1]], inline: false}
        	)
        	.setFooter({ text: "Use \"" + prefix + "research [A/B/C]\" or a button to start a project!" });
        
        // Output
        lib.buttonReply(message, [outputEmbed], buttons)
        
	},
};