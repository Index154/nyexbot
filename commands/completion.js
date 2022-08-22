var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'completion',
	usages: [''],
	descriptions: ['Displays your current completion percentages and resulting radar efficiency'],
    shortDescription: 'Check your game completion statistics',
    weight: 20,
	aliases: ['compl'],
	category: 'userinfo',
	
	execute(message, user, args) {
		var allArgs = args.join(" ");
	    
	    // Check if the server has a custom prefix and load it
        if(message.guild !== null){
            var serverID = message.guildId;
            if(fs.existsSync("./data/configs/" + serverID)){
                prefix = lib.readFile("./data/configs/" + serverID + "/prefix.txt");
            }
        }
	    
		function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
        }
        
        // Set important variables
        var username = user.username;
        var dir = "userdata/" + user.id;
		// Get total monster and quest counts
		var mons = lib.readFile("data/monsters/monsters.txt").split(";\n");
		var quests = lib.readFile("data/quests.txt").split(";\n");
		var mon_total = mons.length - 1;
		var quest_total = quests.length;
        
        // If the user isn't registered yet, stop the command
        if(!fs.existsSync(dir)){
            message.reply({ content: "\u274C Use `" + prefix + "encounter` first to create an account!", allowedMentions: { repliedUser: false }});
            return;
        }
        
		// Get the count of completed quests and completion percentage
		var quest_num = parseInt(lib.readFile(dir + "/current_quest.txt"));
		var quest_progress = (Math.round((quest_num / quest_total) * 1000)) / 10;
		
		// Get a full list of captured monsters
		var captures = lib.readFile(dir + "/all_captures.txt");
		var mon_progress = 1;
		if(captures.includes(";")){
			var monster_key_groups = captures.split(";");
			var monster_key_groups_2 = captures.split(";");
		}else if(captures !== ""){
			var monster_key_groups = [captures];
			var monster_key_groups_2 = [captures];
		}else{
			var mon_progress = 0;
			var mon_num = 0;
		}
		
		var shiny_progress = 0;
		if(mon_progress !== 0){
		    
			// Remove shiny IDs from monsters
			var keys = "";
			for(i = 0; i < monster_key_groups.length; i++){
				keys = monster_key_groups[i];
				monster_key_groups[i] = keys.slice(0, -2);
			}
			
			// Remove duplicate monsters and get the completion percentage
			var monster_key_groups_uniq = monster_key_groups.filter(onlyUnique);
			var mon_num = monster_key_groups_uniq.length;
			var mon_progress = (Math.round((mon_num / mon_total) * 1000)) / 10;
			
			// Remove non-shinies from the secondary monster list
			var loop_count = monster_key_groups_2.length;
			for(x = 0; x < loop_count; ){
				keys = monster_key_groups_2[x];
        		var keys_split = keys.split(",");
        		if(keys_split[2] != "1"){
        			monster_key_groups_2.splice(x, 1);
        			loop_count--;
        		}else{
        			x++;
        		}
			}
			
			// Remove duplicate shinies and get the completion percentage
			var monster_key_groups_2_uniq = monster_key_groups_2.filter(onlyUnique);
			var shiny_num = monster_key_groups_2_uniq.length;
			shiny_progress = (Math.round((shiny_num / mon_total) * 1000)) / 10;
		}
		
		// Calculate efficiency
		var q_eff = (quest_progress * 0.01) * 95;
		var m_eff = (mon_progress * 0.01) * 180;
		var real_eff = Math.round(q_eff + m_eff);
		var efficiency = Math.round((real_eff / 275) * 1000) / 10;
		
		// Assemble a basic embed
	    var outputEmbed = new Discord.MessageEmbed()
        	.setColor('#0099ff')
        	.setTitle(username + "'s Completion")
        	.addFields(
        		{ name: 'Quest completion', value: quest_progress + "%", inline: true },
        		{ name: 'Monster collection', value: mon_progress + "%", inline: true },
        		{ name: 'Shiny collection', value: shiny_progress + "%", inline: true },
        		{ name: 'Radar efficiency', value: efficiency + "%", inline: true }
        	)
        	.setDescription("By increasing your completion percentages you can get a higher chance of encountering shiny monsters when using the monster radar!")
        	.setFooter({ text: "Make sure to reactivate your radar if you want its efficiency to be updated!" });
        
        // Output
	    message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false }});
		
    },
};