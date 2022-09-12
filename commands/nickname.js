var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'nickname',
	usages: ['[number] type1/type2/type4 [custom word]/type4', 'dailyart', '[number] truename'],
	descriptions: ['Generates a random weird nickname.\nThe number argument is optional and specifies how many nicknames should be generated at once. The maximum is 20.\nIf you include a custom word then it will be used in the resulting nickname. Underscores will be converted into spaces. Additionally, the word will also be added to the pool of custom words and can then appear in all future results. You may also use one of the typeX arguments to make the bot only choose from specific word lists. See more info below.', 'Suggestes some options for an AI-generated artwork. Will only generate one unique result per day', 'Will generate a specified amount of new words (random combinations of letters)'],
    shortDescription: 'Generate random nicknames',
    weight: 20,
	aliases: ['nick'],
    category: 'variety',
    addendum: '\ntype1: Uses words from the Monster Hunter World guild card titles pool. Will only apply to the first part of the nick\ntype2: Uses a word from the "adjectives" pool. Will only apply to the first part of the nick\ntype4: Uses a custom word that was previously used by another user. Can be used twice in a row to apply to both parts of the nick',

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
        if(nickResult[0] == "error"){return;}
        var output = nickResult[0];
        var dailyFlag = nickResult[1];
        var d = new Date();
        var day = Math.floor(d.getTime() / 86400000);
        function generateNicks(allArgs){

            args = allArgs.split(" ");

            // Set starting variables
            var words = lib.readFile("./data/imported/words.txt");
            var output = "";
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
                        return ["error", "error"];
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
            
            // Split word list
            var wordLists = words.split("\n#####################################################\n");
            var adjectives = wordLists[0].split("\n");
            var nouns = wordLists[1].split("\n");
            var mhwTitles = wordLists[2].split("\n");
            var userWords = wordLists[3].split("\n");
            
            // Go through a loop generating random nicknames
            for(i = 0; i < count; i++){

                // Deconstruct a maximum of 2 args, preparing the word order
                var wordTypes = [];
                var customWord = "";
                var customWordUsed = false;
                var nextWordPosition = lib.rand(0, 1);

                // Evaluate type1 and type2 first
                if(args.includes("type1")){
                    wordTypes[0] = "type1";
                    args.splice(args.indexOf("type1"), 1);
                    nextWordPosition = 1;
                }
                if(args.includes("type2")){
                    wordTypes[0] = "type2";
                    args.splice(args.indexOf("type2"), 1);
                    nextWordPosition = 1;
                }

                for(p = 0; p < args.length && p < 2; p++){
                    args[p] = args[p].toLowerCase();

                    // Determine the position of the theoretical next word
                    var position = nextWordPosition;
                    if(position == 0){nextWordPosition = 1;}else
                    if(position == 1){nextWordPosition = 0;}

                    if(args[p] == "type4" || args[p] == "type3"){
                        wordTypes[position] = "type4";

                    }else if(!customWordUsed && args[p] != "type2" && args[p] != "type1" && lib.exists(args[p])){
                        wordTypes[position] = "customWord";

                        // Modify the custom word
                        args[p] = args[p].replaceAll(/_/g, " ");
                        customWord = args[p].charAt(0).toUpperCase() + args[p].slice(1);

                        // Save custom word if it is new
                        if(!userWords.includes(args[p])){
                            lib.saveFile("./data/imported/words.txt", words + "\n" + args[p]);
                        }
                        customWordUsed = true;
                    }
                }

                // Do the following twice (for both of the words) unless truenames are being generated
                var loopCount = 2;
                var tempOutput = "";
                if(trueNameFlag){loopCount = 1;}
                for(p = 0; p < loopCount; p++){
                   
                    if(trueNameFlag){
                        // Generate a new random word
                        var consonants = ['w','r','t','z','p','s','d','f','g','h','j','k','l','y','x','c','v','b','n','m'];
                        var vowels = ['e','u','i','o','a'];
                        var previousChar = "r";     // Set this to r to avoid errors and to allow all starting chars
                        var wordLength = lib.rand(3, 4);
                        var consonantStart = false;
                        for(x = 0; x < wordLength; x++){
                            // 50-50 chance to have only one character in the first segment
                            var odd = false;
                            if(x === 0){if(lib.rand(0, 1) === 1){odd = true;}}
                            if(lib.rand(0, 1) === 1 && !(consonantStart && x === 1)){
                                var newChar = getNextChar(consonants, previousChar);
                                tempOutput += newChar;
                                previousChar = newChar;
                                consonantStart = true;
        
                                if(!odd){
                                    newChar = getNextChar(vowels, previousChar);
                                    tempOutput += newChar;
                                    previousChar = newChar;
                                    consonantStart = false;
                                }
                            }
                            else{
                                var newChar = getNextChar(vowels, previousChar);
                                tempOutput += newChar;
                                previousChar = newChar;

                                if(!odd){
                                    newChar = getNextChar(consonants, previousChar);
                                    tempOutput += newChar;
                                    previousChar = newChar;
                                }
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
                        var randNum = lib.rand(1, 100);
                        // If the user included one of the keywords, set the word pool for every loop manually
                        if(wordTypes[p] == "type1" && p == 0){
                            randNum = 51;
                        }else if(wordTypes[p] == "type2" && p == 0){
                            randNum = 66;
                        }else if(wordTypes[p] == "type4"){
                            randNum = 1;
                        }else if(wordTypes[p] == "customWord"){
                            randNum = 0;
                        }else{

                        }
                        
                        // Determine result
                        if(randNum >= 50 && p == 1){
                            randNum = lib.rand(1, 49)
                        }
                        if(randNum >= 50 && p == 0){
                            if(randNum >=65){
                                var chosenList = adjectives;
                            }else{
                                var chosenList = mhwTitles;
                            }
                        }else{
                            if(randNum <= 5){
                                if(randNum == 0){
                                    var chosenList = [customWord];
                                }else{
                                    var chosenList = userWords;
                                }
                            }else{
                                var chosenList = nouns;
                            }
                        }

                        // Add this loop's word to the nick
                        var selectedWord = chosenList[lib.rand(0, chosenList.length - 1)];
                        if(p == 1){
                            tempOutput += " ";
                        }
                        tempOutput += selectedWord;
                        
                    }
                }

                // Add this loop's nick to the final output
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