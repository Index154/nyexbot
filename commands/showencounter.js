var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'showencounter',
	usages: [''],
	descriptions: ['Displays your current encounter again'],
    shortDescription: 'See your current encounter',
    weight: 35,
	aliases: ['showenc','senc'],
    category: 'info',
	
	execute(message, user, args) {
        
        // Check if the server has a custom prefix and load it
        if(message.guild !== null){
            var serverID = message.guildId;
            if(fs.existsSync("./data/configs/" + serverID)){
                prefix = lib.readFile("./data/configs/" + serverID + "/prefix.txt");
            }
        }
        
        // Set important variables
        var dir = "userdata/" + user.id;
        
        // If the user isn't registered yet, stop the command
        if(!fs.existsSync(dir)){
            message.reply({ content: "\u274C Use `" + prefix + "encounter` first to create an account!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // Fetch current encounter info
        var monster_keys = lib.readFile(dir + "/current_encounter.txt");
        // Only run the command if there is an active encounter
        if(monster_keys === ""){
            message.reply({ content: "\u274C There is no active encounter to display!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // Get the monster's stats and name with shiny modifier
        var monster_groups = lib.readFile("data/monsters/monsters.txt").split("#################################################################################\n");
        if(lib.readFile(dir + "/monster_mode.txt") == "funny"){monster_groups = lib.readFile("data/monsters/monsters_alt.txt").split("#################################################################################\n");}
        var monster_keys_array = monster_keys.split(",");
        var monsters = monster_groups[monster_keys_array[0]].split(";\n");
        var monster_id = monster_keys_array[1];
        var monster_data = monsters[monster_id].split("|");
        var shiny = "";
        var shiny_extra = "";
        monster_name = monster_data[0];
        
        var color_modifiers = ["\n", "fix\n", "hy\n", "dust\n{ ", "1c\n~ ", "1c\n~ "];
        var color_mod = color_modifiers[monster_keys_array[0]];
        
        // Check if the user has the monster in their captures
        var captures = lib.readFile(dir + "/all_captures.txt");
        var capped = "";
        if(captures.includes(monster_keys)){
            capped = "  ( \uD83D\uDCBC )";
        }
        
        // Get rarity
        var rarity_names = ["Rank D", "Rank C", "Rank B", "Rank A", "Rank S", "Rank SS"];
        var rarity = rarity_names[monster_keys_array[0]];
        
        // Shiny check
        if(monster_keys_array[2] == "1"){
            rarity = rarity + "++";
            color_mod = "ruby\n";
            
            var shinies = lib.readFile("data/monsters/monsters_shiny.txt");
			var shiny_groups = shinies.split("#################################################################################\n");
			var shinies_array = shiny_groups[monster_keys_array[0]].split(";\n");
			monster_data = shinies_array[monster_keys_array[1]].split("|");
			
			shiny_extra = "\u2728";
            monster_name = "Shiny " + monster_name;
        }
        
        // Minor grammatical check
        var n_extra = " ";
        var first_letter = monster_name.substring(0, 1);
        if(first_letter == "A" || first_letter == "E" || first_letter == "I" || first_letter == "O" || first_letter == "U"){
            n_extra = "n ";
        }
        
        // Build buttons
		var button1 = new MessageButton()
			.setCustomId("any|capture")
			.setLabel('Capture')
			.setStyle('PRIMARY')
		var button2 = new MessageButton()
			.setCustomId("any|fight")
			.setLabel('Fight')
			.setStyle('PRIMARY')
		var button3 = new MessageButton()
			.setCustomId("any|encounter")
			.setLabel('New encounter')
			.setStyle('DANGER')
		var button4 = new MessageButton()
		    .setCustomId("any|check " + monster_keys)
			.setLabel('Check')
			.setStyle('SECONDARY')
		var row = new MessageActionRow().addComponents([button1, button2, button3, button4]);
        
        // Output embed
        var outputEmbed = new Discord.MessageEmbed()
        	.setColor('#0099ff')
        	.setTitle("Here is your current encounter again:")
        	.setThumbnail("https://cdn.discordapp.com/attachments/731848120539021323/" + monster_data[5]) //Alternative source (server): "https://indexnight.com/monsters/" + monster_name.toLowerCase().replace(/ /g, "_") + ".png"
        	.setDescription("```" + color_mod + "A" + n_extra + shiny_extra + monster_name + shiny_extra + " (" + rarity + ") appeared!" + capped + "```");
        message.reply({ embeds: [outputEmbed], components: [row], allowedMentions: { repliedUser: false }});
        
	},
};