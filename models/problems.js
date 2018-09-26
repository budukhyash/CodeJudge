/*Problems Collection Definition

       statement: Problem statement
       testcases: Testcases used for evaluating the client submission
       serverOutput:Correct output stored in the database by the problem curator
       sampleInput SampleOutput:  Sample input ans output for better understanding of the problem
       title:Problem title 
       userOutput:Output genererated by the clients submitted code by running against the testcase
       lang:Clients choice of language
       sourceCode:Clients source code

*/


var mongoose = require("mongoose");

var pb = new mongoose.Schema({

    statement: String,
    testcases: String,
    serverOutput: String,
    sampleInput: String,
    sampleOutput: String,
    title: String,
    userOutput: String,
    lang: String,
    sourceCode: String,
    isSolved: { type: Number, default: 0 }
});

module.exports = mongoose.model("problem", pb);


