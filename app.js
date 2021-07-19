//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const url = "mongodb+srv://admin-smartdev:segun17@7@cluster0.uitpv.mongodb.net/toDoListDB"

mongoose.connect(url,{useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
    name: "Welcome to your ToDo List."
});
const item2 = new Item({
    name: "Hit the + to add new item."
});
const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1,item2,item3];
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List",listSchema);



app.get("/", function(req, res) {

Item.find({},function (err,foundItems) {

      if (foundItems.length === 0) {
        Item.insertMany(defaultItems,function (err) {
            if (err) {
              console.log(err);
            } else {
              console.log("Successfully saved new Items to DB");
            }
         });
        res.redirect("/");
       } else {
              res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
  });
});
 

app.post("/",function (req,res) {
        const itemName = (req.body.newItem).trim();
        const listName = (req.body.list).trim();

        const item = new Item({
          name: itemName
        });
          
        if(listName === "Today"){
             item.save();
             res.redirect("/");
        }else{
             List.findOne({name: listName},function (err,foundList) {
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
              });
        }     
});



app.post("/delete",function (req,res) {
  const checkedItemId = (req.body.checkbox).trim();
  const listName = (req.body.listName).trim();

  if( listName === "Today"){
      Item.findByIdAndRemove(checkedItemId,function (err) {
          if (!err) {
            console.log("Successfully deleted an Item.");
            // console.log(err);
            res.redirect("/");
          }
        });
  }
  else{
      List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}},function (err,foundList) {
        if(!err){
          res.redirect("/" +listName);
        }
       });
  };
}); 


app.get("/:customListName",function (req,res) {
    const customListName = _.capitalize(req.params.customListName); 
    
    List.findOne({name: customListName}, function (err,foundList) {
      if(!err){
        if(!foundList){
          // Create new list
              const list = new List({
                name: customListName,
                items: defaultItems
              });
              list.save();
              res.redirect("/"+ customListName);
        }else{
          // Show existing list
          res.render("list", {listTitle: foundList.name , newListItems: foundList.items})
        }
      };
    });

});


let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}


app.listen(port, function() {
  console.log("Server has started Successfully.");
});
