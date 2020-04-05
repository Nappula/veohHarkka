const express = require('express');
const PORT = process.env.PORT || 8088;
const body_parser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


//schemat alkaa


const item_schema = new Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    quantity: { type: Number, required: true }
});
const item_model = new mongoose.model('item', item_schema);


const shoppinglist_schema = new Schema({
    name: { type: String, required: true },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'item', req: true }]
});
const shoppinglist_model = new mongoose.model('shoppinglist', shoppinglist_schema);


const user_schema = new Schema({
    name: { type: String, required: true },
    shoppinglists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'shoppinglist', req: true }]
});
const user_model = mongoose.model('user', user_schema);


//schemat loppuu

let app = express();

// bodyparseri
app.use(express.urlencoded({ // app.use(body_parser.urlencoded({
    extended: true
}));


//Sessiot alkaa
app.use(session({
    secret: '1234qwerty',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000000
    }
}));

let users = [];
let items = [];

//sessiot päättyy


//osoiteloggeri
app.use((req, res, next) => {
    console.log(`path: ${req.path}`);
    next();
});


//käyttäjän kirjautumisen tarkastus alkaa
const is_logged_handler = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    user_model.findById(req.session.user._id).then((user) => {
        req.user = user;
        next();
    }).catch((err) => {
        console.log(err);
        res.redirect('login');
    });
});
//käyttäjän kirjautumisen tarkastus loppuu


// '/'
app.get('/', is_logged_handler, (req, res, next) => {
    const user = req.user;
    user.populate('shoppinglists')
        .execPopulate()
        .then(() => {
            console.log('user:', user);
            res.write(`
        <html>
        <body>
            Logged in as user: ${user.name}
            <form action="/logout" method="POST">
                <button type="submit">Log out</button>
            </form>`);
            user.shoppinglists.forEach((shoppinglist) => {
                res.write(shoppinglist.name + ' ' + shoppinglist.id);
                res.write(`


                <form action="/shoppinglist/${shoppinglist._id}" method="get">
                    <input type="hidden" name="shoppinglist_id" value="${shoppinglist._id}">            
                    <button type="submit"> Open </button>
                 </form>


                 
                <form action="delete-shoppinglist" method="POST">
                    <input type="hidden" name="shoppinglist_id" value="${shoppinglist._id}">
                    <button type="submit">Delete</button>
                </form>
                
                `);
            });

            res.write(`
            <form action="/add-shoppinglist" method="post">
                <input type="text" name="shoppinglist_name">
                <button type="submit">Add shoppinglist</button>
            </form>
            
            </body>
        </html>

        `);
            res.end();
        });
});


//
app.post('/delete-shoppinglist', (req, res, next) => {
    const user = req.user;
    const shoppinglist_id_to_delete = req.body.shoppinglist_id;

    //Remove shoppinglist from user.shoppinglists
    const updated_shoppinglist = user.shoppinglists.filter((shoppinglist_id) => {
        return shoppinglist_id != shoppinglist_id_to_delete;
    });
    user.shoppinglists = updated_shoppinglist;

    //Remove shoppinglist object from database
    user.save().then(() => {
        shoppinglist_model.findByIdAndRemove(shoppinglist_id_to_delete).then(() => {
            res.redirect('/');
        });
    });
});


app.use('/shoppinglist/:id', function (req, res, next) {
    console.log('shoppinglist id :', req.params.id)
    next();
});



///shoppinglist/${shoppinglist._id}
app.get('/shoppinglist/:id', (req, res, next) => {
    const shoppinglist_id = req.params.id;


    //https://medium.com/@nicknauert/mongooses-model-populate-b844ae6d1ee7
    shoppinglist_model.findOne({ _id: shoppinglist_id })
        .populate('items').exec((err, items) => {
           console.log("Populated items " + items);
           
           //TypeError: items.forEach is not a function joten...

          // for (const item of items.items) {console.log("testi" + item.name, item.url, item.quantity);     }
            res.write(`
            <html>
            <body>
            `);
     
         for (const item of items.items)
         {
           
            res.write(`item name: ${item.name}, quantity: ${item.quantity}, <img src="${item.url}"

            </body>
            </html>

            `);

          //items.items.forEach( (item) =>  console.log(item.name) ); 
        
        
        }
       
        res.end();


          
         
        
        
        
        
        
        
            /*   console.log("Populated items " + items);
            VIITTAUSONGELMA items.
            
            //todo
            items.foreach.....
*/
        }); 




    




    //tähän itemien listaus.
    console.log('shoppinglist_id: ' + shoppinglist_id);
    //tähän itemien lisäys
    res.write(`
    <html> 
    <body>
    <form action="/add-item" method="POST"><br>
    name: <input type="text" name="item_name"><br>
    quantity: <input type="number" name="item_quantity"><br>
    pic url: <input type="text" name="item_url">
    <input type="hidden" name="shoppinglist_id" value="${shoppinglist_id}">
    <button type="submit">Add item</button>
</form>
</html>
</body>
        `);
     res.end();

});

