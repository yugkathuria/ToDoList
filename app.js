//jshint esversion:6
require('dotenv').config();//dotenv module for environment variable
const express = require("express");
const bodyParser = require("body-parser");

const { default: mongoose } = require("mongoose");
const date = require(__dirname + "/date.js");
const _=require("lodash");
const { template } = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
const userP=process.env.userP;
const userI=process.env.userI;
const linkD=process.env.linkD;
mongoose.connect("mongodb+srv://"+userP+":"+userI+"@"+linkD+"?retryWrites=true&w=majority");

const itemsSchema={
  name: String
};
const Item=mongoose.model("Item",itemsSchema);

const item1=new Item({
 name:"Welcome"
});
const item2=new Item({
  name:"Hit"
 });
 const item3=new Item({
  name:"Hit more"
 });

 const defaultItems=[];

 const listSchema={
   name:String,
   items:[itemsSchema]//array of item document


 };  

 const List=mongoose.model("List",listSchema);

app.get("/", function(req, res) {
   Item.find({},function(err,result){
     if(result.length===0){//only when running for first time we will insert default items, otherwise multiple copies
       Item.insertMany(defaultItems,function(err){
      if(err)
      console.log(err);
      else
     console.log("Success");
    });
     }
    res.render("list", {listTitle: "Today", newListItems: result});
   
   });

  


});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName=req.body.list;
  const item=new Item({
    name:itemName
   });


if(listName==="Today"){
   item.save();
   res.redirect("/");
}
else{
  List.findOne({name:listName}, function(err,foundList){
    foundList.items.push(item);
    foundList.save();
    res.redirect("/"+listName);
  });
}

 

   
  
   
});





app.post("/delete", function(req, res){

  const itemId = req.body.itemId;
  const check = req.body.checkbox;
   const listName=req.body.listName;
   const itemName=req.body.itemName;
  if(check==="on"||itemName==""){
    if(listName==="Today"){
      Item.deleteOne({_id:itemId},function(err){});
      res.redirect("/");
    }
    else{
      List.findOneAndUpdate({name:listName},{$pull:{items:{_id:itemId}}},function(err,result){
        if(!err){
          res.redirect("/"+listName);
        }
      });
   }
  }
  else{
    if(listName==="Today"){
      Item.updateOne({_id:itemId},{name:itemName},function(err){});
      res.redirect("/");
    }
    else{
 
     List.findOne({name:listName}, function(err,foundList){
      if(!err){
        var items=foundList.items;
        
       for(var i=0;i<items.length;i++){
          if(items[i]._id==itemId){
            items[i].name=itemName;
            console.log(items[i].name);
            foundList.save(function(err){})
          }
       }
    
       }
      });
       res.redirect("/"+listName);
  }
}
  });
   //another method
  //  Item.findByIdAndRemove(itemId,function(err){
  //   if(err){
  //     //     console.log(err);
  //     //   }
  //     //   else{
  //     //     console.log("Deleted");
  //     //   }
  //  });
  



app.get("/:customListName", function(req,res){
  const customListName=_.capitalize(req.params.customListName);
  List.findOne({name:customListName},function(err,listFound){
  if(!err){
    if(!listFound){
      const list=new List({
        name: customListName,
        items:defaultItems
       });
       list.save();
       res.redirect("/"+customListName);
    }
    else{
      res.render("list", {listTitle: listFound.name, newListItems: listFound.items});
    }
  }

  });
});



app.listen(process.env.PORT|| 3000 ,function(){//heroku would choose port for us or we could run it locally on port 3000 as usuall
  console.log("Server is running on port 3000");
});

