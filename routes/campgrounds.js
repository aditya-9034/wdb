var express=require("express");
var router=express.Router();
var Campground=require("../models/campground");
var middleware=require('../middleware');
var geocoder=require("geocoder");

var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name:'oculus',
    api_key: process.env.CLOUDINARY_API_KEY ,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//EDIT CAMPGROUND ROUTE
router.get("/:id/edit",middleware.checkCampgroundOwnership,function(req,res){
    Campground.findById(req.params.id,function(err,foundCampground){
       if(err){
           res.redirect("back");
       } 
       else{
           res.render("campgrounds/edit",{campground:foundCampground});
       }
    });

});

//UPDATE CAMPGROUND ROUTE
router.put("/:id", function(req, res){
  geocoder.geocode(req.body.campground.location, function (err, data) {
     var lat,lng,location,newData;
      if(err){
          res.redirect('back');
      }
    
    if(data && data.results && data.results.length) {
     lat = data.results[0].geometry.location.lat;
     lng = data.results[0].geometry.location.lng;
     //location=req.body.campground.location;
     location = data.results[0].formatted_address;
     newData = { name: req.body.campground.name,
                price: req.body.campground.price, 
                image: req.body.campground.image, 
                description: req.body.campground.description,  
                location: location, 
                lat: lat, 
                lng: lng };   
    };

    
    Campground.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, campground){
        if(err){
            req.flash("error", "There seems to be a problem please submit again!");
            res.redirect("/campgrounds/"+req.params.id+"/edit");
            
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
  });
});

//DESTROY CAMPGROUND ROUTE
router.delete("/:id",middleware.checkCampgroundOwnership,function(req,res){
    Campground.findByIdAndRemove(req.params.id,function(err){
        if(err){
            res.redirect('/campgrounds');
        }
        else{
            res.redirect('/campgrounds');
        }
    });
});

//middleware

//INDEX - show all campgrounds
router.get("/",function(req,res){
    var noMatch=null;
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
         Campground.find({name:regex},function(err,allCampgrounds){
         if(err){
             console.log(err);
         }
         else{
             
             if(allCampgrounds.length<1){
                 noMatch="No campgrounds match that query, please try again!";
             }
             res.render("campgrounds/index",{campgrounds:allCampgrounds,page:"campgrounds",noMatch:noMatch});
         }
        });
    }
    
    else{
         Campground.find({},function(err,allCampgrounds){
         if(err){
             console.log(err);
         }
         else{
             res.render("campgrounds/index",{campgrounds:allCampgrounds,page:"campgrounds",noMatch:noMatch});
         }
     });
    }

    //res.render("campgrounds",{campgrounds:campgrounds});
});



//CREATE - add new campgrounds to the database
router.post("/",middleware.isLoggedIn,upload.single('image'),function(req,res){
   
   console.log(req.body.campground);
   var name=req.body.name;
   //var image=req.body.campground.image;
   var price=req.body.price;
   var desc=req.body.description;
   var author={
      id:req.user._id,
      username:req.user.username
   };
   
  
   geocoder.geocode(req.body.location,function(err,data){
       if(err){
           res.redirect('back');
       }
       var lat=data.results[0].geometry.location.lat;
       var lng=data.results[0].geometry.location.lng;
       var location=data.results[0].formatted_address;
       
       console.log(location);
       
       cloudinary.uploader.upload(req.file.path,function(result){
         req.body.image=result.secure_url;
         
         req.body.author = {
            id: req.user._id,
            username: req.user.username
          } 
          
         var newCampground={
         name: name,
         price:price,
         image:req.body.image,
         description:desc,
         author:req.body.author,
         lat:lat,
         lng:lng,
         location:location
      };
      
      console.log(newCampground);
      
     Campground.create(newCampground,function(err,newlyCreated){
       if(err){
           console.log(err);
       }
       else{
          console.log(newlyCreated);
          res.redirect("/campgrounds"); 
       }
   });
       });
       

       
       
});
});

   
   


//NEW - show form to create new campground
router.get("/new",middleware.isLoggedIn,function(req, res) {
   res.render("campgrounds/new"); 
});

//SHOW - shows more info about one campground
router.get("/:id",function(req,res){
   //find campground with the provided id
   Campground.findById(req.params.id).populate("comments").exec(function(err,foundCampground){
      if(err){
          console.log(err);
      } 
      else{
          console.log(foundCampground);
          res.render("campgrounds/show",{campground:foundCampground});
      }
   });
   
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports=router;