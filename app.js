var express = require("express"),
    app = express(),
    passport = require("passport"),
    bodyParser = require("body-parser"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    mongoose = require("mongoose"),
    User = require("./models/user"),
    CJ = require("./models/codejudge"),
    PB = require("./models/problems"),
    request = require('request'),
    methodOverride = require("method-override"),
    flash = require("express-flash");
    //flash = require("connect-flash");

var problemRoutes = require("./routes/problems"),
    authRoutes = require("./routes/index");

mongoose.connect("mongodb://localhost/codejudge");

app.use(require("express-session")({

    secret: "Random text to encode passwords",
    resave: false,
    saveUninitialized: false
}));

app.set('view engine', 'ejs');
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(flash());

app.use(authRoutes);
app.use(problemRoutes);

app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    //res.locals.info = req.flash("info");
    next();
});

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.listen(3000, function () {
    console.log("The code server has started");
});   
