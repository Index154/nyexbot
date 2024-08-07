var { prefix } = require('../config.json');

module.exports = {
	name: 'equip',
	usages: ['', 'convert'],
	descriptions: ['Equips a discovered equipment item', 'Converts a discovered equipment item into Scrap'],
    shortDescription: 'Equip a newly obtained item',
    weight: 20,
    addendum: [
        '- Equippable items directly alter your base stats',
        '- Only the most recently discovered item can be equipped or converted',
        '- Equipment of higher rank gives more Scrap upon conversion',
        '- Your current equipment can be viewed with `{prefix}inventory`',
        '- There are three equipment slots: Weapon, defense and divine tool',
        '- Weapons and defense equipment mainly alter your Attack and Speed while divine tools are a good source of Mana',
        '- Equipped items can sometimes be upgraded using `{prefix}craft` (see `{prefix}recipes`)',
        '- Equipment items are sometimes generated with random bonus stats (name modifiers)',
        '\n**Here is some further information about equipment items**',
        '- Your equipment items may grant you a combined ability with varying effects',
        '- The weapon determines the effect of the ability',
        '- Defensive equipment may buff or debuff the effects or the frequency of the ability. In other words it is a modifier',
        '- Your tool determines how/when the ability activates. It can be after a real time cooldown, after a set amount of encounters or based on random chance'
    ],
    category: 'items',
	
	execute(message, user, args, prefix) {
        
        // Set important variables
        var username = user.username;
        var dir = "userdata/" + user.id;
        
        // Fetch equip prompt
        var new_equip_key = lib.readFile(dir + "/new_equip.txt");
        // Only run the command if there is an active prompt
        if(new_equip_key === ""){
            message.reply({ content: "@ __**" + username + "**__ \u274C There is no item for you to equip!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // If the user included an argument, try to convert the equipment
        var stats = lib.readFile(dir + "/stats.txt").split("|");
        if(args.length >= 1){
            if(args[0] == "convert" || args[0] == "conv"){
                // Get item rank and determine Scrap value based on it
                var item_list = lib.readFile("data/items.txt").split(";\n");
                var equip_data = item_list[new_equip_key].split("|");
                var values = {E: 1, D: 4, C: 7, B: 14, A: 18, S: 25, SS: 32, Special: 30};
                var value = values[equip_data[12]];
                
                // If the user is a Craftsman, check for abilities
                if(stats[0] == "Craftsman"){
                    if(parseInt(stats[10]) >= 50){
                        value = Math.ceil(1.25 * value);
                    }else if(parseInt(stats[10]) >= 30){
                        value = Math.ceil(1.15 * value);
                    }
                }
                
                // Increase the user's Scrap count and remove the item from the equip queue
                var scrap = parseInt(lib.readFile(dir + "/scrap.txt"));
                scrap += value;
                lib.saveFile(dir + "/new_equip.txt", "");
                lib.saveFile(dir + "/scrap.txt", scrap);

                var output = "The item has been converted into **" + value + " Scrap**!";
                if(embedEditOutput()){return;}
                message.reply({ content: "@ __**" + username + "**__: " + output, allowedMentions: { repliedUser: false }});
            }else{
                message.reply({ content: "\u274C That is an unknown argument! Please try again", allowedMentions: { repliedUser: false }});
            }
            return;
        }
        
        // Load current equipment and replace the correct item with the new one
        var equipment = lib.readFile(dir + "/equipment.txt");
		var equipModifiers = lib.readFile(dir + "/equip_modifiers.txt").split("\n");
		var modifier = "";
		var newModifier = lib.readFile(dir + "/new_modifier.txt").split("|");
        var equipment_array = equipment.split(",");
        var item_list = lib.readFile("data/items.txt").split(";\n");
        // Get new item's type
        var new_item = item_list[new_equip_key];
        var new_item_data = new_item.split("|");
        var new_type = new_item_data[10];
        // Replace value in equipment array
        if(new_type == "Weapon"){
            var old_item_key = equipment_array[0];
			modifier = equipModifiers[0].split("|");
			equipModifiers[0] = newModifier.join("|");
            equipment_array[0] = new_equip_key;
            var key = 0;
        }else if(new_type == "Defense"){
            var old_item_key = equipment_array[1];
			modifier = equipModifiers[1].split("|");
			equipModifiers[1] = newModifier.join("|");
            equipment_array[1] = new_equip_key;
            var key = 1;
        }else{
            var old_item_key = equipment_array[2];
			modifier = equipModifiers[2].split("|");
			equipModifiers[2] = newModifier.join("|");
            equipment_array[2] = new_equip_key;
            var key = 2;
        }
        // Save the new equipment
        lib.saveFile(dir + "/equipment.txt", equipment_array.join(","));
		lib.saveFile(dir + "/equip_modifiers.txt", equipModifiers.join("\n"));
        
        // Recalculate the user's stats
        var old_item = item_list[old_item_key];
        var old_item_data = old_item.split("|");
        // Remove old item's values from the user's stats and add the new ones
        for(y = 1; y < 7; y++){
            var base = parseInt(stats[y]);
            var minus = parseInt(old_item_data[y]) + parseInt(modifier[y]);
            var plus = parseInt(new_item_data[y]) + parseInt(newModifier[y]);
            stats[y] = base - minus + plus;
        }
        
        // Save stats
        var new_stats = stats.join("|");
        lib.saveFile(dir + "/stats.txt", new_stats);
        
        // Overwrite ability and reset cooldown if an ability has changed
        var abilityRaw = lib.readFile(dir + "/ability.txt").split("|");
        old_item_data[11] = abilityRaw[key];
        if(new_item_data[11] != old_item_data[11]){
            abilityRaw[key] = new_item_data[11];
            // Update cooldown (evaluate if the old or new abilities apply for each type)
            var abilityList = lib.readFile("data/ability_conditions.txt").split("\n");
            var abilityVariants = abilityList[parseInt(abilityRaw[0])].split(";;");
            if(parseInt(abilityRaw[1]) < 3){var abilityVariant = abilityVariants[parseInt(abilityRaw[1])].split("|");}
            else{var abilityVariant = abilityVariants[0].split("|");}
            var abilityCondition = parseInt(abilityVariant[parseInt(abilityRaw[2])]);
            // Save to files
            var d = new Date();
            lib.saveFile(dir + "/ability_timestamp.txt", Math.floor(d.getTime() / 60000));
            lib.saveFile(dir + "/ability.txt", abilityRaw.join("|"));
            lib.saveFile(dir + "/ability_cd.txt", abilityCondition);
        }
        
        // Update equip prompt
        lib.saveFile(dir + "/new_equip.txt", "");
		lib.saveFile(dir + "/new_modifier.txt", "");

        // If the command was called using a special button then edit the original message instead of sending a new one
        output = "You equipped the **" + new_item_data[0] + "**, getting rid of your " + old_item_data[0] + "!";
        if(embedEditOutput()){return;}
        // Function for single message mode output so it can be used here and in the convert result
        function embedEditOutput(){
            if(lib.exists(message.message) && message.customId.includes("embedEdit")){
                var button = new ButtonBuilder()
                    .setCustomId(user.id + "|encounter|embedEdit")
                    .setLabel('-- New encounter --')
                    .setStyle(4)
                var row = new ActionRowBuilder().addComponents([button]);
    
                message.deferUpdate();
                delete message.message.embeds[0].data.fields;
                message.message.embeds[0].data.description = output;
                message.message.edit({ embeds: [message.message.embeds[0]], components: [row] });
                return true;
            }else{
                return false;
            }
        }

        message.reply({ content: "@ __**" + username + "**__: " + output, allowedMentions: { repliedUser: false }});
        
	},
};