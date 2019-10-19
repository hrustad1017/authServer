# authServer
a simple authentication server written in node js that has some similar functionality with SuperLogin. AuthServer handles your authentication enabling you to easily register new users, log them in, and log them out. AuthServer uses CouchDB for storing users and can be synced with a local PouchDB instance to also store whatever data you want and enable offline functionality. When a new user is registered a new database is created for them. Secondary users can also be created that will use the same database as a parent user so you can share your database. CouchDB also has fauxton which is a user interface for managing your CouchDB instance which comes in handy during development or if you are having issues. AuthServer uses redis to store the session information for all users and in this way allows multiple users to use authServer without overwriting other users' session data. AuthServer also has routes for handling emails like password reset and email confirmation links. You could utilize the same logic to send other emails for different purposes and I would be willing to add more kinds of email routes if anybody would like me to do so.

to use this authServer you must have nodejs and npm, and CouchDB and Redis instances to connect to either locally or in the cloud.

authServer needs to have better security if anyone is interested in helping with that as well as adding logging and analytics.

I will add further documentation soon.

REQUIREMENTS

nodejs (I use version 12.4.0)
npm (I use version 6.9.0)
couchDB
redis
sendGrid account or another email service that works with nodemailer

AUTHSERVER INSTALLATION INSTRUCTIONS

To use authServer click the green button on the right side of the page that says clone or download. Choose download zip then place the zipped folder in a directory of your choosing. Next, extract all files into a folder (I recommend naming the folder "server"). Open a command prompt or terminal and change working directory to the "server" folder with a command like: cd C:\Users\call4\server then use the command: npm install
Now all of the nodejs dependencies should be installed and you are ready to run the app with command: node app.js

COUCHDB INSTALLATION INSTRUCTIONS

Windows: go to https://couchdb.apache.org/ click on a download of your choice (though you should use the latest stable release) and follow the installer prompts

Linux: follow the instructions here: https://linuxize.com/post/how-to-install-couchdb-on-ubuntu-18-04/ and make sure to add your login credentials to the couchDB connection string

for more information on couchDB: https://couchdb.apache.org/

REDIS INSTALLATION INSTRUCTIONS

Windows: redis is cannot be easily installed on Windows like it can on Linux, so instead I am using Docker Desktop for Windows and an official redis container image. To do this first create an account at Docker Hub www.hub.docker.com then download Docker Desktop for Windows from Docker Hub. Then use command: docker pull redis  (this will grab the latest image) then use command: docker run -d --name <THENAMEYOUWANT> --publish 6379:6379 redis  (this command runs a detached container with the redis image you pulled, names the container what you want and maps port 6379 of the container to port 6379 of the host computer which is where authServer will be looking for the redis instance. when not in use just use command: docker stop <the name of the container>  and then to start use command: docker start <the name of the container> to delete the container stop it and use command: docker rm <the name of the container>
  
Linux: make sure your packages and computer are up to date with command: sudo apt-get update   and then: sudo apt-get upgrade  then install redis with command: sudo apt-get install redis-server
  
for more information on redis: https://redis.io/

NODEJS AND NPM INSTALLATION INSTRUCTIONS

Windows: go to https://nodejs.org/en/ pick a download and follow the installer prompts.

Linux: make sure your packages and computer are up to date with command: sudo apt-get update   and then: sudo apt-get upgrade then use command: sudo apt-get install nodejs  to install nodejs. then use command: sudo apt-get install npm  to install npm

for more information on nodejs and npm: https://nodejs.org/en/

SENDGRID INSTRUCTIONS

Go to https://sendgrid.com/ and register for an account. The username and password you choose will be the username and password you need to set for your sendGrid credentials in authServer

SUGGESTIONS

you should create a .env file in the "server" folder and add all of your credentials and connection strings to it so people won't see them in your source code especially in production. Thats what I do and you will notice variables like COUCHDBCONNECT in the code which are environment variables (it is best practice to name environent variables all caps). API Keys are also a good example of something that should be an environment variable. You should also have a .gitignore file in the same folder that tells git to ignore certain things on commits. The .env file is a good example of a file that should be listed in .git ignore. If anyone would like examples of either file I would be happy to include them.

AUTHSERVER USAGE

start authServer with command: node app.js
Connect to authServer on port 3000
if you are using authServer locally it will be http:localhost:3000 and if you are hosting it somewhere like example.com then the connection string would be http:example.com:3000 or if it you have just an IP like 196.96.0.1 then the connection string would be http:196.96.0.1:30000
To use authServer you just need to send requests to the routes that have been set up like /register to register a user. This means that you can have it connected to pretty much any kind of application or website as long as it can make http requests.

EXAMPLE REQUEST

The routes for authServer are located in routes/index.js and they can be modified for your usage or you can add more routes
