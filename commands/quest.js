var { prefix } = require('../config.json');

module.exports = {
	name: 'quest',
	usages: [''],
	descriptions: ['Shows you your current main quest and some additional info'],
    category: 'main',
	
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
        
        // Get user's current main quest
        var quest_list_raw = lib.readFile("data/quests.txt");
        var quest_list = quest_list_raw.split(";\n");
        var quest_count = quest_list.length;
        var quest_id = lib.readFile(dir + "/current_quest.txt");
        // If the user has finished the final quest, cancel the command
        if(quest_id == quest_count){
            message.reply({ content: "@ __**" + username + "**__ \u274C You've already completed every quest there is!", allowedMentions: { repliedUser: false }});
            return;
        }
        var quest = quest_list[quest_id];
        
        // Further divide the quest into smaller bits of information
        var quest_data = quest.split("|");
        var target_type = quest_data[0];
        var target = quest_data[1];
        var amount = parseInt(quest_data[2]);
        var display_text = quest_data[6].replace(/{prefix}/g, prefix).replace(/\\n/g, "\n");
        var source_info = quest_data[8];
        
        // Create button
        var button1 = new MessageButton()
			.setCustomId(user.id + "|deliver")
			.setLabel('Deliver')
			.setStyle('SUCCESS')
		var row = new MessageActionRow().addComponents([button1]);
        
        // Further further extract information from the quest data
        var target_name = "";
        var output = "";
        if(target_type == "inventory" || target_type == "materials"){
        	var target_source = "data/items.txt";
        	
        	var item_list = lib.readFile(target_source).split(";\n");
        	var item_data = item_list[target].split("|");
        	
        	target_name = item_data[0];
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
        }else{
            // Special equipment check quest with its own output
            output = "@ __**" + username + "**__, your current quest is... ```\nGear up!```" + display_text;
            message.reply({ content: output, components: [row], allowedMentions: { repliedUser: false }});
            return;
        }
        
    	// Show the user info about their current quest
    	output = "@ __**" + username + "**__, your current quest is... ```\nDeliver [" + target_name + "] x " + amount + "!\nSuggested source: " + source_info + "```" + display_text;
        message.reply({ content: output, allowedMentions: { repliedUser: false }, components: [row] });
        
	},
};