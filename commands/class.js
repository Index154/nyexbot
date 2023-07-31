var { prefix } = require('../config.json');

module.exports = {
	name: 'class',
	usages: ['', '[class name]'],
	descriptions: ['Shows a list of available classes', 'Permanently chooses a class'],
    shortDescription: 'Choose a class (level 10 required)',
    weight: 25,
    addendum: [
        '- Can only be used after reaching level 10',
        '- Each class gives a different small benefit immediately after being chosen',
        '- Further benefits are unlocked upon reaching level 30 and 50',
        '- It\'s impossible to change your class after making your choice'
    ],
    category: 'misc',
	
	execute(message, user, args, prefix) {
	    var allArgs = args.join(" ");
        
        // Set important variables
        var username = user.username;
        var dir = "userdata/" + user.id;
        
        // If the user isn't registered yet, stop the command
        if(!fs.existsSync(dir)){
            message.reply({ content: "@ __**" + username + "**__ \u274C Use `" + prefix + "encounter` first to create an account!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // If the user hasn't reached level 10 yet or has already chosen a class, stop the command
        var user_stats = lib.readFile(dir + "/stats.txt").split("|");
        if(parseInt(user_stats[10]) < 10){
            message.reply({ content: "@ __**" + username + "**__ \u274C You must be at least **level 10** to choose a class!\nYour current level is " + user_stats[10], allowedMentions: { repliedUser: false }});
            return;
        }
        if(user_stats[0] != "Classless"){
            message.reply({ content: "@ __**" + username + "**__ \u274C You have already chosen a class!", allowedMentions: { repliedUser: false }});
            return;
        }
        
        // If the user didn't give an input, list the available classes. Otherwise attempt to match the input to a class
        if(allArgs === ""){
            // Create select menu
            const row = new ActionRowBuilder()
			.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(user.id + '|class')
					.setPlaceholder('Carefully select a class')
					.addOptions([
					    {
							label: 'Warrior',
							description: 'Better fights and more rare monsters',
							value: 'warrior',
						},
						{
							label: 'Thief',
							description: 'Better fights and more item drops',
							value: 'thief',
						},
						{
							label: 'Tamer',
							description: 'Better capturing and more shinies',
							value: 'tamer',
						},
						{
							label: 'Alchemist',
							description: 'Better consumables',
							value: 'alchemist',
						},
						{
							label: 'Merchant',
							description: 'More Gold and better shops',
							value: 'merchant',
						},
						{
							label: 'Craftsman',
							description: 'Better crafting and more Scrap',
							value: 'craftsman',
						}
					]),
			);
			
            // Output
            message.reply({ content: "__You may choose from the following classes__\n- **Warrior**: A powerful fighter who enjoys battling tough monsters. High level warriors can greatly overwhelm weaker enemies\n- **Thief**: A dextrous hunter who is also good at snatching valuables. High level thieves are nearly unbeatable when fighting weaker monsters\n- **Tamer**: The tamer prefers capturing monsters, especially rare ones. A high level tamer can surpass the normal limits when it comes to capturing\n- **Alchemist**: A class with a focus on increased item efficiency. Can even sometimes use items without consuming them at higher levels\n- **Merchant**: Merchants are talented at getting Gold from their opponents. At higher levels they get additional benefits at the shop\n- **Craftsman**: Creative and nimble, this class can sometimes use crafting ingredients more than once and also has a knack for recycling\nUse `" + prefix + "class [class name]` or the menu below to make your choice!", components: [row], allowedMentions: { repliedUser: false }});
        }else{
            // Check if the user's input was valid
            allArgs = allArgs.toLowerCase();
            if(allArgs == "alchemist" || allArgs == "warrior" || allArgs == "thief" || allArgs == "tamer" || allArgs == "merchant" || allArgs == "craftsman"){
                // Set class starting ability description and give the user stats if necessary
                if(allArgs == "warrior"){
                    var ability = "**[Power]** - Increased attack!";
                    user_stats[1] = parseInt(user_stats[1]) + 7;
                }
                else if(allArgs == "thief"){
                    var ability = "**[Agility]** - Increased Speed!";
                    user_stats[2] = parseInt(user_stats[2]) + 7;
                }
                else if(allArgs == "tamer"){
                    var ability = "**[Taming]** - Increased Mana!";
                    user_stats[3] = parseInt(user_stats[3]) + 7;
                }
                else if(allArgs == "merchant"){
                    var ability = "**[Goldfinger]** - You get more Gold from monsters!";
                }
                else if(allArgs == "craftsman"){
                    var ability = "**[Basic Craftsmanship]** - Sometimes crafting does not consume resources!";
                }
                else if(allArgs == "alchemist"){
                    var ability = "**[Basic Alchemy]** - Sometimes item buffs last longer than normal!";
                }

                // Set the user's class
                user_stats[0] = allArgs.charAt(0).toUpperCase() + allArgs.slice(1);
                
                // Save to file and output
                lib.saveFile(dir + "/stats.txt", user_stats.join("|"));
                message.reply({ content: "@ __**" + username + "**__, you have chosen **" + user_stats[0] + "** as your class!\nYour starting ability is: " + ability + "\nReach higher levels to gain more abilities!", allowedMentions: { repliedUser: false }});
                
            }else{
                // Input seems to be invalid
                message.reply({ content: "\u274C That is not a valid selection!\nPlease type out the whole class name!", allowedMentions: { repliedUser: false }});
                return;
            }
        }
        
	},
};