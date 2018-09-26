var express=require("express")
var router =express.Router();
var PB=require("../models/problems");
var CJ=require("../models/codejudge");
var request=require('request');
var methodOverride=require("method-override");
var middleware=require("../middleware");

router.use(function(req,res,next){ 
    res.locals.currentUser=req.user;
    next();
});
 
router.get("/problems",middleware.isLoggedIn,function(req,res){
   PB.find({},function(err,problems){
        if(err){
        console.log("Error");
        }
        else{
        res.render("problems",{problems:problems});
        }
    });
});

router.get("/problems/new",function(req,res){
    res.render("new"); 
});

router.get("/problems/:id",function(req,res){
    
    
     PB.findById(req.params.id,function(err,foundProblem)
   {
       if(err)
       {
           res.redirect("/problems");
       }
       else
       {
           res.render("show",{source:"",stdin:"",output:"Your Output",problem:foundProblem});
       }
   });
    
});

router.get("/problems/:id/ide",function(req,res){
   

    PB.findById(req.params.id,function(err,foundProblem)
    
   {
       if(err)
       {
           res.redirect("/problems");
       }
       else
       {    
        
           res.render("compile",{source:"",output:"Your Output",problem:foundProblem}); 
       }
   });
   
   
   
});

router.post("/problems/:id/ide",function(req,res)
{


   PB.findById(req.params.id,function(err,problem)
   {
       if(err)
       {
           res.redirect("/problems");
       }
       else
       {    
              var script=req.body.sourceCode.toString('utf-8');
              var input=problem.testcases.toString('utf-8').replace(/\r/g, "");
              var lang=req.body.lang;
              var serverOutput=problem.serverOutput.toString('utf-8').replace(/\r/g, "")+'\n';
              var userOutput;
    
              //var newCJ={source:script,stdin:input,lang:lang};
              //CJ.create(newCJ);
               
                var program = {
                    script : script,
                    language: lang,
                    stdin:input,
                    versionIndex: "0",
                    clientId: "33809dd2322fdf4fe0a32d68ae55975a",
                    clientSecret:"ad9f356e9677d18dab8a2d42828589f82af16bca3ad86ccfd7d5eacb812f8fdc"
                };
                request({
                    url: 'https://api.jdoodle.com/execute',
                    method: "POST",
                    json: program
                },
                function (error, response, body) {
                    res.render("compile",{output:body['output'],source:script,lang:lang,problem:problem});

                    userOutput=body['output'];
                    
                    var newCJ={problemID:problem._id,source:script,stdin:input,lang:lang,userOutput:userOutput,serverOutput:serverOutput};
                    
                    
                    if(userOutput.localeCompare(serverOutput)==0){
                        console.log("Correct");
                        CJ.create(newCJ);
                    }
                    else
                    {
                        console.log("Wrong");
                    }
                });
                        
            
           
       }
   });
       
});

router.post("/problems",function(req,res)
{

 
   PB.create(req.body.problem,function(err,newProblem){
       if(err){
        console.log("ERROR");
        }
        else{
         
        res.redirect("/problems");
        }
   });
});

router.get("/problems/:id/edit",function(req,res){
  
    PB.findById(req.params.id,function(err,foundProblem){
       if(err){
           res.redirect("/problems");
       }else
       {
           res.render("edit",{problem:foundProblem});
       }
        
    });
});


// Update and delete

router.put("/problems/:id",function(req,res){
   PB.findOneAndUpdate(req.params.id,req.body.problem,function(err,updatedProblem){
       if(err){
           res.redirect("/problems");
       }
       else{
           res.redirect(("/problems/" + req.params.id));
       }
   }) ;
});

router.delete("/problem/:id",function(req,res){
    PB.findOneAndDelete(req.params.id,function(err){
        if(err){
            res.redirect("/problems");
        }
        else
        {
            res.redirect("/problems");
        }
    })
});

function isLoggedIn(req,res,next)
{
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("login");
}
module.exports=router;