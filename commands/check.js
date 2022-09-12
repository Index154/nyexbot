var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'check',
	usages: [''],
	descriptions: ['Displays information about the currently encountered monster'],
    shortDescription: 'Inspect an encountered monster',
    weight: 30,
    category: 'info',
	
	execute(message, user, args) {
	    adc = require('adc.js');
        
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
        
        // Check if the command was used through a button
        var buttonCheck = false;
        if(message.type == "MESSAGE_COMPONENT"){
            buttonCheck = true;
        }
        
        // Fetch current encounter info
        monster_keys = lib.readFile(dir + "/current_encounter.txt");
        // Only run the command if there is an active encounter or if it was triggered through a button
        if(monster_keys === "" && !buttonCheck){
            message.reply({ content: "@ __**" + username + "**__ \u274C There is no active encounter to check!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        if(buttonCheck){
            monster_keys = args[0];
        }
        var monster_keys_array = monster_keys.split(",");
        
        // Get embed color
        var embed_colors = ["#b0b0b0", "#0099ff", "#2AA189", "#b80909", "#e3b712", "#e39f0e"];
        var embed_color = embed_colors[monster_keys_array[0]];
        
        // Get the monster's stats and name
		if(monster_keys_array[2] == "1"){
		    // If the monster is shiny, get the shiny entry instead
			var shiny_groups = lib.readFile("data/monsters/monsters_shiny.txt").split("#################################################################################\n");
			var shinies = shiny_groups[monster_keys_array[0]].split(";\n");
			var monster_data = shinies[monster_keys_array[1]].split("|");
			embed_color = "#8f1ee6";
		}else{
		    var monster_groups = lib.readFile("data/monsters/monsters.txt").split("#################################################################################\n");
		    if(lib.readFile(dir + "/monster_mode.txt") == "funny"){monster_groups = lib.readFile("data/monsters/monsters_alt.txt").split("#################################################################################\n");}
            var monsters = monster_groups[monster_keys_array[0]].split(";\n");
            var monster_data = monsters[monster_keys_array[1]].split("|");
		}
        
        // Minor grammatical check
        var n_extra = lib.nCheck(monster_data[0]);
        
        // Get rarity
        var rarity_names = ["D", "C", "B", "A", "S", "SS"];
        var rarity = rarity_names[monster_keys_array[0]];
        if(monster_keys_array[2] == "1"){
            rarity = rarity + "++";
        }
        
		// Assemble a basic embed for the output
		if(monster_data[3].includes(",")){
		    var types = monster_data[3].split(",");
		    type = types.join(", ");
		}else{
		    type = monster_data[3];
		}
		
        outputEmbed = new Discord.MessageEmbed()
        	.setColor(embed_color)
        	.setTitle(monster_data[0])
        	.setImage("https://cdn.discordapp.com/attachments/731848120539021323/" + monster_data[5]) //Alternative source (server): 'https://indexnight.com/monsters/' + monster_data[0].toLowerCase().replace(/ /g, "_") + ".png"
        	.setDescription(monster_data[4])
        	.addFields(
        		{ name: 'Attack', value: monster_data[1], inline: true },
        		{ name: 'Speed', value: monster_data[2], inline: true },
        		{ name: "Rank", value: rarity, inline: true},
        		{ name: 'Type', value: type, inline: true }
        	)
		
		// Add release blessing type
		var buff_names = ["Filler", "Attack", "Speed", "Capture Efficiency", "Monster Luck", "Item Luck", "Greater Item Luck"];
		var blessing_keys = monster_data[6].split(",");
		var blessing_type = buff_names[blessing_keys[0]];
		outputEmbed
		    .addFields( { name: "Release Blessing", value: blessing_type, inline: true } );
		
		// Get item drops and add them
		if(monster_keys_array[2] == "1"){
		    // Shiny drop item
		    var drop_pool = ["106"];
		}else{
		    var drop_pool_groups = lib.readFile("data/drops.txt").split("#######################\n");
		    var drop_pools = drop_pool_groups[monster_keys_array[0]].split(";\n");
		    var drop_pool = drop_pools[monster_keys_array[1]].split("|");
		}
		var items = lib.readFile("data/items.txt").split(";\n");
		// If there is only one drop, create the array differently
		if (drop_pool[0].includes(",")) {
            var drops_array = drop_pool[0].split(",");
            var drop_chances = drop_pool[1].split(",");
        }else{
            var drops_array = [drop_pool[0]];
            var drop_chances = [drop_pool[1]];
        }

        var drops = "";
        for(x = 0; x < drops_array.length; x++){
            var item_key = parseInt(drops_array[x]);
            var item_data = items[item_key].split("|");
            if(x > 0){
                drops = drops + "\n";
            }
            drops = drops + item_data[0] + ": " + drop_chances[x] + "%";
        }
        
        outputEmbed
            .addFields( { name: "Drops (with base drop rates)", value: drops, inline: true } );
            
		// Get captured count
		var captures_array = lib.readFile(dir + "/captures.txt").split(";");
		var capture_count = lib.countInArray(monster_keys, captures_array);
		outputEmbed
            .setFooter({ text: username + "'s capture count: " + capture_count});
		
		// Output
		message.reply({ content: "@ __**" + username + "**__", embeds: [outputEmbed], allowedMentions: { repliedUser: false }});
	},
};