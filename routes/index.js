var express=require("express");
var router=express.Router();
var passport=require("passport");
var User=require("../models/user");
var Campground=require("../models/campground");
var async=require("async");
var nodemailer=require("nodemailer");
var crypto=require("crypto");
router.get("/",function(req,res){
   res.render("landing"); 
});


//show register form
router.get("/register",function(req,res){
   res.render("register",{page:"register"}); 
});

//handle signup logic
router.post("/register",function(req,res){
    var newUser=new User({
        username:req.body.username,
        firstName:req.body.firstName,
        lastName:req.body.lastName,
        email:req.body.email,
        avatar:req.body.avatar,
        bio:req.body.bio
    });
    
    if(req.body.adminCode === "secretcode123"){
        newUser.isAdmin=true;
    }
    User.register(newUser,req.body.password,function(err,user){
        if(err){
        
            return res.render("register",{error:err.message});
        }
        passport.authenticate("local")(req,res,function(){
          req.flash("success","Welcome to YelpCamp "+user.username);
          res.redirect("/campgrounds") 
        });
    });
  
});

//show login form
router.get("/login",function(req,res){
    res.render("login",{page:"login"});
});

//handling login logic
router.post("/login",passport.authenticate("local",
    {successRedirect:"/campgrounds",
     failureRedirect:"/login"    
    }),function(req,res){
   
});

//logout route
router.get("/logout",function(req,res){
    req.logout();
    req.flash("success","Logged you out");
    res.redirect("/campgrounds");
});

//forgot get
router.get("/forgot",function(req,res){
    res.render("forgot");
});

//forgot post
router.post("/forgot",function(req,res,next){
   async.waterfall([
       function(done){
           crypto.randomBytes(20,function(err,buf){
               var token=buf.toString('hex');
               done(err,token);
           });
       },
       function(token,done){
           User.findOne({email:req.body.email},function(err,user){
               if(err){
                   req.flash("error","Something went wrong");
                   res.redirect("back");
               }
               if(!user){
                   req.flash('error','No account with that email address exist');
                   return res.redirect('/forgot');
               }
               user.resetPasswordToken=token;
               user.resetPasswordExpires=Date.now()+3600000;
               
               user.save(function(err){
                   done(err,token,user);
               });
           });
       },
       function(token,user,done){
           var smtpTransport=nodemailer.createTransport({
               service:'Gmail',
               auth:{
                   user:'yelp.help.wdb@gmail.com',
                   pass:process.env.GMAILPASSWORD
               }
           });
           
           var mailOptions={
               to: user.email,
               from: "yelp.help.wdb@gmail.com",
               subject: "Password Reset for Yelp",
               text: "You are receiving this because you(or someone else) has requested "+
                    "the reset of password.Please click on this link or paste it in your"+
                    "browser to complete the process "+"http://"+req.headers.host+
                    "/reset/"+token+"\n\n"+
                    "If you did not request this, please ignore this email and "+
                    "your password will remain unchanged"
           };
           
           smtpTransport.sendMail(mailOptions,function(err){
               console.log("mail sent");
              
               req.flash("success","An email has been sent to "+user.email+"with further instructions");
               done(err,'done');
           });
       }
       ],function(err){
           if(err){
               return next(err);
           }
           res.redirect("/forgot");
       });
});

//reset password page
router.get("/reset/:token",function(req,res){
    User.findOne({resetPasswordToken:req.params.token,resetPasswordExpires:{$gt:Date.now()}},function(err,user){
    if(err){
        req.flash("error","Something went wrong");
        res.redirect("back");
    }
     if(!user){
         req.flash("error","Password reset token is invalid or has expired");
         return res.redirect("/forgot");
     }  
     res.render("reset",{token:req.params.token});
    });
});

//reset password post route
router.post("/reset/:token",function(req,res){
    async.waterfall([
        function(done){
            User.findOne({resetPasswordToken:req.params.token, resetPasswordExpires:{$gt:Date.now()}},function(err,user){
                if(err){
                    req.flash("error","Something went wrong");
                    res.redirect("back");
                        }    
                if(!user){
                    req.flash("error","Password reset token is invalid or has expired");
                    return res.redirect("back");
                }
                if(req.body.password==req.body.confirm){
                    user.setPassword(req.body.password,function(err){
                        if(err){
                            req.flash("error","Something went wrong");
                            res.redirect("back");
                        }
                        user.resetPasswordToken=undefined;
                        user.resetPasswordExpires-undefined;
                        user.save(function(err){
                        if(err){
                            req.flash("error","Something went wrong");
                            res.redirect("back");
                         }
                            req.logIn(user,function(err){
                                done(err,user);
                            });
                        });
                    })
                }
                else{
                    req.flash("error","Passwords do not match");
                    return res.redirect("back");
                }
            });
        },
        function(user,done){
            var smtpTransport=nodemailer.createTransport({
                service:"Gmail",
                auth:{
                    user:"yelp.help.wdb@gmail.com",
                    pass: process.env.GMAILPASSWORD
                }
            });
            
            var mailOptions={
                to:user.email,
                from:"yelp.help.wdb@gmail.com",
                subject:"Your password has been changed",
                text:"Hello,\n\n"+
                "This is a confirmation that password for your account has changed"

            };
            
            smtpTransport.sendMail(mailOptions,function(err){
                req.flash("success","Success! Your password has been changed");
                done(err);
            });
        }
        ],function(err){
            if(err){
               req.flash("error","Something went wrong");
                res.redirect("back");
                }
            res.redirect("/campgrounds");
        });
});

router.get("/users/:id",function(req,res){
    User.findById(req.params.id,function(err,foundUser){
       if(err){
           req.flash("error","Something went wrong");
           res.redirect("/");
       } 
       Campground.find().where('author.id').equals(foundUser._id).exec(function(err,campgrounds){
           if(err){
               req.flash("error","Something went wrong");
               res.redirect("/");
           }
           res.render("users/show",{user:foundUser,campgrounds:campgrounds});
       })
    });
});

module.exports=router;