var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'todo',
	usages: [''],
	descriptions: ['Shows a collection of your current command cooldowns and other tasks'],
	aliases: ['timers'],
	addendum: '',
    category: 'main',
	
	execute(message, user, args) {
	    fs = require('fs');
	    const lib = require("../library.js");
        
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
            message.reply({ content: "Use `" + prefix + "encounter` first to create an account!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // Create embed
        var outputEmbed = new Discord.MessageEmbed()
        	.setColor('#0099ff')
        	.setTitle(username + "'s To-Do List")
        var description = "";
        var buttons = [];
        
        // Check user level
        var stats = lib.readFile(dir + "/stats.txt").split("|");
        var level = parseInt(stats[10]);
        
        // Check for daily radar charges
        var d = new Date();
        var first = new Date(d.getFullYear(), 0, 1);
        var current_day = Math.round(((d - first) / 1000 / 60 / 60 / 24) + .5, 0);
        var last_day = parseInt(lib.readFile(dir + "/daily_radar.txt"));
        if(level >= 5){
            if(current_day != last_day){
                description += "\uD83D\uDCE1 You have yet to claim your daily **radar** charges!";
                var button1 = new MessageButton()
        			.setCustomId("any|radar")
        			.setLabel('Radar')
        			.setStyle('PRIMARY')
        		buttons.push(button1);
            }
        }
        
        // Check for daily quest
        var day = Math.floor(d.getTime() / 86400000);
        var done = parseInt(lib.readFile(dir + "/daily.txt").split("|")[0]);
        if(done != day){
            description += "\n\uD83D\uDCC6 You have yet to complete the **daily** quest!";
            var button2 = new MessageButton()
    			.setCustomId("any|daily")
    			.setLabel('Daily')
    			.setStyle('PRIMARY')
    		buttons.push(button2);
        }
        
        // Check worldboss cooldown
        var current_sec = Math.floor(d.getTime() / 1000);
	    var last_boss = parseInt(lib.readFile(dir + "/boss_cd.txt"));
	    var boss = lib.readFile("data/worldboss.txt");
	    if(boss !== "" && boss !== undefined){
    	    if(current_sec < last_boss + 3600){
    	        var wbCooldown = lib.secondsToTime(3600 - current_sec + last_boss);
    	        description += "\n\u274C Your worldboss cooldown is **" + wbCooldown + "**";
    	    }else{
    	        description += "\n\u2694 You can fight the **worldboss** right now!";
    	        var button3 = new MessageButton()
        			.setCustomId("any|worldboss")
        			.setLabel('Worldboss')
        			.setStyle('PRIMARY')
        		buttons.push(button3);
    	    }
	    }
	    
	    // Check monster cooldown
	    var last_mon = parseInt(lib.readFile(dir + "/mon_cd.txt"));
        var monCD = 10800;
        if(last_mon + monCD > current_sec){
            var monCooldown = lib.secondsToTime(monCD - current_sec + last_mon);
            description += "\n\u274C Your monster cooldown is **" + monCooldown + "**";
        }else{
            description += "\n\uD83D\uDC17 You can receive a free **monster** right now!";
            var button4 = new MessageButton()
    			.setCustomId("any|monster")
    			.setLabel('Monster')
    			.setStyle('PRIMARY')
    		buttons.push(button4);
        }
        
        // Check research
        if(level >= 20){
            var research = lib.readFile(dir + "/research.txt");
            if(research !== undefined && research !== ""){
                var research_data = research.split("|");
                var remaining = (parseInt(research_data[0]) + parseInt(research_data[1])) - current_sec;
                if(remaining <= 0){
                    description += "\n\uD83E\uDDEA You can claim your **research** rewards right now!";
                    var button6 = new MessageButton()
            			.setCustomId("any|research")
            			.setLabel('Research')
            			.setStyle('PRIMARY')
            		buttons.push(button6);
                }else{
                    remaining = lib.secondsToTime(remaining);
                    description += "\n\u274C Your research cooldown is **" + remaining + "**";
                }
            }else{
                description += "\n\uD83E\uDDEA You can start a new **research** project right now!";
                var button6 = new MessageButton()
        			.setCustomId("any|research")
        			.setLabel('Research')
        			.setStyle('PRIMARY')
        		buttons.push(button6);
            }
        }
        
        // Check quest
        var quest_list_raw = lib.readFile("data/quests.txt");
        var quest_list = quest_list_raw.split(";\n");
        var quest_count = quest_list.length;
        var quest_id = lib.readFile(dir + "/current_quest.txt");
        if(quest_id < quest_count){
            var quest = quest_list[quest_id];
            var quest_data = quest.split("|");
            var target_type = quest_data[0];
            var target = quest_data[1];
            var amount = parseInt(quest_data[2]);
            var display_text = quest_data[6].replace(/{prefix}/g, prefix).replace(/\\n/g, "\n");
            var source_info = quest_data[8];
            var quest_target = "";
            if(target_type == "inventory" || target_type == "materials"){
            	var target_source = "data/items.txt";
            	
            	var item_list = lib.readFile(target_source).split(";\n");
            	var item_data = item_list[target].split("|");
            	
            	target_name = item_data[0];
            	quest_target = "Deliver [" + target_name + "] x " + amount + "! (Suggested source: " + source_info + ")";
            }else if(target_type == "captures"){
            	var target_source = "data/monsters/monsters.txt";
            	var monster_keys = target.split(",");
            	
            	var monsters_raw = lib.readFile(target_source);
                var monster_groups = monsters_raw.split("#################################################################################\n");
                var monsters = monster_groups[monster_keys[0]].split(";\n");
                var monster_data = monsters[monster_keys[1]].split("|");
                
                var shiny = "";
                if(monster_keys[2] == "1"){
                    shiny = "Shiny ";
                }
                target_name = shiny + monster_data[0];
                quest_target = "Deliver [" + target_name + "] x " + amount + "! (Suggested source: " + source_info + ")";
            }else{
                // Special equipment check quest
                quest_target = "Gear up for " + quest_data[2] + "-rank!";
            }
            
        	// Show the user info about their current quest
        	description += "\n\uD83D\uDCAC Your current quest is: **" + quest_target + "**";
        	var button7 = new MessageButton()
    			.setCustomId("any|deliver")
    			.setLabel('Do quest')
    			.setStyle('PRIMARY')
    		buttons.push(button7);
        }
        
        // Add description to the embed
        outputEmbed
                .setDescription(description);
        
        // Output
        if(buttons.length < 1){
            message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false } });
        }else{
            if(buttons.length > 5){
                var first = buttons.slice(0, 5);
                var second = buttons.slice(5);
                var row1 = new MessageActionRow().addComponents(first);
                var row2 = new MessageActionRow().addComponents(second);
                message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false }, components: [row1, row2] });
            }else{
                var row = new MessageActionRow().addComponents(buttons);
                message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false }, components: [row] });
            }
        }
	    
        
	},
};