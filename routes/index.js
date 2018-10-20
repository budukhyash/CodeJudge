var express = require("express");
var router = express.Router();

var expressValidator = require("express-validator");
var passport = require("passport");

var bcrypt = require("bcrypt");
const saltRounds = 10;

var flash = require("connect-flash");
var request = require("request");
var db = require("../db");

router.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    //res.locals.info = req.flash("info");
    next();
});

//Routes

router.get("/", function (req, res) {
    res.render("home");
});

router.get("/login", function (req, res) {
    res.render("login");
});

router.get("/register", function (req, res) {
    res.render("register", { errors: [] });
});

router.get("/profile", authenticationMiddleware(), function (req, res) {
    
    db.query("SELECT solved from users where id=?", [req.user.id], function (err, results, fields) {
        if (err) throw err;

        var solveStr = results[0].solved.toString();
        var solvedIds = [];
        var solved = [];
        
        solveStr.split(/\s*,\s*/).forEach(function (prob_id) {
            if (prob_id != "") solvedIds.push(Number(prob_id));
        });
        console.log(solvedIds);

        db.query("SELECT title from problems where id IN (?)", [solvedIds], function (err, results, fields) {
            if (err) throw err;
            //console.log(results);
            results.forEach(function(prob) {
                solved.push(prob.title);
            });
            console.log(solved);
            res.render("profile", { user: req.user, solved: solved });
        });
    });

});

router.get("/ide", function (req, res) {
    res.render("landing", { source: "", stdin: "", output: "Your Output", currentUser: req.user });
});

router.post("/ide", function (req, res) {
    var script = req.body.source.toString('utf-8');
    var input = req.body.stdin.toString('utf-8');
    var lang = req.body.lang;
    var program = {
        script: script,
        language: lang,
        stdin: input,
        versionIndex: "0",
        clientId: "33809dd2322fdf4fe0a32d68ae55975a",
        clientSecret: "ad9f356e9677d18dab8a2d42828589f82af16bca3ad86ccfd7d5eacb812f8fdc"
    };
    request({
        url: 'https://api.jdoodle.com/execute',
        method: "POST",
        json: program
    },
        function (error, response, body) {
            res.render("landing", { output: body['output'], source: script, stdin: input, lang: lang, currentUser: req.user });
        });
});

router.post("/register", function (req, res) {

    req.checkBody('username', "Username cannot be empty").notEmpty();
    req.checkBody('username', "Username must be between 4-15 characters long").len(4, 15);
    const errors = req.validationErrors();
    if (errors) {
        console.log(JSON.stringify(errors));
        res.render('register', { errors: errors });
    } else {

        var username = req.body.username;
        var spassword = req.body.spassword;
        var cpassword = req.body.cpassword;

        if (spassword == cpassword) {

            const db = require('../db');

            bcrypt.hash(cpassword, saltRounds, function (err, hash) {
                db.query("INSERT INTO users (username, password, solved) VALUES (?,?,?)", [username, hash, ""], function (err, result, fields) {
                    if (err) throw err;
                    console.log("User inserted");

                    db.query("SELECT LAST_INSERT_ID() as user_id", function (err, results, fields) {
                        if (err) throw err;
                        const user_id = results[0];
                        console.log(user_id);
                        req.login(user_id, function (err) {
                            if (err) throw err;
                            console.log(JSON.stringify(user_id));
                            console.log(req.user);
                            console.log(req.isAuthenticated());
                            res.redirect("/");
                        });
                    });
                });
            });
        } else {
            req.flash("error", "Passwords do not match");
            res.redirect("/register");
        }
    }
});

router.post("/login", passport.authenticate('local', {
    successRedirect: '/problems',
    failureRedirect: '/login'
}));

router.get("/logout", function (req, res) {
    req.logout();
    req.flash("success", "Logged Out!");
    //req.session.destroy();
    res.redirect("/");
});

passport.serializeUser(function (user_id, done) {
    done(null, user_id);
});

passport.deserializeUser(function (user_id, done) {
    done(null, user_id);
});

function authenticationMiddleware() {
    return (req, res, next) => {
        console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);
        if (req.isAuthenticated()) {
            return next();
        }

        req.flash("error", "Please Login first");
        res.redirect('/login');
    }
}

module.exports = router;
