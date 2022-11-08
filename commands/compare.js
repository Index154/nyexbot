var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'compare',
	usages: ['', '[Item name]'],
	descriptions: ['Compares your equipment to the most recently discovered equipment item of the same type', 'Compares your equipment to one matching the searched name'],
    shortDescription: 'Compare equipment item stats',
    weight: 25,
	aliases: ['comp'],
	category: 'info',
	
	execute(message, user, args) {
        var allArgs = args.join(" ");
        
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
        
        // Fetch equip prompt
        var new_equip_key = lib.readFile(dir + "/new_equip.txt");
        var noButtons = false;
		
		// Fetch modifiers
		var newModifier = lib.readFile(dir + "/new_modifier.txt");
		if(!lib.exists(newModifier)){newModifier = "|0|0|0|0|0|0";}
		newModifier = newModifier.split("|");
		var oldModifiers = lib.readFile(dir + "/equip_modifiers.txt").split("\n");
        
        // Only run the command if there is an active prompt or it has been called with an argument
        var item_list = lib.readFile("data/items.txt").split(";\n");
		if(lib.exists(allArgs)){
			// Find all equipment items matching the search argument
			noButtons = true;
			allArgs = allArgs.toLowerCase();
			var results = [];
			for(i = 0; i < item_list.length; i++){
				if(item_list[i].includes("|Weapon|") || item_list[i].includes("|Tool|") || item_list[i].includes("|Defense|")){
					var itemName = item_list[i].split("|")[0].toLowerCase();
					if(itemName.includes(allArgs)){
						results.push(i);
					}
				}
			}
			if(results.length < 1){
				// No items found!
				message.reply({ content: "@ __**" + username + "**__ \u274C No equipment item matching your input was found!", allowedMentions: { repliedUser: false }});
				return;
			}
			
			new_equip_key = results[lib.rand(0, results.length - 1)];
			newModifier = "|0|0|0|0|0|0".split("|");
			
		}else if(!lib.exists(new_equip_key)){
			message.reply({ content: "@ __**" + username + "**__ \u274C There is no equipment item to compare!\nTry again after obtaining one or include the name of one after the command name", allowedMentions: { repliedUser: false }});
			return;
		}
        
        // Get data of new equipment item
        var new_item = item_list[new_equip_key];
        var new_item_data = new_item.split("|");
        
        // Get current equipment item based on the type of the new one
        var equipment = lib.readFile(dir + "/equipment.txt").split(",");
		var modifier = "";
        if(new_item_data[10] == "Weapon"){
            var item = equipment[0].split("|");
			modifier = oldModifiers[0].split("|");
            var key = 0;
        }
        else if(new_item_data[10] == "Defense"){
            var item = equipment[1].split("|");
			modifier = oldModifiers[1].split("|");
            var key = 1;
        }
        else{
            var item = equipment[2].split("|");
			modifier = oldModifiers[2].split("|");
            var key = 2;
        }
        var item_data = item_list[item].split("|");
        
        // Compare item stats between the two items
        var attack_dif = parseInt(new_item_data[1]) - parseInt(item_data[1]) - parseInt(modifier[1]) + parseInt(newModifier[1]);
        var speed_dif = parseInt(new_item_data[2]) - parseInt(item_data[2]) - parseInt(modifier[2]) + parseInt(newModifier[2]);
        var cap_dif = parseInt(new_item_data[3]) - parseInt(item_data[3]) - parseInt(modifier[3]) + parseInt(newModifier[3]);
        var mluck_dif = parseInt(new_item_data[4]) - parseInt(item_data[4]) - parseInt(modifier[4]) + parseInt(newModifier[4]);
        var iluck_dif = parseInt(new_item_data[5]) - parseInt(item_data[5]) - parseInt(modifier[5]) + parseInt(newModifier[5]);
        var gluck_dif = parseInt(new_item_data[6]) - parseInt(item_data[6]) - parseInt(modifier[6]) + parseInt(newModifier[6]);
        var stat_diffs = [0, attack_dif, speed_dif, cap_dif, mluck_dif, iluck_dif, gluck_dif];

        // Differentiate between item types and send an embed
		var stat_names = ["Filler", "Attack/Defense", "Speed", "Capture Efficiency", "Monster Luck", "Item Luck", "Greater Item Luck", "Unnamed"];
		// Create output embed
		var outputEmbed = new Discord.MessageEmbed()
            	.setColor('#0099ff')
            	.setTitle("@ __**" + username + "**__, comparing your [" + modifier[0] + item_data[0] + "] with [" + newModifier[0] + new_item_data[0] + "]")
		
		// Create stat comparison field
		stat_comparison = "```diff";
		for(y = 1; y < 7; y++){
			// Add stat differences if they exist
			if(stat_diffs[y] !== 0 || parseInt(newModifier[y]) !== 0){
				if(newModifier[y] > 0){newModifier[y] = "+" + newModifier[y];}
				var plus_extra = "";
				if(stat_diffs[y] >= 0){plus_extra = "+";}
				if(parseInt(newModifier[y]) === 0){
					stat_comparison = stat_comparison + "\n" + stat_names[y] + ":\n" + plus_extra + stat_diffs[y];
				}else{
					stat_comparison = stat_comparison + "\n" + stat_names[y] + ":\n" + plus_extra + stat_diffs[y] + " (New modifier: " + newModifier[y] + ")";
				}
			}
		}

		// Add ability if it is different
		var abilityRaw = lib.readFile(dir + "/ability.txt").split("|");
        item_data[11] = abilityRaw[key];
		if(new_item_data[11] != item_data[11]){
		    var abilityTitles = ["Ability", "Ability Modifier", "Ability Activation"];
		    // Get new and old ability names
		    var abilities = lib.readFile("data/abilities.txt").split("######################################\n");
		    var abilityNames = abilities[key].split(";\n");
		    var abilityTitle = abilityTitles[key];
		    var oldAbility = abilityNames[parseInt(item_data[11])];
		    var newAbility = abilityNames[parseInt(new_item_data[11])];
		    if(parseInt(oldAbility) === 0){oldAbility = "None";}
		    if(parseInt(newAbility) === 0){newAbility = "None";}
		    stat_comparison = stat_comparison + "\n" + abilityTitle + ":\n" + oldAbility + " => " + newAbility;
		}
		stat_comparison = stat_comparison + "```";

		// Fix for same stats comparison
		if(stat_comparison == "```diff```"){stat_comparison = "There are no differences! You should convert this item";}
		
		// Finalize embed
	    outputEmbed
        	.addFields(
        		{ name: 'Type', value: item_data[10] },
        		{ name: 'Stat comparison: ', value: stat_comparison }
        	);
		
		if(!noButtons){
		    // Extra footer
		    outputEmbed
		        .setFooter({ text: "Do " + prefix + "equip to replace your " + item_data[0] + " with the " + new_item_data[0] + "!" });
		    
		    // Create buttons
    		var button1 = new MessageButton()
    			.setCustomId(user.id + "|equip")
    			.setLabel('Equip')
    			.setStyle('SUCCESS')
    		var button2 = new MessageButton()
    			.setCustomId(user.id + "|equip convert")
    			.setLabel('Convert')
    			.setStyle('DANGER')
    		var row = new MessageActionRow().addComponents([button1, button2]);
    		
    		// Button output
    		message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false }, components: [row]});
		}else{
		    // Output
		    message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false }});
		}
        
	},
};