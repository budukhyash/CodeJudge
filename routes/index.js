var express=require("express")
var router =express.Router();
var PB=require("../models/problems");
var CJ=require("../models/codejudge");
var passport=require("passport");
var User=require("../models/user");
var request=require('request');
var middleware=require("../middleware");


router.use(function(req,res,next){ 
    res.locals.currentUser=req.user;
    next();
});

//=======================
// Generic Routes
//=======================

router.get("/",function(req,res){
   res.render("home",{currentUser:req.user}); 
});


router.get("/ide",middleware.isLoggedIn,function(req,res){
    
     res.render("landing",{source:"",stdin:"",output:"Your Output",currentUser:req.user}); 
});

router.post("/ide",function(req,res)
{
   var script=req.body.source.toString('utf-8');
   var input=req.body.stdin.toString('utf-8');
   var lang=req.body.lang;
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
        res.render("landing",{output:body['output'],source:script,stdin:input,lang:lang,currentUser:req.user});
     
    });
       
});



//======================
//Authentication routes
//======================

router.get("/register",function(req,res)
{
   res.render("register"); 
});

router.post("/register",function(req,res)
{
   User.register(new User({username:req.body.username}),req.body.password,function(err,user)
   {
       if(err)
       {
           console.log(err);
           return res.render('register');
       }
       passport.authenticate("local")(req,res,function()
       {
           res.redirect("/problems");
       });
   });
   
});

router.get("/login",function(req,res){
   res.render("login"); 
});

router.post("/login",passport.authenticate("local",{
    
    successRedirect:"/problems",
    failureRedirect:"/login"
})
,function(req,res){
    
});

router.get("/logout",function(req,res){
   req.logout();
   res.redirect("/");
});


module.exports=router; 