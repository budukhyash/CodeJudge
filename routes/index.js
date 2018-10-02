var express = require("express");
var router = express.Router();
var PB = require("../models/problems");
var CJ = require("../models/codejudge");
var passport = require("passport");
var User = require("../models/user");
var request = require('request');
var middleware = require("../middleware");
var username;


router.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    res.locals.info = req.flash("info");
    next();
});

//=======================
// Generic Routes
//=======================

router.get("/", function (req, res) {
    req.flash("info", "Welcome");
    res.render("home", { currentUser: req.user });
});

router.get("/ide", middleware.isLoggedIn, function (req, res) {
    res.render("landing", { source: "", stdin: "", output: "Your Output", currentUser: req.user });
});

router.get("/profile", middleware.isLoggedIn, function(req, res) {

    User.findOne({username: req.user.username}).populate("solved").exec(function(err, user) {
        if(err) {
            console.log(err);
        } else {
            res.render("profile", {user: user});
        }
    }); 
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

//======================
//Authentication routes
//======================

router.get("/register", function (req, res) {
    res.render("register");
});

router.post("/register", function (req, res) {
    var username = req.body.username.toString();
    var password = req.body.password.toString();
    var regEx = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;

    if(password.length > 6 && regEx.test(password)) {
        console.log("correct");
        User.register(new User({ username: req.body.username }), req.body.password, function (err, user) {
            if (err) {
                req.flash("error", err);
                return res.render('register');
            }
            passport.authenticate("local")(req, res, function () {
                req.flash("success", "Welcome "+req.user);
                res.redirect("/problems");
            });
        });
    } else {
        console.log("wrong");
        req.flash("error", "Password must min 6 characters long and must contain atleast one number and one special character");
        // res.send("Password must min 6 characters long and must contain atleast one number and one special character");
        res.redirect("/register");
    }

});

router.get("/login", function (req, res) {
    res.render("login");
});

router.post("/login", passport.authenticate("local", {

    successRedirect: "problems",
    failureRedirect: "login"
})
    , function (req, res) {
        req.flash("error", "Wrong Password!!!");
    });

router.get("/logout", function (req, res) {
    req.logout();
    req.flash("success", "Logged Out!");
    res.redirect("/");
});

module.exports = router; 
