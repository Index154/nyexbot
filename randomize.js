fs = require('fs');
lib = require("./library.js");

// Randomize the monsters
    var monsters = lib.readFile("./data/monsters/monsters.txt");
    var monsterGroups = monsters.split("#################################################################################\n");
    
    // Loop through every group and modify it
    for(i = 0; i < monsterGroups.length; i++){
        var monsterList = monsterGroups[i].split(";\n");
        
        // Prepare attribute collections
        var names = [];
        var images = [];
        for(y = 0; y < monsterList.length - 1; y++){
            // Extract all attributes from this rank's monsters
            var monsterData = monsterList[y].split("|");
            names.push(monsterData[0]);
            images.push(monsterData[5]);
        }
        
        // Randomly generate each monster anew using the extracted attributes
        for(z = 0; z < monsterList.length - 1; z++){
            var monsterData = monsterList[z].split("|");
            var nameLength = lib.rand(0, 1);
            if(nameLength === 1){
                // Pick 3 names and combine them
                var name1 = names[lib.rand(0, names.length - 1)];
                var name2 = names[lib.rand(0, names.length - 1)];
                var name3 = names[lib.rand(0, names.length - 1)];
                var newName = name1.substring(0, name1.length / 3) + name2.substring(name2.length, name2.length / 3) + name3.substring(name3.length, name3.length / 3);
                monsterData[0] = newName;
            }else{
                // Pick 2 names and combine them
                var name1 = names[lib.rand(0, names.length - 1)];
                var name2 = names[lib.rand(0, names.length - 1)];
                var newName = name1.substring(0, name1.length / 2) + name2.substring(name2.length, name2.length / 2);
                monsterData[0] = newName;
            }
            
            // Pick random image
            var newImg = images[lib.rand(0, images.length - 1)];
            monsterData[5] = newImg;
            
            // Finalize monster
            monsterList[z] = monsterData.join("|");
        }
        
        // Finalize rank
        monsterGroups[i] = monsterList.join(";\n");
    }
    
    // Save new monster list
    lib.saveFile("./data/monsters/monsters_alt.txt", monsterGroups.join("#################################################################################\n"));

// Randomize the drop pools
    //var drops = lib.readFile("./data/drops.txt");
    

// Randomize items
    //var items = lib.readFile("./data/items.txt");
    

console.log("Done!");