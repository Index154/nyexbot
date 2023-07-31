var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'pokegory',
	usages: ['', '[guess]'],
	descriptions: ['Starts a minigame where you\'re tasked with guessing a Pokemon based on a given category', 'Submits a guess for the current game'],
    shortDescription: 'Category-based Pokemon quiz',
    weight: 10,
	aliases: ['pg'],
    category: 'minigames',
	
	execute(message, user, args, prefix) {
	    fs = require('fs');
	    const lib = require("../library.js");
        
        // Set important variables
        var username = user.username;
        var dir = "userdata/" + user.id;

        // Prepare input argument
        var input = args.join(" ");
        
        if(!lib.exists(lib.readFile("./data/imported/pokeprompt.txt"))){
            // Start a new prompt since there is no active one

            // Pick a category
            var categories = lib.readFile("./data/imported/pokegories.txt").split("\n");
            var categoryNum = lib.rand(0, categories.length - 1);
            var category = categories[categoryNum];

            // Check how many solutions there are
            var solutionCount = lib.readFile("./data/imported/pokesolutions.txt").split("\n")[categoryNum].split(" & ").length;

            // Send result and save
            message.reply({ content: "Try to guess a Pokemon from this category: ```\nThe " + category + " Pokemon\n(Number of answers: " + solutionCount + ")```", allowedMentions: { repliedUser: false }});
            lib.saveFile("./data/imported/pokeprompt.txt", categoryNum + 1);
            return;

        }else{
            // Fetch current prompt and solutions again
            var categoryNum = parseInt(lib.readFile("./data/imported/pokeprompt.txt")) - 1;
            var category = lib.readFile("./data/imported/pokegories.txt").split("\n")[categoryNum];
            var solutions = lib.readFile("./data/imported/pokesolutions.txt").split("\n")[categoryNum].split(" & ");

            if(!lib.exists(input)){
                // There was no input

                // Send prompt again
                message.reply({ content: "Try to guess a Pokemon from this category: ```\nThe " + category + " Pokemon\n(Number of answers: " + solutions.length + ")```Do `" + prefix + "pg [your guess]`", allowedMentions: { repliedUser: false }});
                return;
            }else{
                // There was input!

                // Get solutions and compare them to the input to check for any matches
                var correct = false;
                for(i = 0; i < solutions.length && !correct; i++){
                    if(input.toLowerCase() == solutions[i].toLowerCase()){correct = true;}
                }

                // Get remaining number of guess attempt
                var attempts = parseInt(lib.readFile("./data/imported/pokeattempts.txt"));

                // Time for results
                if(correct){
                    // It was correct

                    // Send winning message and give reward if possible
                    if(fs.existsSync(dir)){
                        // The user has an account
                        // Grant Gold to the user based on how early they got the solution
                        var gold = attempts * 10;
                        var stats = lib.readFile(dir + "/stats.txt").split("|");
                        stats[12] = gold + parseInt(stats[12]);
                        lib.saveFile(dir + "/stats.txt", stats.join("|"));
                        message.reply({ content: "**" + username + "** got it! You've received " + gold + " Gold! The full solution was: ```\n" + solutions.join(", ") + "```", allowedMentions: { repliedUser: false }});
                    }else{
                        // The user does not have an account
                        message.reply({ content: "**" + username + "** got it! The full solution was: ```\n" + solutions.join(", ") + "```", allowedMentions: { repliedUser: false }});
                    }

                    // Reset stuff to default
                    lib.saveFile("./data/imported/pokeattempts.txt", 3);
                    lib.saveFile("./data/imported/pokeprompt.txt", "");
                    return;
                }
                
                // The input was wrong

                // Reduce the number of remaining guesses
                attempts = attempts - 1;

                if(attempts < 1){
                    // There are no more guesses remaining

                    // Send solutions
                    message.reply({ content: "That is incorrect! **You ran out of guesses!**\nThe full solution was: ```\n" + solutions.join(", ") + "```", allowedMentions: { repliedUser: false }});

                    // Reset stuff to default
                    lib.saveFile("./data/imported/pokeattempts.txt", 3);
                    lib.saveFile("./data/imported/pokeprompt.txt", "");
                    return;
                }
                lib.saveFile("./data/imported/pokeattempts.txt", attempts);

                // Determine a hint to send
                var hint = solutions[lib.rand(0, solutions.length - 1)];
                switch(attempts){
                    case 2:
                        // First mistake. Give short hint
                        hint = hint.substring(0, 2);
                        break;

                    case 1:
                        // Second mistake. Give slightly longer hint
                        hint = hint.substring(0, 3);
                        break;

                    default:
                        break;
                }

                // Output for incorrect guess (but prompt is still active)
                message.reply({ content: "That is incorrect! ```\nRemaining guesses: " + attempts + "``` __Hint:__ One answer starts with \"**" + hint + "**\"", allowedMentions: { repliedUser: false }});
                return;
            }
        }

	},
};