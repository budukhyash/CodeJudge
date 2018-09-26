/*CodeJudge collection definition
       problemID:Unique problem id for every problem,
       sourceCode:Clients source code,  
       stdin:Standard input which will be same as the testcases provided by the problem curator,
       lang:Clients choice of language,
       userOutput:output by clients code,
       serverOutput:Clients source code,
*/


var mongoose=require("mongoose");

var cj= new mongoose.Schema(
    {
       problemID:String,
       sourceCode:String,  
       stdin:String,
       lang:String,
       userOutput:String,
       serverOutput:String,
    });


module.exports=mongoose.model("codejudge",cj);
 