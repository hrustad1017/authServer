var express = require('express'),
    path = require('path'),
    // cookieParser = require('cookie-parser'),
    cors = require('cors'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    redis   = require('redis'),
    redisClient = redis.createClient(),
    redisStore  = require('connect-redis')(session);
    ejs = require('ejs'),
    dotenv = require('dotenv').config();

// add a redis store for storing sessions

var app = express();
app.use(cors());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

redisClient.on('error', (err) => {
    console.log('Redis error: ' + err);
});

let sessionOptions = {
    secret: '5316186740001017',
    name: '_redisTest',
    username: '',
    cookie: {
        secure: false,
        maxAge: 269999999999
    },
    saveUninitialized: true,
    resave: false,
    store: new redisStore({ host: 'localhost', port: 6379, client: redisClient, ttl: 86400})
}
app.use(session(sessionOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
// app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

require('./routes/index.js')(app);

// app.use(function(req, res, next) {
    // var err = new Error('Not Found');
    // err.status = 404;
    // next(err);
// });

var server = app.listen(3000, function() {
    console.log("auth server listening on port " + server.address().port);
});

module.exports = app;