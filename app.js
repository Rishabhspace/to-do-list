//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//Connecting to DB
main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(
    "mongodb+srv://rishabh:Rishabh123@cluster0.ntx1gee.mongodb.net/todolist"
  );
}

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  // console.log("We are connected");
});

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your To Do List",
});
const item2 = new Item({
  name: "Hit the + button to add Items",
});
const item3 = new Item({
  name: "<-- Hit this to delete an Item",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  find();
  async function find() {
    try {
      const findItems = await Item.find({});
      if (findItems.length === 0) {
        Item.insertMany(defaultItems);
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: findItems });
      }
    } catch (e) {
      console.log(e.message);
    }
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  console.log(customListName);

  find();
  async function find() {
    try {
      const find = await List.findOne({ name: customListName });
      console.log(find);
      if (find === null) {
        //Create a New List
        const listing = new List({
          name: customListName,
          items: defaultItems,
        });
        listing.save();
        res.redirect("/" + customListName);
      } else {
        //Show existing List
        res.render("list", {
          listTitle: customListName,
          newListItems: find.items,
        });
      }
    } catch (e) {
      console.log(e.message);
    }
  }
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    find();
    async function find() {
      try {
        const find = await List.findOne({ name: listName });
        find.items.push(item);
        find.save();
        res.redirect("/" + listName);
      } catch (e) {
        console.log(e.message);
      }
    }
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    deleteItem();
    async function deleteItem() {
      await Item.deleteOne({ _id: checkedItemId });
    }
    res.redirect("/");
  } else {
    res.redirect("/" + listName);
    findandUpdate();
    async function findandUpdate() {
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } }
      );
    }
  }
});

app.listen(3000, function () {
  console.log("Server started on port 3000.");
});
