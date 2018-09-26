var express = require("express")
var router = express.Router();
var PB = require("../models/problems");
var CJ = require("../models/codejudge");
var passport = require("passport");
var User = require("../models/user");
var request = require('request');
var username;

//=======================
// Generic Routes
//=======================

router.get("/", function (req, res) {
    res.render("home");
});


router.get("/ide",isLoggedIn,function (req, res) {

    res.render("landing", { source: "", stdin: "", output: "Your Output" });
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
            res.render("landing", { output: body['output'], source: script, stdin: input, lang: lang });

        });

});



//======================
//Authentication routes
//======================

router.get("/register", function (req, res) {
    res.render("register");
});

router.post("/register", function (req, res) {

    User.register(new User({ username: req.body.username }), req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            return res.render('register');
        }
        passport.authenticate("local")(req, res, function () {
            res.redirect("/problems");
        });
    });

});

router.get("/login", function (req, res) {
    res.render("login");
    username = req.body.username;
    console.log(username);
});

router.post("/login", passport.authenticate("local", {

    successRedirect: "/problems",
    failureRedirect: "/login"

}), function (req, res) {
        // username = req.body.username;
        // console.log("Hello world");
    });

router.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

function isLoggedIn(req, res, next) {
    console.log(req);
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("login");
}

module.exports = router;