app.use('/add-item', function (req, res, next) {

    console.log('testiiiii: ' + req.body.shoppinglist_id)
    //const items = req.body.shoppinglist_id;
    console.log('items: ' + items)
    next();
});



/* app.post('/add-item'), (req, res, next) => {
    const shoppinglist = req.body.shoppinglist;

    let new_item = item_model({
        name: req.body.item_name,
        url: req.body.item_quantity,
        quantity: req.body.item_quantity
    });
 
    new_item.save().then(() => {
        console.log('item saved');
        shoppinglists.items.push(new_item);
        shoppinglists.save().then(() => {

            return res.redirect('/dfgdfgdfgback');
        });
    });
} */


app.post('/add-item', (req, res, next) => {
    const user = req.user;

    console.log('user:' + req.user);
    // console.log('shoppinglist: ' + req.user.shoppinglist)
    console.log('req.body: ' + req.body);
    console.log('req.body.shoppinglist_id' + req.body.shoppinglist_id);
    const shoppinglist_id = req.body.shoppinglist_id;

    //const item = items;

    /*     let new_item = item_model({
            name: req.body.item_name,
            url: req.body.item_quantity,
            quantity: req.body.item_quantity,
            shoppinglist_id : req.body.shoppinglist_id
         });
         */


    // const shoppinglist_id = req.params.id
    //const shoppinglist = req.params;
    console.log("req.params " + req.params);

    shoppinglist_model.findOne({
        _id: shoppinglist_id
    }).then((shoppinglists) => {
        let new_item = item_model({
            name: req.body.item_name,
            url: req.body.item_quantity,
            quantity: req.body.item_quantity
        });

        console.log("new_item" + new_item);

        new_item.save().then(() => {


            shoppinglists.items.push(new_item);
            shoppinglists.save().then(() => {
                console.log("item saved to shoppinglist array")
                return res.redirect('back');       //     `/shoppinglist/${shoppinglist._id}`);
            });
        });
    });



})





/*
new_shoppinglist.save().then(() => {
    console.log('shoppinglist saved');
    user.shoppinglists.push(new_shoppinglist);
    user.save().then(() => {
        return res.redirect('/');
    });
});
*/


/* paras tähän mennessä
  
    new_item.save().then(() => {
        console.log('item saved');
        shoppinglists.i.items.push(new_item);
        console.log(items[items.length-1]);
        console.log("items.parent" +items.parent())
        //console.log('user.shoppinglists ' + user.shoppinglist);
        items.parent().save().then(() => {
            return res.redirect('/');
        });
    });
});

*/








app.post('/add-shoppinglist', (req, res, next) => {
    const user = req.user;

    let new_shoppinglist = shoppinglist_model({
        name: req.body.shoppinglist_name,
        items: []
    });
    new_shoppinglist.save().then(() => {
        console.log('shoppinglist saved');
        user.shoppinglists.push(new_shoppinglist);
        user.save().then(() => {
            return res.redirect('/');
        });
    });
});

app.post('/logout', (req, res, next) => {
    req.session.destroy();
    res.redirect('/login');
});

app.get('/login', (req, res, next) => {
    console.log('user: ', req.session.user)
    res.write(`
    <html>
    <body>
        <form action="/login" method="POST">
            <input type="text" name="user_name">
            <button type="submit">Log in</button>
        </form>
        <form action="/register" method="POST">
            <input type="text" name="user_name">
            <button type="submit">Register</button>
        </form>
    </body>
    <html>
    `);
    res.end();
});

app.post('/login', (req, res, next) => {
    const user_name = req.body.user_name;
    user_model.findOne({
        name: user_name
    }).then((user) => {
        if (user) {
            req.session.user = user;
            return res.redirect('/');
        }

        res.redirect('/login');
    });
});

app.post('/register', (req, res, next) => {
    const user_name = req.body.user_name;

    user_model.findOne({
        name: user_name
    }).then((user) => {
        if (user) {
            console.log('User name already registered');
            return res.redirect('/login');
        }

        let new_user = new user_model({
            name: user_name,
            shoppinglists: []
        });

        new_user.save().then(() => {
            return res.redirect('/login');
        });

    });
});

app.use((req, res, next) => {
    res.status(404);
    res.send(`
        page not found
    `);
});

//Shutdown server CTRL + C in terminal

const mongoose_url = 'mongodb+srv://db-user:1NRtoZ9CBh1ZhuIh@harjoitustyo-7jgcr.mongodb.net/test?retryWrites=true&w=majority';

mongoose.connect(mongoose_url, {
    useUnifiedTopology: true,
    useNewUrlParser: true
}).then(() => {
    console.log('Mongoose connected');
    console.log('Start Express server');
    app.listen(PORT);
});