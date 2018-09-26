var express = require("express");
var router = express.Router();
var PB = require("../models/problems");
var CJ = require("../models/codejudge");
var request = require('request');
var User = require("../models/user");
var userId;
var solvedIds;

router.get("/problems", function (req, res) {
    console.log(req.user);
    userId = req.user._id;
    User.findOne({ _id: userId }, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            console.log("solveids filling");
            solvedIds = foundUser.solved;
        }
    });
    PB.find({}, function (err, problems) {
        if (err) {
            console.log("Error");
        }
        else {
            problems.forEach(function (problem) {
                solvedIds.find(function (element) {
                    
                    if(element.toString() == problem._id) {
                        problem.isSolved = 1;
                    }
                });
            });
            res.render("problems", { problems: problems });
        }
    });
});

router.get("/problems/new", function (req, res) {
    res.render("new");
});

router.get("/problems/:id", function (req, res) {


    PB.findById(req.params.id, function (err, foundProblem) {
        if (err) {
            res.redirect("/problems");
        }
        else {
            res.render("show", { source: "", stdin: "", output: "Your Output", problem: foundProblem });
        }
    });

});

router.get("/problems/:id/ide", function (req, res) {


    PB.findById(req.params.id, function (err, foundProblem) {
        if (err) {
            res.redirect("/problems");
        }
        else {

            res.render("compile", { source: "", output: "Your Output", problem: foundProblem });
        }
    });



});

router.post("/problems/:id/ide", function (req, res) {


    PB.findById(req.params.id, function (err, problem) {
        if (err) {
            res.redirect("/problems");
        }
        else {
            var script = req.body.sourceCode.toString('utf-8');
            var input = problem.testcases.toString('utf-8').replace(/\r/g, "");
            var lang = req.body.lang;
            var serverOutput = problem.serverOutput.toString('utf-8').replace(/\r/g, "") + '\n';
            var userOutput;

            //var newCJ={source:script,stdin:input,lang:lang};
            //CJ.create(newCJ);
            console.log(serverOutput);

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
                    res.render("compile", { output: body['output'], source: script, lang: lang, problem: problem });

                    userOutput = body['output'];

                    var newCJ = { problemID: problem._id, source: script, stdin: input, lang: lang, userOutput: userOutput, serverOutput: serverOutput };


                    if (userOutput.localeCompare(serverOutput) == 0) {
                        console.log("Correct");
                        CJ.create(newCJ);
                        User.findOne({ _id: userId }, function (err, foundUser) {
                            if (err) {
                                console.log(err);
                            } else {
                                //console.log(foundUser.solved);
                                problem.isSolved = 1;
                                //console.log(problem);
                                foundUser.solved.push(problem);
                                foundUser.save(function (err, data) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log(data);
                                    }
                                });
                            }
                        });
                    }
                    else {
                        console.log("Wrong");
                    }
                });



        }
    });

});

router.post("/problems", function (req, res) {


    PB.create(req.body.problem, function (err, newProblem) {
        if (err) {
            console.log("ERROR");
        }
        else {

            res.redirect("/problems");
        }
    });
});


module.exports = router;