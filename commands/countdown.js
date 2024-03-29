var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'countdown',
	usages: [''],
	descriptions: ['Shows all configured countdowns'],
    shortDescription: 'Check countdowns for upcoming special events',
    weight: 80,
	aliases: ['cd'],
    category: 'variety',
	
	execute(message, user, args, prefix) {
	    fs = require('fs');
	    const lib = require("../library.js");
        
        // Set important variables
        var username = user.username;
        var dir = "userdata/" + user.id;
        
        // Get current time
        var d = new Date();
        var currentEpoch = Math.floor(d.getTime() / 1000);

        // Embed
        var outputEmbed = new Discord.EmbedBuilder()
        	.setColor('#0099ff')
        	.setTitle('Time left until...')

        // Function for determining the epoch of the next recurrence of a date
        function getNextAnniversaryEpoch(currentDate, day, month, setYear){
            var thisYearAnniversary = new Date(currentDate.getFullYear(), month - 1, day);
            if(thisYearAnniversary < currentDate){
                if(setYear != 'no'){
                    return (new Date(setYear, month - 1, day)).getTime() / 1000;
                }
                return (new Date(currentDate.getFullYear() + 1, month - 1, day)).getTime() / 1000;
            }else{
                return thisYearAnniversary.getTime() / 1000;
            }
        }
        
        // Set countdown goals
        var eventNames = ['Nyexbot anniversary'];
        var targetEpochs = [getNextAnniversaryEpoch(d, 1, 2, 'no')];

        // Add the stuff to the embed
        for(i = 0; i < eventNames.length; i++){
            var timeRemaining = targetEpochs[i] - currentEpoch;
            timeRemaining = lib.secondsToTime(timeRemaining);
            outputEmbed.addFields( { name: eventNames[i], value: timeRemaining, inline: false } );
        }
        
        // Output
        message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false } });
        
	},
};