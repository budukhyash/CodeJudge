var express = require("express");
var app = express();
var mysql = require('mysql');
var passport = require("passport");
var request = require('request');
var bodyParser = require('body-parser');
var cookieParser = require("cookie-parser");
var connection = require('./db');
var flash = require("connect-flash");
var expressValidator = require("express-validator");

var authRoutes = require("./routes/index");
var probRoutes = require("./routes/problems");

var session = require("express-session");
var LocalStrategy = require("passport-local").Strategy;
var MySQLStore = require("express-mysql-session")(session);
var bcrypt = require("bcrypt");

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(cookieParser());
app.use(flash());

var options = {
    host: "localhost",
    user: "root",
    password: "hrishi137",
    database: "cj"
};

var sessionStore = new MySQLStore(options);

app.use(session({
    secret: 'helloworld',
    resave: false,
    saveUninitialized: false,
    store: sessionStore
    //cookie: {secure: true}
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(authRoutes);
app.use(probRoutes);

app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    //res.locals.info = req.flash("info");
    next();
});


passport.use(new LocalStrategy(
    function (username, password, done) {
        console.log(username);
        console.log(password);
        const db = require("./db");

        db.query("SELECT id, username, password FROM users WHERE username = ?", [username], function(err, results, fields) {
            if(err) {
                done(err);
            }

            if(results.length==0) {
                done(null, false);
            }
            const hash = results[0].password.toString();
            console.log(hash);
            bcrypt.compare(password, hash, function(err, response) {
                if(response) {
                    currentUser = username;
                    return done(null, {id: results[0].id, username: results[0].username, solved: results[0].solved});
                } else {
                    return done(null, false);
                }
            });
        });
    }
));

app.listen(3000, function () {
    console.log("Server started");
});
