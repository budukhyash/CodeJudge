var express = require("express");
var router = express.Router();

var expressValidator = require("express-validator");
var passport = require("passport");
var db = require("../db");
var request = require("request");

router.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    //res.locals.info = req.flash("info");
    next();
});

router.get("/problems", authenticationMiddleware(), function (req, res) {

    var problems;
    db.query("SELECT * from problems", function (err, results, fields) {
        if (err) throw err;
        console.log(results);
        problems = results;

        db.query("SELECT solved from users WHERE id=?", [req.user.id], function (err, results, fields) {
            if (err) throw err;
            var solveStr = results[0].solved.toString();
            var solvedIds = [];

            solveStr.split(/\s*,\s*/).forEach(function (prob_id) {
                if(prob_id!="") solvedIds.push(Number(prob_id));
            });

            console.log(solvedIds);
            res.render("problems", {problems: problems, solvedIds: solvedIds});
        });

    });

});

router.get("/problems/new", authenticationMiddleware(), function (req, res) {
    res.render("new");
});

router.get("/problems/:id", function (req, res) {
    db.query("SELECT * from problems WHERE id=?", [req.params.id], function (err, foundProb) {
        if (err) {
            res.redirect("/problems");
        }
        else {
            //console.log(foundProb);
            res.render("show", { problem: foundProb[0] });
        }
    });
});

router.get("/problems/:id/ide", function (req, res) {
    db.query("SELECT * from problems WHERE id=?", [req.params.id], function (err, foundProb) {
        if (err) {
            res.redirect("/problems");
        }
        else {
            //console.log(foundProb);
            res.render("compile", { output: "", source: "", lang: "", problem: foundProb[0] });
        }
    });
});

router.post("/problems", function (req, res) {
    var title = req.body.title;
    var statement = req.body.statement;
    var sampleInput = req.body.sampleInput;
    var sampleOutput = req.body.sampleOutput;
    var testcases = req.body.testcases;
    var serverOutput = req.body.serverOutput;
    db.query("INSERT into problems (title,statement,sampleInput,sampleOutput,testcases,serverOutput,userOutput,lang,sourceCode,isSolved) values(?,?,?,?,?,?,?,?,?,?)", [title, statement, sampleInput, sampleOutput, testcases, serverOutput, "", "", "", 0],
        function (err, results, fields) {
            if (err) throw err;
            console.log(results);
            res.redirect("/problems");
        });
});

router.post("/problems/:id/ide", function (req, res) {

    db.query("SELECT * from problems where id=?", [req.params.id], function (err, results, fields) {
        if (err) {
            res.redirect("/problems");
        }
        else {
            var problem = results[0];

            var script = req.body.sourceCode.toString('utf-8');
            var input = problem.testcases.toString('utf-8').replace(/\r/g, "");
            var lang = req.body.lang;
            var serverOutput = problem.serverOutput.toString('utf-8').replace(/\r/g, "") + '\n';
            var userOutput;

            // console.log(script);
            // console.log(lang);

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
            }, function (error, response, body) {

                res.render("compile", { output: body['output'], source: script, lang: lang, problem: problem });
                userOutput = body['output'];

                if (userOutput.toString() == serverOutput.toString()) {
                    console.log("Correct");

                    db.query("UPDATE users SET solved = if(solved is null, '', concat(solved, '?,')) where id=?", [problem.id, req.user.id], function (err, results, fields) {
                        if (err) throw err;

                    });

                }
                else {
                    console.log("Wrong");

                }
            });
        }
    });
});

// Update and delete

router.get("/problems/:id/edit", function (req, res) {
    db.query("SELECT * from problems where id=?", [req.params.id], function (err, results, fields) {
        if (err) throw err;
        res.render("edit", { problem: results[0] });
    });
});

router.post("/problems/:id/edit", function (req, res) {
    var title = req.body.title;
    var statement = req.body.statement;
    var sampleInput = req.body.sampleInput;
    var sampleOutput = req.body.sampleOutput;
    var testcases = req.body.testcases;
    var serverOutput = req.body.serverOutput;
    db.query("UPDATE problems SET title=?, statement=?, sampleInput=?, sampleOutput=?, testcases=?, serverOutput=? where id=?", [title, statement, sampleInput, sampleOutput, testcases, serverOutput, req.params.id],
        function (err, results, fields) {
            if (err) throw err;
            console.log("Updated");
            res.redirect("/problems");
        });
});

router.post("/problem/:id", function (req, res) {
    db.query("DELETE from problems where id=?", [req.params.id], function (err, results, fields) {
        if (err) throw err;
        console.log("Deleted");
        res.redirect("/problems");
    });
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