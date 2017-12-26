var express=require('express'),
    app=express(),
    bodyParser=require('body-parser'),
    mongoose=require('mongoose'),
    flash=require('connect-flash'),
    Campground=require('./models/campground'),
    Comment=require('./models/comment'),
    seedDB=require('./seeds'),
    passport=require('passport'),
    localStrategy=require('passport-local'),
    methodOverride=require("method-override"),
    User=require('./models/user');
    
var commentRoutes=require("./routes/comments"),
    campgroundRoutes=require("./routes/campgrounds"),
    indexRoutes=require("./routes/index");
    
var url=process.env.DATABASEURL||"mongodb://localhost/yelp_camp";
mongoose.Promise=global.Promise;  
mongoose.connect(url,{useMongoClient:true});



//seed database
// seedDB();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname+"/public"));
app.use(methodOverride("_method"));
app.use(flash());

app.set("view engine","ejs");

//PASSPORT-configuration
app.use(require("express-session")({
    secret:"Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
    res.locals.currentUser=req.user;
    res.locals.error=req.flash("error");
    res.locals.success=req.flash("success");
    next();
});

//requiring routes
app.use(indexRoutes);
app.use("/campgrounds",campgroundRoutes);
app.use("/campgrounds/:id/comments",commentRoutes);

app.listen(process.env.PORT,process.env.IP,function(){
    console.log("The Yelp Camp Server has started");
});