var { prefix } = require('../config.json');

module.exports = {
	name: 'daily',
	usages: [''],
	descriptions: ['Shows the daily quest for your current user rank'],
    shortDescription: 'Check the daily quest',
    weight: 10,
    addendum: [
        '- The daily quest always asks you to `{prefix}deliver` a random monster matching your rank',
        '- You must use `{prefix}dodaily` to complete the quest',
        '- Completing the daily will reward you with either Gold, EXP or a bunch of items',
        '- Completing dailies consecutively will grant additional rewards every 7, 14, 21 and 30 days',
        '- Users with different ranks will receive different daily quests'
    ],
    category: 'tasks',
	
	execute(message, user, args, prefix) {
        
        // Set important variables
        var username = user.username;
        var dir = "userdata/" + user.id;
        
        // Check what rank the user is and use / generate the appropriate kind of quest
        var stats = lib.readFile(dir + "/stats.txt").split("|");
        var rank = stats[9];
        
        // Check current day and compare it to the one of the last time the command generated a daily quest
        var streakInfo = "\n**Reach a daily streak of 7, 14, 21 and 30 days to receive additional rewards!**";
        var last_day = parseInt(lib.readFile("data/daily_quests/current_day_" + rank + ".txt"));
        var d = new Date();
        var day = Math.floor(d.getTime() / 86400000);
        if(last_day != day){
            // Create a new random quest and save it
            // First choose a random main area
            var areaID = lib.rand(1, 13);
            var areaNames = lib.readFile("data/area_names.txt").split(",");
            var areaName = areaNames[areaID];
            // Then get a random monster
            var monsters_raw = lib.readFile("data/monsters/monsters_" + areaID + ".txt");
            var monster_groups = monsters_raw.split("#################################################################################\n");
            var rarities = {"SS": 0, "S": 1, "A": 2, "B": 3, "C": 4, "D": 5};
            var chosen_group = rarities[rank];
            var inverted_ids = [5, 4, 3, 2, 1, 0];
            chosen_group = inverted_ids[chosen_group];
            var monsters = monster_groups[chosen_group].split(";\n");
            var monster_key = lib.rand(0, monsters.length - 2);
            
            // Convert the key into the corresponding main ID
            var monster_data = monsters[monster_key].split("|");
            monster_key = monster_data[7];
            var mon_id = chosen_group + "," + monster_key + ",0";
            
            // Determine reward EXP by monster rarity
            var exp_table = ["100", "150", "200", "250", "300", "500"];
            var exp = exp_table[chosen_group];
            
            // Determine the appropriate vortex based on the quest's rank
            var vortexes = {D: 231, C: 231, B: 232, A: 232, S: 233, SS: 233};
            var vortex = vortexes[rank];
            
            // Pick the daily's reward between Vortex and EXP + Gold randomly
            var quest = "captures|" + mon_id + "|1|stat|exp&gold|" + exp + "|" + areaName + "|";
            var rewardRand = lib.rand(1, 100);
            if(rewardRand <= 33){quest = "captures|" + mon_id + "|1|item|" + vortex + "|1|" + areaName + "|";}
            
            lib.saveFile("data/daily_quests/daily_quest_" + rank + ".txt", quest);
            lib.saveFile("data/daily_quests/current_day_" + rank + ".txt", day);
        }else{
            // Load the already generated daily quest
            var quest = lib.readFile("data/daily_quests/daily_quest_" + rank + ".txt");
        }
        
        // If the user has already completed the daily quest, stop the command
        var done = parseInt(lib.readFile(dir + "/daily.txt").split("|")[0]);
        if(done == day){
            message.reply({ content: "@ __**" + username + "**__ You've already completed your daily " + rank + "-Rank quest!\nA new daily quest will become available at midnight GMT+1!" + streakInfo, allowedMentions: { repliedUser: false }});
            return;
        }
        
        // Further divide the quest into smaller bits of information
        var quest_data = quest.split("|");
        var target_type = quest_data[0];
        var target = quest_data[1];
        var amount = parseInt(quest_data[2]);
        var reward_type = quest_data[3];
        var reward = quest_data[4];
        var reward_amount = parseInt(quest_data[5]);
        var display_text = "Suggested area: " + quest_data[6];
        var reward_text = quest_data[7];
        
        // Further further extract information from the quest data
        var target_name = "";
    	var target_source = "data/monsters/monsters.txt";
    	var inv_path = dir + "/captures.txt";
    	var target_inv = lib.readFile(inv_path);
    	var separator = ";";
    	var monster_keys = target.split(",");
    	
    	monsters_raw = lib.readFile(target_source);
        monster_groups = monsters_raw.split("#################################################################################\n");
        monsters = monster_groups[monster_keys[0]].split(";\n");
        var monster_data = monsters[monster_keys[1]].split("|");
        
        var shiny = "";
        if(monster_keys[2] == "1"){
            shiny = "Shiny ";
        }
        target_name = shiny + monster_data[0];

        // Create button
        var button1 = new ButtonBuilder()
			.setCustomId("any|dodaily")
			.setLabel('Do daily')
			.setStyle(3);
		var row = new ActionRowBuilder().addComponents([button1]);
		
		// Check if the user has the monster in their previous captures
        var captures = lib.readFile(dir + "/captures.txt");
        var capped = "";
        if(captures.includes(target)){
            capped = "  ( \uD83D\uDCBC )";
        }
        
    	// Show the user info about their current quest
        var output = "@ __**" + username + "**__ Today's " + rank + "-Rank quest is... ```\nDeliver [" + target_name + "]!" + capped + "```" + display_text + streakInfo;
        message.reply({ content: output, allowedMentions: { repliedUser: false }, components: [row] });
	},
};