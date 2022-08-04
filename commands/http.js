var { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'http',
	usages: [''],
	descriptions: ['Posts a random HTTP status code with a corresponding cat or dog image'],
	
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

        // Pick between dogs and cats
        var randy = lib.rand(0, 1);
        var codes = [];
        var url = "";
        if(randy === 1){
            // Cat codes
            codes = [100, 101, 102, 200, 201, 202, 203, 204, 206, 207, 300, 301, 302, 303, 304, 305, 307, 308, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 420, 421, 422, 423, 424, 425, 426, 429, 431, 444, 450, 451, 497, 498, 499, 500, 501, 502, 503, 504, 506, 507, 508, 509, 510, 511, 521, 523, 525, 599];
            url = "https://http.cat/";
        }else{
            // Dog codes
            codes = [100, 200, 201, 202, 203, 204, 206, 207, 208, 226, 300, 301, 302, 303, 304, 305, 306, 307, 308, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 416, 417, 418, 420, 422, 423, 424, 425, 426, 429, 431, 444, 450, 451, 494, 500, 501, 502, 503, 504, 506, 507, 508, 509, 510];
            url = "https://httpstatusdogs.com/";
        }

        // Pick a code and make a link
        var result = url + codes[lib.rand(0, codes.length - 1)];

        // Send result
        message.reply({ content: result, allowedMentions: { repliedUser: false }});

	},
};