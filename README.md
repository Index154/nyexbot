# Nyexbot
A Discord bot project for Linux using Javascript and SQL. Still mostly unfinished and unoptimized.

A just-for-fun project based around three main commands: Encounter, fight and capture. You can use these commands to find random monsters of varying rarities and to interact with them, collecting them and their item drops. I've built a plethora of other commands around these three which provide goals and additional activities to the users. Things like consumable items, a shop, special zones with unique monsters, shiny hunting, quests which make you hunt for specific monsters, crafting, daily quests, trophies, trading and much more.

I also added some unrelated commands that I came up with to this bot. These include an Elden Ring random message generator, databases for quotes, images and videos, a random nickname generator and other random stuff.

This was my first step into Javascript, Node.js, npm, SQL and more. It's actually also the first Linux server I ever set up aside from simple school projects. Because of this there is definitely a lot of room for improvement and a bunch of bad practices at play. There are a lot of things I need to fix but progress is fairly slow.

The folder info/nyex-plans contains lists of changes and features I want to work on some day.


## NO Installation guide
### WARNING: Currently the bot can't really be cloned / installed since the way I arranged the file structure for it is very messed up. Necessary files will be missing if you clone the repo. I will improve this later rather than listing all the missing files here... Below is my draft for a future installation guide

In theory the installation would go a little like this:
- Create a new bot using the Discord developer portal and obtain the token for it (the exact settings to use on the portal will be added here later)
- Clone this repo with `git clone https://github.com/Index154/nyexbot.git`
- Install node.js and npm
- Install MYSQL and set up a user 'root' for the database. Generate a secure password for it
- Run the command `npm install` in the bot's source directory to install all the required packages
- Hash the SQL user's password using the npm package 'crypto' (details about this are to be added later)
- Rename the file config_example.json to config.json and edit the values within
- Run the command `sudo pm2 start app.js --name "app"` to start the bot. You can use the other functions of pm2 to make it so the bot automatically starts when the server restarts. It can also be used for checking the error logs and such

After I'm done migrating most of the data contained in the bot's files into the database I plan on adding a script for setting up the database automatically.
