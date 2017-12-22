var mongoose=require("mongoose");
var Campground=require("./models/campground");
var Comment=require("./models/comment");

var data=[
  {
  name : "Granite Hill", 
  image : "https://farm8.staticflickr.com/7258/7121861565_3f4957acb1.jpg",
  description: "Bacon ipsum dolor amet picanha jerky pork loin shank bresaola buffalo tri-tip turkey pork belly pastrami. Sausage chicken alcatra picanha brisket drumstick strip steak chuck hamburger bacon corned beef swine ham hock porchetta short loin. Beef turkey pastrami kevin, chuck t-bone ham pork loin drumstick landjaeger tail tongue. Ball tip filet mignon brisket buffalo shoulder tri-tip capicola sirloin strip steak. Jowl shoulder t-bone bacon pig, chuck picanha."
  },
  
  {
       name : "Mountain Goat's Rest", 
       image : "https://farm5.staticflickr.com/4101/4961777592_322fea6826.jpg",
       description:"T-bone pork belly meatball pork corned beef flank. Chicken sausage fatback corned beef biltong porchetta, buffalo turducken beef ribs jerky tenderloin filet mignon tri-tip. Rump chicken filet mignon ham. Turkey shankle burgdoggen doner, swine brisket prosciutto pork loin biltong t-bone tri-tip filet mignon beef meatball. Beef ribs ground round buffalo pork leberkas t-bone short ribs tenderloin. Beef ball tip ground round drumstick rump bacon corned beef jerky pastrami. Shankle frankfurter andouille drumstick tail."
  },
  
  {
       name : "Salmon Creek", 
       image : "https://farm5.staticflickr.com/4137/4812576807_8ba9255f38.jpg",
       description:"Brisket biltong tail tri-tip. Tri-tip pork belly landjaeger cupim, bacon pancetta ball tip alcatra meatball shank turducken doner. Rump hamburger fatback, chicken swine kielbasa cow leberkas porchetta. Drumstick jowl short ribs short loin, jerky ham hock biltong meatloaf cupim chicken andouille ham kevin."
  }
];
function seedDB(){
   Campground.remove({},function(err){
  if(err){
      console.log(err);
  } 
  else{
      console.log("removed campgrounds");
      data.forEach(function(seed){
      Campground.create(seed,function(err,campgrounds){
          if(err){
              console.log(err);
          }
           
          else{
              console.log("added a campground");
              Comment.create({
                  text:"This is a great place .. wish it had internet",
                  author:"Homer"
              },function(err,comment){
                  if(err){
                      console.log(err);
                  }
                  else{
                      campgrounds.comments.push(comment);
                      campgrounds.save();
                      console.log("Created new comment");
                  }
              })
          }
      });
    });
  }
  });
}

module.exports=seedDB;