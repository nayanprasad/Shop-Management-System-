const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _ = require("lodash");
const session = require("express-session");
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/GroceryItemsDB");

app.use(session({
    secret: "ItsMeHADEeS",
    // secret: process.env.SECRETE,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());   // check passport docs ( passportjs.org/docs )
app.use(passport.session());


const itemShema = new mongoose.Schema({
    name: String,
    price: Number,
    total_quantity: Number
});

const Item = mongoose.model("item", itemShema);

const userSchema = new mongoose.Schema({
    userName: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("user", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

let Arr = [];
let count_for_showitems = 0;
const cartArr = [];
let count_for_cart = 0;


app.get("/", function (req, res) {
    if(req.isAuthenticated()){
        res.render("home", {loginStatus : 1});
    }
    else{
        res.render("home", {loginStatus : 0});
    }
    
});


app.get("/additem", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("additem");
    }
    else {
        res.redirect("/login");
    }

});

app.get("/purchase", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("purchase");
    }
    else {
        res.redirect("/login");
    }
});

app.get("/showitems", function (req, res) {
    if (req.isAuthenticated()) {

        Item.find({}, function (err, foundItem) {
            if (err) {
                console.log(err);
            }
            else {
                foundItem.forEach(function (item) {
                    // console.log(item.title);
                    const singleItem = {
                        name: item.name,
                        price: item.price,
                        total_quantity: item.total_quantity
                    };
                    if (Arr.length === 0) {
                        Arr.push(singleItem);
                    }
                    else {
                        let count = 0;
                        Arr.forEach(function (it) {
                            if (it.name === singleItem.name) {
                                // console.log("item already inserted");
                            }
                            else {
                                count++;
                            }
                            if (count === Arr.length) {
                                Arr.push(singleItem);
                            }
                        });
                    }
                });
            }

        });

        if (count_for_showitems % 3 === 0) {
            count_for_showitems++;
            res.redirect("/showitems");
        } else {
            res.render("showitems", { itemsArr: Arr });
        }
        Arr = [];
    }
    else {
        res.redirect("/login");
    }

});


app.post("/showitems/searched", function (req, res) {
    const searcArr = [];
    const itemName = _.toLower(req.body.SearchItem);
    Arr.forEach(function (item) {
        if (item.name === itemName) {
            const searchedItem = {
                name: itemName,
                price: item.price,
                total_quantity: item.total_quantity
            }
            searcArr.push(item);
        }
    });
    if(searcArr.length === 0){
        res.render("emptysearch");
    }
    else{
        res.render("searchedItem", { itemsArr: searcArr });
    }
   
});


app.get("/purchase/confirm", function (req, res) {
    res.render("confirm")
});

app.post("/purchase/confirm", function (req, res) {
    const searchName = _.toLower(req.body.SearchItemP);
    let itemPrice = 0;
    let itemName = "";
    let itemQnt = 0;
    Item.findOne({ name: searchName }, function (err, foundedItem) {
        if (err) {
            console.log(err);
        }
        else {
            if (foundedItem) {
                itemName = foundedItem.name;
                itemPrice = foundedItem.price;
                itemQnt = foundedItem.total_quantity;
                res.render("confirm", { Name: itemName, Price: itemPrice, Qnt: itemQnt });
            }
        }
    });


});

//______________ ADD ITEM______________________________beginig

app.post("/additem", function (req, res) {

    if (req.isAuthenticated()) {
        const itemName = _.toLower(req.body.name);
        Item.findOne({ name: itemName }, function (err, foundedItem) {
            if (err) {
                console.log(err);
            }
            else {
                if (foundedItem) {
                    const qnt = Number(req.body.quantity) + Number(foundedItem.total_quantity);

                    Item.updateOne({ name: itemName }, { price: req.body.price, total_quantity: qnt }, function (err) {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            res.redirect("/");
                        }
                    });
                }
                else {
                    const newItem = new Item({
                        name: itemName,
                        price: req.body.price,
                        total_quantity: req.body.quantity
                    });
                    newItem.save();
                    res.redirect("/");
                }
            }
        })
    }
    else {
        res.redirect("/login");
    }
});
//______________ ADD ITEM______________________________end

//______________ ADD ITEM TO CART______________________________beginig

const cardShema = new mongoose.Schema({
    name: String,
    price: Number,
    total_quantity: Number,
    subtotal: Number
});
const Cart = mongoose.model("cartitem", cardShema);


app.post("/addedtocart", function (req, res) {

    const cartItemName = _.toLower(req.body.cartname);
    const cartItemQnt = req.body.cartqnt;
    const subTotal = req.body.cartprice;
    const cartItemPrice = Number(req.body.cartprice) / Number(req.body.cartqnt);

    Cart.findOne({ name: cartItemName }, function (err, foundedItem) {
        if (err) {
            console.log(err);
        }
        else {
            if (foundedItem) {
                const qnt = Number(cartItemQnt) + Number(foundedItem.total_quantity);
                Cart.updateOne({ name: cartItemName }, { price: cartItemPrice, total_quantity: cartItemQnt, subtotal: subTotal }, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
            }
            else {
                const newCartItem = new Cart({
                    name: cartItemName,
                    price: cartItemPrice,
                    total_quantity: cartItemQnt,
                    subtotal: subTotal
                });
                newCartItem.save();
            }
        }
    });
    res.redirect("/purchase");

});
//______________ ADD ITEM TO CART______________________________

//______________  CART______________________________

app.get("/cart", function (req, res) {

    if (req.isAuthenticated()) {
        Cart.find({}, function (err, foundItem) {
            if (err) {
                console.log(err);
            }
            else {
                foundItem.forEach(function (item) {
                    const singleItem = {
                        name: item.name,
                        price: item.price,
                        total_quantity: item.total_quantity,
                        subtotal: item.subtotal
                    };
                    if (cartArr.length === 0) {
                        cartArr.push(singleItem);
                    }
                    else {
                        let count = 0;
                        cartArr.forEach(function (it) {
                            if (it.name === singleItem.name) {
                                // console.log("item already inserted");
                            }
                            else {
                                count++;
                            }
                            if (count === cartArr.length) {
                                cartArr.push(singleItem);
                            }
                        });
                    }
                });
            }
        });

        Cart.count({}, function (err, items) {
            if (!err) {
                // console.log(items);
                if (items > 0) {
                    if (count_for_cart === 0) {
                        count_for_cart++;
                        res.redirect("/cart");
                    } else {
                        res.render("cartitems", { itemsArr: cartArr, TOTAL: grandTotal });
                    }
                }
                else {
                    // for empty cart
                    const a = [];
                    const b = 0;
                    // res.render("cartitems", { itemsArr: a, TOTAL: b });
                    res.render("emptycart");
                }
            }
        });
        let grandTotal = 0;
        cartArr.forEach(function (item) {
            grandTotal = grandTotal + item.subtotal;
        });
    }
    else {
        res.redirect("/login");
    }
});

//______________  CART______________________________end

//______________ CHECKOUT______________________________beginig

app.post("/checkout", function (req, res) {
    if (req.isAuthenticated()) {
        const checkoutArr = [];
        Cart.find({}, function (err, foundItem) {
            if (err) {
                console.log(err);
            }
            else {
                foundItem.forEach(function (item) {
                    const singleItem = {
                        name: item.name,
                        price: item.price,
                        total_quantity: item.total_quantity,
                        subtotal: item.subtotal
                    };
                    checkoutArr.push(singleItem);
                });
               
                Item.find({}, function (err, foundItem) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        foundItem.forEach(function (item) {
                            checkoutArr.forEach(function (itm) {
                                if (item.name === itm.name) {
                                    Item.findOne({ name: itm.name }, function (err, foundedItem) {
                                        if (err) {
                                            console.log(err);
                                        }
                                        else {
                                            let remainingQnt = Number(foundedItem.total_quantity) - itm.total_quantity;
                                            if (remainingQnt < 0) {
                                                remainingQnt = 0;
                                            }
                                            Item.updateOne({ name: foundedItem.name }, { total_quantity: remainingQnt }, function (err) {
                                                if (err) {
                                                    console.log(err);
                                                }
                                            });
                                        }
                                    });
                                }
                            })
                        })
                    }
                });
            }
        });

        Cart.deleteMany({}, function (err) {   // deletig all item from cart
            if (err) {
                console.log(err);
            }
        });
        res.redirect("/");
    }
    else {
        res.redirect("/login");
    }
});




// _________________________atuhentication_________________

app.get("/login", function (req, res) {
    res.render("login");
});


app.get("/register", function (req, res) {
    res.render("register")
});


app.post("/register", function (req, res) {
    //https://www.npmjs.com/package/passport-local-mongoose for docs

    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        }

        passport.authenticate("local")(req, res, function () {
            res.redirect("/login");
            // res.render("secrets");
        });
    })
});

app.post("/login", function (req, res) {

    const theUser = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.logIn(theUser, function (err) {
        if (err) {
            console.log(err);
            res.redirect("/login");
        }
        else {
            passport.authenticate("local", { failureRedirect: '/login' })(req, res, function (err, found) {
                res.redirect("/");
            });
        }
    })

});


app.get("/logout", function (req, res) {
    req.logOut(function (err) {
        if (err) {
            console.log(err);
        }
        else {
            res.redirect("/");
        }
    });

});

// _________________________atuhentication_________________end



app.listen(3000, function () {
    console.log("Server started on port 3000");
});
