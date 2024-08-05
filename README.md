##  Coursework Submission ##
### CM2040 Database Networks and the Web ###

#### Installation requirements ####

* NodeJS 
    - follow the install instructions at https://nodejs.org/en/
    - we recommend using the latest LTS version
* Sqlite3 
    - follow the instructions at https://www.tutorialspoint.com/sqlite/sqlite_installation.htm 
    - Note that the latest versions of the Mac OS and Linux come with SQLite pre-installed

#### Using this project ####

This template sets you off in the right direction for my project run. To get started:

* Run ```npm install``` from the project directory to install all the node packages.

* Run ```npm run build-db``` to create the database on Mac or Linux 
or run ```npm run build-db-win``` to create the database on Windows

* Run ```npm run start``` to start serving the web app (Access via http://localhost:3000)

Test the app by browsing to the following routes:

* http://localhost:3000
* http://localhost:3000/about
* http://localhost:3000/login

You can also run: 
```npm run clean-db``` to delete the database on Mac or Linux before rebuilding it for a fresh start
```npm run clean-db-win``` to delete the database on Windows before rebuilding it for a fresh start


##### Creating database tables #####

* All database tables are created by modifying the db_schema.sql 
* This allows you to review and recreate my database simply by running ```npm run build-db```


Edit this README.md to explain any specific instructions for setting up or using your application that you want to bring to our attention:

* remove the existing contents that we have provided - removed
* include any settings that should be adjusted in configuration files - no additional settings need to be adjusted
* include a list of the additional libraries you are using:

	- express-session
	- bcrypt

* anything else we need to know in order to successfully run your app
	- to access the author's page, you need to login first. There is only one registered user in the database and for that user the credentials are: nikolina (username and password). I used bcrypt library for password encryption so the hashed version is saved in the database.



