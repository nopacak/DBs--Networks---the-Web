/**
* index.js
* This is your main app entry point
*/

// Set up express, bodyparser and EJS
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
var bodyParser = require("body-parser");
app.set('view engine', 'ejs'); // set the app to use ejs for rendering
app.use(express.static(path.join(__dirname + '/public'))); // set location of static files
app.use(bodyParser.urlencoded({ extended: true }));

// Set up SQLite
// Items in the global namespace are accessible throught out the node application
const sqlite3 = require('sqlite3').verbose();
global.db = new sqlite3.Database('./database.db',function(err){
    if(err){
        console.error("Error opening databae: ", err.message);
        process.exit(1); // bail out we can't connect to the DB
    } else {
        console.log("Database connected");
        global.db.run("PRAGMA foreign_keys=ON", function(err){
            if(err){
                console.log("Error enabling foreign key support: ", err.message);
            } else{
                console.log("Foreign key support enabled");
            }
        }); // tell SQLite to pay attention to foreign key constraints
    }
});



// Add all the route handlers in usersRoutes to the app under the path /users 
const usersRoutes = require('./routes/users');
app.use('/', usersRoutes);


// Make the web application listen for HTTP requests
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

