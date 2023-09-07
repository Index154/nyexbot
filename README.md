# Nyexbot
A Discord bot project for Linux using Javascript and SQL. Still mostly unfinished and unoptimized.

A just-for-fun project based around three main commands: Encounter, fight and capture. You can use these commands to find random monsters of varying rarities and to interact with them, collecting them and their item drops. I've built a plethora of other commands around these three which provide goals and additional activities to the users. Things like consumable items, a shop, special zones with unique monsters, shiny hunting, quests which make you hunt for specific monsters, crafting, daily quests, trophies, trading and much more.

I also added some unrelated commands that I came up with to this bot. These include an Elden Ring random message generator, databases for quotes, images and videos, a random nickname generator and other random stuff.

This was my first step into Javascript, Node.js, npm, SQL and more. It's actually also the first Linux server I ever set up aside from simple school projects. Because of this there is definitely a lot of room for improvement and a bunch of bad practices at play. But I try my best!


## Installation guide
This guide is currently lacking in details. I will improve it later.
- Create a new bot using the Discord developer portal and obtain the token for it (the exact settings to use on the portal will be added here later)
- Download the files from this project and save them in a directory of your choosing. Doesn't really matter where as long as it's secure
- Install node.js and npm
- Install MYSQL and set up a user 'root' for the database. Generate a secure password for it
- Run the command 'npm install' in the bot's source directory to install all the required packages
- Hash the SQL user's password using the npm package 'crypto'
- Rename the file config_example.json to config.json and edit the values within
- Run the command 'pm2 start app.js --name "app"' to start the bot. You can use the other functions of pm2 to automatically start the bot when the server starts as well as for logging