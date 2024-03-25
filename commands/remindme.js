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
        '- Custom time interval examples: `1 year 2 months 1 week`, `7d`, `2 hours`, `1 day`, `1h 30m`',
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
                    // Shorten text
                    if(rows[i].text.length > 100){
                        rows[i].text = rows[i].text.slice(0, 100) + "..."
                    }

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
        let splitPoint = 0;
        function intervalFromString(input, type){

            // Function for extracting a time interval from a string
            function checkTimeString(timeStringList){
                var reg = new RegExp("([0-9]+(| )(" + timeStringList.join("|") + ")($| ))", "g");
                var matches = input.match(reg);

                var result = 0;
                if(matches != null){
                    result = parseInt(matches[0]);
                    if(isNaN(result)){result = 1;}

                    // Determine cut-off point for the reminder string
                    let finalMatchIndex = input.indexOf(matches[matches.length - 1]) + matches[matches.length - 1].length;
                    if(finalMatchIndex > splitPoint) splitPoint = finalMatchIndex;
                }
                return result;
            }

            // Check for time intervals in the message, then calculate the total
            var years = checkTimeString(["years", "year", "y"]);
            var months = checkTimeString(["months", "month", "mo"]);
            if(months >= 12){ years += Math.floor(months / 12); months = months % 12; }
            var weeks = checkTimeString(["weeks", "week", "w"]);
            var days = checkTimeString(["days", "day", "d"]);
            var hours = checkTimeString(["hours", "hour", "h"]);
            var minutes = checkTimeString(["minutes", "minute", "mins", "min", "m"]);
            var interval = ((((((years * 365) + (weeks * 7) + lib.monthsToDays(months) + days) * 24) + hours) * 60) + minutes) * 60;

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

        // Convert any other time definition in the arguments into a timestamp. Abort if nothing is found or if the timestamp is in the past
        var creationTime = Math.floor(message.createdTimestamp / 1000);
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
                    let finalMatchIndex = input.indexOf(matches[matches.length - 1]) + matches[matches.length - 1].length;
                    if(finalMatchIndex > splitPoint) splitPoint = finalMatchIndex;
                }

                // Check for a time in the arguments. The fallback is 00:00
                var reg = new RegExp("[0-9][0-9]:[0-9][0-9]", "g");
                var matches = input.match(reg);
                var time = "00:00";
                if(matches != null){
                    time = matches[0];
                    finalMatchIndex = input.indexOf(matches[matches.length - 1]) + matches[matches.length - 1].length;
                    if(finalMatchIndex > splitPoint) splitPoint = finalMatchIndex;
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
        var timestamp = timestampFromString(allArgs, creationTime);
        var reminderText = allArgs.slice(splitPoint).trim().replace(/'/g, "\\'");;
        if(timestamp == 0 || timestamp == null){
            return message.reply({ content: "\u274C Could not find a reminder time interval or date in your message! Check `" + prefix + "help remindme` for further information about this command", allowedMentions: { repliedUser: false }});
        }else if(timestamp <= Math.floor(new Date() / 1000)){
            return message.reply({ content: "\u274C You may only set reminders for the future!", allowedMentions: { repliedUser: false }});
        }

        // If the reminder text is too long then abort
        if(reminderText.length >= 650){
            return message.reply({ content: "\u274C The reminder text is too long. Please use less than 650 characters", allowedMentions: { repliedUser: false }});
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