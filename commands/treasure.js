var { prefix } = require('../config.json');

module.exports = {
	name: 'treasure',
	usages: [''],
	descriptions: ['Grants you a free consumable item every three hours. However, you can only carry one at a time'],
	aliases: ['tre'],
	
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
        
        // Get current timestamp in milliseconds since 1970
        var d = new Date();
        var current_sec = Math.floor(d.getTime() / 1000);
        
        // Get the timestamp from the last time the user got a treasure item
        var last_sec = parseInt(lib.readFile(dir + "/cooldown.txt"));
        
        // Check if the cooldown has passed
        var cooldown = 10800;
        if(last_sec + cooldown < current_sec || last_sec - current_sec > cooldown){
            // Get treasure loot data
            var icon_array = {D: "<:real_black_circle:856189638153338900>", C: "\uD83D\uDD35", B: "\uD83D\uDFE2", A: "\uD83D\uDD34", S: "\uD83D\uDFE1", SS: "\uD83D\uDFE0", Special: "\u2728", Vortex: "\uD83C\uDF00"};
            var items = lib.readFile("data/items.txt").split(";\n");
            var treasures = lib.readFile("data/treasure_drops.txt").split(";\n");
            var common_drops = treasures[0].split(",");
            var rare_drops = treasures[1].split(",");
            var veryrare_drops = treasures[2].split(",");
            var veryrare_chance = parseInt(treasures[4]);
            var rare_chance = parseInt(treasures[3]) + veryrare_chance;
            
            // Determine results
            var rarity_roll = lib.rand(1, 100);
            var rarity_text = "common";
            if(rarity_roll <= veryrare_chance){
                var drop_pool = veryrare_drops;
                rarity_text = "very rare";
            }else if(rarity_roll <= rare_chance){
                var drop_pool = rare_drops;
                rarity_text = "rare";
            }else{
                var drop_pool = common_drops;
            }
            var drop_roll = lib.rand(0, drop_pool.length - 1);
            var item_key = drop_pool[drop_roll];
            var item = items[item_key].split("|");
            
            // Save item to treasure inventory
            var prev = lib.readFile(dir + "/treasure.txt");
            var prev_text = "";
            if(prev !== ""){
                var prev_item = items[prev].split("|");
                var prev_name = prev_item[0];
                prev_text = " - It replaced your " + prev_name;
            }
            lib.saveFile(dir + "/treasure.txt", item_key);
            
            // Save new timestamp
            lib.saveFile(dir + "/cooldown.txt", current_sec);
            
            // Output
            message.reply({ content: "@ __**" + username + "**__, you got: " + icon_array[item[12]] + "**" + item[0] + "** (" + rarity_text + " treasure)" + prev_text, allowedMentions: { repliedUser: false }});
            
        }else{
            var time_left = lib.secondsToTime(cooldown - current_sec + last_sec);
            message.reply({ content: "@ __**" + username + "**__ \u274C You have to wait **" + time_left + "** before you can get another reward!", allowedMentions: { repliedUser: false }});
        }
        
	},
};