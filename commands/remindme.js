const { resourceLimits } = require('worker_threads');
var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'remindme',
	usages: ['[DD.MM.YYYY] [HH:MM] to [Reminder text]', 'in [Custom time interval] to [Reminder text]', '', 'delete [Reminder ID]'],
	descriptions: [
        'Creates a reminder for the specified date and time in the UTC timezone',
        'Creates a reminder which will notify you after a specified duration from the current time',
        'Shows all your reminders, including their IDs',
        'Deletes the reminder with the given ID'
    ],
    shortDescription: 'Create custom reminders',
    weight: 45,
	aliases: ['re', 'rem', 'remind', 'reminders', 'timer', 'timers'],
	addendum: [
        '- Custom time interval examples: `yearly`, `7d`, `2 hours`, `daily`, `1h 30m`',
        '- When creating a reminder you may also add the following arguments after the reminder text to make it repeat:\n ` repeat [Custom time interval]`'
    ],
    category: 'variety',
	
	execute(message, user, args, prefix) {
	    fs = require('fs');
	    const lib = require("../library.js");
        
        // Get a list of the user's reminders if there are no arguments
        if(args.length < 1){
            async function getReminders(userID){
                
                // SQL query
                var [rows] = await con.execute({sql: `
                    SELECT reminderId, text, timestamp, repeating
                    FROM reminders
                    WHERE userId = '${userID}';
			    `, rowsAsArray: false });

                // Assemble a basic embed
        	    var outputEmbed = new Discord.EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle("Your active reminders");

                // Build list / formatting
                for(i = 0; i < rows.length; i++){
                    var repeatInfo = "";
                    if(rows[i].repeating != null){
                        repeatInfo = " - (Repeating every " + lib.secondsToTime(rows[i].repeating) + ")";
                    }
                    outputEmbed.addFields(
                        { name: "ID " + rows[i].reminderId + " - " + rows[i].text, value: "<t:" + rows[i].timestamp + ":d> <t:" + rows[i].timestamp + ":t> / <t:" + rows[i].timestamp + ":R>" + repeatInfo, inline: false }
                    );
                }

                // Output
                if(rows.length < 1){
                    outputEmbed.addFields(
                        { name: "You have no reminders!", value: "Too bad...", inline: false }
                    );
                }
                message.reply({ embeds: [outputEmbed], allowedMentions: { repliedUser: false }});

            }
            getReminders(user.id);
            return;
        }

        // If the first argument is "delete" then expect a number (reminder ID) and try to delete it from the database
        if(args[0] == "delete"){
            if(!lib.exists(args[1]) || args[1].replace(/[^0-9]/g, "") === "" ){
                // Second argument missing or bad
                return message.reply({ content: "\u274C Please include a valid reminder ID! You can check your active reminders with `" + prefix + "remindme`", allowedMentions: { repliedUser: false }});
            }

            async function deleteReminder(userID, reminderId){
                
                // SQL query
                var [rows] = await con.execute({sql: `
                    DELETE
                    FROM reminders
                    WHERE userId = '${userID}' AND reminderId = ${reminderId};
			    `, rowsAsArray: false });

                if(rows.affectedRows != 1){
                    // No results / too many results
                    message.reply({ content: "\u274C There are " + rows.affectedRows + " reminders matching this ID which belong to you", allowedMentions: { repliedUser: false }});
                }else{
                    // Success
                    message.reply({ content: "Successfully deleted reminder " + args[1] + "!", allowedMentions: { repliedUser: false }});
                }

            }
            deleteReminder(user.id, parseInt(args[1]));
            return;
        }

        // If the arguments contain the word "seconds" then tell the user that seconds are not supported
        var allArgs = args.join(" ");
        var secondsInfo = "";
        if(allArgs.toLowerCase().includes("seconds")){
            secondsInfo = "\nInfo: This command does not support time intervals more precise than minutes!";
        }

        // Check if there is a "repeat" keyword in the arguments. If it exists then check for a repeating interval after it
        // Examples: "repeat every 5 hours", "repeat yearly", "repeat daily", "repeat 8d 10m"
        var repeatingInterval = 0;
        var repeatingInfo = "";
        function intervalFromString(input, type){

            // Function for extracting a time interval from a string
            function checkTimeString(timeString){
                var reg = new RegExp("[0-9]+ " + timeString + "|[0-9]+" + timeString + "| " + timeString + "|^" + timeString, "g");
                var matches = input.match(reg);

                var result = 0;
                if(matches != null){
                    result = parseInt(matches[0]);
                    if(isNaN(result)){result = 1;}
                }
                return result;
            }

            // Check for time intervals for minutes, hours, days and years
            // Then add them together
            var minutes = checkTimeString("m");
            var hours = checkTimeString("h");
            var days = checkTimeString("d");
            var years = checkTimeString("y");
            var interval = ((((((years * 365) + days) * 24) + hours) * 60) + minutes) * 60;

            // If the time interval is an exact multiple of years then account for leap days! Do not do this for repeating intervals
            if(type != "repeat" && interval % 31536000 == 0){ interval = lib.correctLeapDays(interval); }
            return interval;

        }
        if(allArgs.toLowerCase().includes("repeat")){
            var repeatSplit = allArgs.split("repeat");
            repeatingInterval = intervalFromString(repeatSplit[repeatSplit.length - 1].toLowerCase(), "repeat");
            repeatSplit.splice(-1, 1);
            allArgs = repeatSplit.join("repeat");
            if(repeatingInterval != 0){
                repeatingInfo = " repeating every " + lib.secondsToTime(repeatingInterval);
            }
        }
        if(repeatingInterval == 0){repeatingInterval = null;}

        // If the arguments don't contain the word "to" then abort
        if(!allArgs.toLowerCase().includes(" to ")){
            return message.reply({ content: "\u274C Your command does not contain the string \" to \" (after the desired reminder time). This is required in order to distinguish the content of your reminder!", allowedMentions: { repliedUser: false }});
        }

        // Convert any other time definition in the arguments before the word "to" into a timestamp. Abort if nothing is found or if the timestamp is in the past
        var creationTime = Math.floor(message.createdTimestamp / 1000);
        var toSplit = allArgs.split(" to ");
        function timestampFromString(input, creationTime){
            
            var result = 0;
            var timestampInterval = intervalFromString(input, "reminder");
            if(timestampInterval > 0){
                // Found a simple time interval in the arguments. Add it to the current time to get the reminder timestamp
                result = creationTime + timestampInterval;

            }else{
                // Check for a date in the arguments. The fallback is the current day
                var reg = new RegExp("[0-9][0-9]\.[0-9][0-9]\.[0-9][0-9][0-9][0-9]", "g");
                var matches = input.match(reg);
                var today = new Date().toISOString().replace(/-/g, ".").split("T")[0];
                today = today.split(".");
                today = today[2] + "." + today[1] + "." + today[0];
                var date = today;
                if(matches != null){
                    date = matches[0];
                }

                // Check for a time in the arguments. The fallback is 00:00
                var reg = new RegExp("[0-9][0-9]:[0-9][0-9]", "g");
                var matches = input.match(reg);
                var time = "00:00";
                if(matches != null){
                    time = matches[0];
                }

                // Determine timestamp. If there were no matching inputs at all then return null (abort)
                if(date == today && time == "00:00"){
                    result = null;
                }else{
                    date = date.split(".");
                    result = Math.floor(Date.parse(date[2] + '-' + date[1] + '-' + date[0] + "T" + time + ":00.000Z") / 1000) + (new Date().getTimezoneOffset() * 60 * 2);
                }
                
            }
            return result;

        }
        var timestamp = timestampFromString(toSplit[0], creationTime);
        toSplit.splice(0, 1);
        var reminderText = toSplit.join(" to ").trim().replace(/'/g, "\\'");;
        if(timestamp == 0 || timestamp == null){
            return message.reply({ content: "\u274C Could not find a reminder time interval or date in your message! Check `" + prefix + "help remindme` for further information about this command", allowedMentions: { repliedUser: false }});
        }else if(timestamp <= Math.floor(new Date() / 1000)){
            return message.reply({ content: "\u274C You may only set reminders for the future!", allowedMentions: { repliedUser: false }});
        }

        // Save the reminder to the database
        async function saveReminder(channelID, userID, text, repeatingInterval, timestamp){

            var query = `
                INSERT INTO reminders
                (text, channelId, userId, timestamp) values
                ('${text}', '${channelID}', '${userID}', ${timestamp});
            `;

            if(repeatingInterval > 0){
                query = `
                    INSERT INTO reminders
                    (text, channelId, userId, timestamp, repeating) values
                    ('${text}', '${channelID}', '${userID}', ${timestamp}, ${repeatingInterval});
                `;
            }
            
            var [rows] = await con.execute({sql: query, rowsAsArray: false });
        }
        saveReminder(message.channelId, user.id, reminderText, repeatingInterval, timestamp);

        // Success output
        message.reply({ content: "Created a new reminder for <t:" + timestamp + ":d> <t:" + timestamp + ":t>" + repeatingInfo + secondsInfo, allowedMentions: { repliedUser: false }});

	},
};