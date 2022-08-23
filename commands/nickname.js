var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'nickname',
	usages: ['', '[number]', '[word]', 'type1/type2/type3/type4', 'dailyart', 'truename'],
	descriptions: ['Generates a random weird nickname', 'Generates a specified amount of nicknames. The maximum is 20. This argument can also be used alongside the other arguments. It must always be in the first position', 'Generates a nickname containing the specified word. The world will be added to the pool of custom words and can then appear in all future results', 'Generate a nickname using a specific convention or word pool', 'Suggestes some options for an AI-generated artwork. Will only generate one unique result per day', 'Will generate a new random word that can be used as a name for something'],
    shortDescription: 'Generate random nicknames',
    weight: 20,
	aliases: ['nick'],
    category: 'variety',
    addendum: '\ntype1: Uses words from the Monster Hunter World guild card titles pool\ntype2: Uses a word from the "adjectives" pool\ntype3: Uses the naming convention "X of Y"\ntype4: Uses a custom word that was previously used by another user',

	execute(message, user, args) {
	    fs = require('fs');
	    const lib = require("../library.js");
        
        // Check if the server has a custom prefix and load it
        if(message.guild !== null){
            var serverID = message.guildId;
            if(fs.existsSync("./data/configs/" + serverID)){
                prefix = lib.readFile("./data/configs/" + serverID + "/prefix.txt");
            }
        }

        var allArgs = args.join(" ");
        var dailyFlag = false;

        // Repeatable function for performing the actual command
        var nickResult = generateNicks(allArgs);
        var output = nickResult[0];
        var dailyFlag = nickResult[1];
        function generateNicks(allArgs){

            args = allArgs.split(" ");

            // Set starting variables
            var words = lib.readFile("./data/imported/words.txt");
            var output = "";
            var type = "none";
            var count = 1;
            var trueNameFlag = false;
            
            // Get daily art if it exists
            if(lib.exists(args[0])){
                if(args[0] == "dailyart"){
                    args.splice(0, args.length);
                    
                    // If the daily art has already been generated, load it and stop early
                    var d = new Date();
                    var day = Math.floor(d.getTime() / 86400000);
                    var saved = lib.readFile("./data/imported/dailyart.txt").split("|");
                    if(parseInt(saved[0]) == day){
                        output = saved[1];
                        
                        // Define embed
                        var outputEmbed = new Discord.MessageEmbed()
                            .setColor("#0099ff")
                            .setTitle("Here you go:")
                            .setDescription(output)
                        
                        //Send output
                        message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false }});
                        return;
                    }
                    
                    var styles = ["Painting (Paul Cezanne)", "Painting (Claude Monet)", "Painting (Van Gogh)", "Painting (Huang Gongwang)", "Photorealistic (Unreal Engine)", "Pencil Sketch", "Black & White 3D", "Watercolor", "Japanese Art", "Acrylic Art", "Minimalistic Art", "Painting (Oil Painting)", "Hotpot Art 1", "Hotpot Art 2", "Hotpot Art 3", "Photorealistic (Volumetric Lighting)", "Photorealistic (Photo taken on an IPhone)", "Photorealistic (Photo taken with Fujifilm Superia)"];
                    var styleRand = lib.rand(0, styles.length - 1);
                    var chosenStyle = styles[styleRand];
                    dailyFlag = true;
                    output = "https://hotpot.ai/art-maker\n" + chosenStyle + "\n";
                }
            }

            // Get count argument if it exists
            if(lib.exists(args[0])){
                if(!isNaN(args[0])){
                    if(parseInt(args[0]) > 20 || parseInt(args[0]) < 1){
                        // Bad number
                        message.reply({ content: "\u274C You may only generate between 1 and 20 nicknames at a time!", allowedMentions: { repliedUser: false }});
                        return;
                    }
                    count = parseInt(args[0]);
                    args.splice(0, 1);
                }
            }
            
            // Get truename argument if it exists
            if(lib.exists(args[0])){
                args[0] = args[0].toLowerCase();
                if(args[0] == "truename"){
                    args.splice(0, args.length);
                    trueNameFlag = true;
                }
            }

            // Get type argument if it exists
            if(lib.exists(args[0])){
                args[0] = args[0].toLowerCase();
                if(args[0] == "type1" || args[0] == "type2" || args[0] == "type3" || args[0] == "type4"){
                    type = args[0];
                    args.splice(0, 1);
                }
            }
            
            // Split word list
            var wordLists = words.split("\n#####################################################\n");
            var adjectives = wordLists[0].split(";;\n");
            var nouns = wordLists[1].split(";;\n");
            var mhwTitles = wordLists[2].split(";;\n");
            var userWords = wordLists[3].split(";;\n");
            
            // Go through a loop generating random nicknames
            for(i = 0; i < count; i++){

                var tempOutput = "";
                if(trueNameFlag){
                    // Generate a new random word
                    var consonants = ['w','r','t','z','p','s','d','f','g','h','j','k','l','y','x','c','v','b','n','m'];
                    var vowels = ['e','u','i','o','a'];
                    var previousChar = "r";     // Set this to r to avoid errors and to allow all starting chars
                    var wordLength = lib.rand(3, 4);
                    for(x = 0; x < wordLength; x++){
                        if(lib.rand(0, 1) === 1){
                            var newChar = getNextChar(consonants, previousChar);
                            tempOutput += newChar;
                            previousChar = newChar;

                            newChar = getNextChar(vowels, previousChar);
                            tempOutput += newChar;
                            previousChar = newChar;
                        }
                        else{
                            var newChar = getNextChar(vowels, previousChar);
                            tempOutput += newChar;
                            previousChar = newChar;

                            newChar = getNextChar(consonants, previousChar);
                            tempOutput += newChar;
                            previousChar = newChar;
                        }
                    }
                    // Function for rerolling characters if they are not allowed
                    function getNextChar(array, prevChar) {
                        var forbiddenCombos = {
                            w: ['w', 'h', 'v'],
                            r: ['?'],
                            t: ['w', 'd', 'x'],
                            z: ['w', 's', 'f', 'h', 'j', 'x'],
                            p: ['w', 'x', 'b'],
                            s: ['w', 'z', 'x'],
                            d: ['t', 'x'],
                            f: ['w', 'h', 'x', 'v'],
                            g: ['k', 'x'],
                            h: ['h'],
                            j: ['w', 't', 'z', 'p', 's', 'd', 'f', 'g', 'j', 'k', 'l', 'x', 'c', 'v', 'b'],
                            k: ['g', 'x', 'c'],
                            l: ['w', 'h', 'x'],
                            y: ['y', 'j'],
                            x: ['w', 'z', 's', 'f', 'g', 'h', 'j', 'k', 'v'],
                            c: ['g', 'k', 'x'],
                            v: ['w', 'z', 'f', 'h', 'x'],
                            b: ['p', 'h', 'x'],
                            n: ['h', 'x'],
                            m: ['h', 'x'],
                            e: ['?'],
                            u: ['?'],
                            i: ['w', 'i', 'y'],
                            o: ['?'],
                            a: ['?']
                        };
                        var result = array[lib.rand(0, array.length - 1)];
                        while(forbiddenCombos[prevChar].includes(result)){
                            result = array[lib.rand(0, array.length - 1)];
                        }
                        return result;
                    }

                    tempOutput = tempOutput.charAt(0).toUpperCase() + tempOutput.slice(1);
                }else{
                    // Set starting variables
                    var modifier = " ";
                    var bonus = "";
                    var randNum = lib.rand(1, 100);
                    // If the user included one of the keywords, set the word pool for every loop
                    if(type == "type1"){
                        randNum = 6;
                    }else if(type == "type2"){
                        randNum = 66;
                    }else if(type == "type3"){
                        randNum = 61;
                    }else if(type == "type4"){
                        randNum = 1;
                    }
                    
                    // Determine result
                    if(randNum >= 50){
                        if(randNum >=65){
                            var chosenList = adjectives;
                        }else{
                            var chosenList = nouns;
                            modifier = " of ";
                            bonus = "(s)";
                        }
                    }else{
                        if(randNum <= 5){
                            var chosenList = userWords;
                        }else{
                            var chosenList = mhwTitles;
                        }
                    }
                    
                    // Finalize
                    var selectedWord = chosenList[lib.rand(0, chosenList.length - 1)];
                    var selectedWord2 = nouns[lib.rand(0, nouns.length - 1)];
                    // Replace one of the words in the output with the user's input. Also save the user's input to the special word list if it is new
                    if(lib.exists(args[0])){
                        args[0] = args[0].toLowerCase().replaceAll(/_/g, " ");
                        args[0] = args[0].charAt(0).toUpperCase() + args[0].slice(1);
                        var replaceRand = lib.rand(1, 2);
                        if(replaceRand == 1){
                            selectedWord = args[0];
                        }else{
                            selectedWord2 = args[0];
                        }
                        
                        if(!userWords.includes(args[0])){
                            lib.saveFile("./data/imported/words.txt", words + ";;\n" + args[0]);
                        }
                    }
                    tempOutput = selectedWord + modifier + selectedWord2 + bonus;
                }

                // Add it to the final output
                if(i > 0){
                    output = output + "\n";
                }
                output = output + tempOutput;
                
            }

            return [output, dailyFlag];
        };
        
        // Daily condition
        if(dailyFlag){
            // Save daily
            lib.saveFile("./data/imported/dailyart.txt", day + "|" + output);

            // Define embed
            var outputEmbed = new Discord.MessageEmbed()
                .setColor("#0099ff")
                .setTitle("Here you go:")
                .setDescription(output)
            
            //Send output
            message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false }});
        }else{
            // Make reroll button
            var button = new MessageButton()
                .setCustomId("nickbutton")
                .setLabel('Reroll')
                .setStyle('PRIMARY');

            // Build rerollable output
            nickButtonReply(message, output, [button], allArgs);
        }

        async function nickButtonReply(message, content, buttons, allArgs){
            const row = new MessageActionRow().addComponents(buttons);
            var outputEmbed = new Discord.MessageEmbed()
                .setColor("#0099ff")
                .setTitle("Here you go:")
                .setDescription(content);

            const newMessage = await message.reply({
                embeds: [outputEmbed],
                components: [row],
                allowedMentions: { repliedUser: false },
                fetchReply: true,
            });
    
            const filter = (i) =>
                i.member.user.id === message.member.user.id &&
                i.customId === buttons[0].customId;
    
            const collector = await newMessage.createMessageComponentCollector({
                filter,
                time: 20000,
            });
    
            collector.on("collect", async (i) => {
                outputEmbed = new Discord.MessageEmbed()
                    .setColor("#0099ff")
                    .setTitle("Here you go:")
                    .setDescription(generateNicks(allArgs)[0]);

                await i.deferUpdate();
                await i.editReply({
                    embeds: [outputEmbed]
                });
                collector.resetTimer();
            });
    
            collector.on("end", () => {
                for(y = 0; y < buttons.length; y++){
                    buttons[y].setDisabled(true);
                }
                var disabledRow = new MessageActionRow().addComponents(buttons);
                newMessage.edit({
                    components: [disabledRow]
                });
            });
    
        };

	}
};