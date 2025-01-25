const bcrypt = require('bcrypt');
const express = require("express");
const bodyParser = require("body-parser");
const axios = require('axios');

if (process.env.NODE_ENV != "production") {
  require('dotenv').config();
}

const app=express();
//const mysql=require('mysql2');
const path = require("path");
const methodOverride = require('method-override');
const port=process.env.PORT||3000;



const session = require('express-session');

app.use(session({
    secret: process.env.SECRET, 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

app.set('views',path.join(__dirname,'/views'));
app.set('view engine','ejs');
app.use(express.json());
app.use(methodOverride('_method'));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}));
//app.use(express.urlencoded());


//Database Connection
const mongoose =require("mongoose");
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

const Register = require("./models/register");
const Download=require('./models/downloads');
const Company = require('./models/company'); // Import your Company model

app.use("/styles",express.static(__dirname + "/styles"));

//
// const { isLoggedIn, isAuthor, catchAsyncError, isReviewOwner, validateEvent} = require('./middleware');


//Controllers
const placeController = require('./controllers/places');

// FOR IMAGES
const multer = require('multer');
// const upload = multer({dest: 'uploads/'});
const { storage } = require('./cloudinary/index');
const upload = multer({ storage }); // now instead of storing locally we store in cloudinary storage
const cloudinary = require('cloudinary');


const {catchAsyncError} = require('./middleware');
const { log } = require('console');

//

app.get("/",(req,res)=>{
    res.render("home");
});

app.get("/home",(req,res)=>{
  res.render("home");
});
app.get("/ulogin",(req,res)=>{
    res.render("ulogin");
  });

  app.post('/ulogin', async (req, res) => {
    try {
        const { U_ID, UPassword } = req.body;
        
        const user = await Register.findOne({ username: U_ID });
        //console.log(user);
        if (!user) {
            return res.render('ulogin', { error: 'Invalid username or password' });
        }
        const isMatch = await bcrypt.compare(UPassword, user.password);
        
        if (!isMatch) {
            return res.render('ulogin', { error: 'Invalid username or password' });
        }

        // Create session
        req.session.user = user;
        req.session.isAuthenticated = true;
        
        res.redirect('/usercat');
    } catch (error) {
        console.error(error);
        res.render('ulogin', { error: 'An error occurred' });
    }
});

  app.get('/usershow/:id', catchAsyncError(placeController.ushowParticularPlace));

//   app.post('/ulogin',(req,res)=>{
//       res.redirect("/catalouge");
//     });

  app.get("/alogin",(req,res)=>{
    res.render("alogin");
  });

  app.post('/alogin',(req,res)=>{
    res.redirect("cat");
  });

  // app.get("/cat",(req,res)=>{
  //   res.render("cat");
  // });

  // app.get("/add",(req,res)=>{
  //   res.render("add");
  // });

  app.get('/cat',  catchAsyncError(placeController.showAll));
  app.get('/usercat',  catchAsyncError(placeController.ushowAll));

  app.get('/add', placeController.addPlaceForm);

  app.post('/add', upload.array('images'), async (req, res) => {
    try {
        const { name, description, items } = req.body;
        const images = req.files.map(file => ({ url: file.path, filename: file.filename }));

        const newCompany = new Company({
            name,
            description,
            images,
            items
        });

        await newCompany.save();
        res.redirect('/cat');
    } catch (error) {
        console.error('Error adding company:', error);
        res.status(500).send('Error adding company: ' + error.message);
    }
  });

  app.get('/show/:id', catchAsyncError(placeController.showParticularPlace));

// UPDATE FORM
app.get('/place/:id',  catchAsyncError(placeController.updateForm));

// UPDATE IN DB
app.put('/place/:id',  upload.array('images'),catchAsyncError(placeController.updateInDB));

// DELETE PLACE
app.delete('/place/:id',   catchAsyncError(placeController.deletePlace));

  app.get("/register",(req,res)=>{
    res.render("register");
  });

  app.post("/register", async (req, res) => {
    try {
        const { username, password, confirmpassword } = req.body;

        if (password !== confirmpassword) {
            return res.render('register', { error: 'Passwords do not match' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const registerUser = new Register({
            username: username,
            password: hashedPassword
        });

        await registerUser.save();
        res.redirect("/ulogin");
    } catch (error) {
        console.error(error);
        res.render('register', { error: 'Registration failed' });
    }
});

app.post('/clickdownload/:id', async (req, res) => {
    const { id } = req.params;
    console.log("Received POST request to /clickdownload with ID:", id);

    // Increment download count logic
    let exist = await Download.findOne({ Numberofdownloads: id });
    if (!exist) {
        const newobj = new Download({
            Numberofdownloads: id,
            downloads: 0
        });
        await newobj.save();
        exist = newobj;
    } else {
        exist.downloads += 1;
        await exist.save();
    }

    const num = exist.downloads;

    // Retrieve the company by ID
    const company = await Company.findById(id);
    if (!company) {
        return res.status(404).send('Company not found');
    }

    // Assuming you want to download the first image in the images array
    if (company.images.length === 0) {
        return res.status(404).send('No images available for download');
    }

    const fileUrl = company.images[0].url; // Get the URL of the first image

    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });

        // Set headers for PDF download
        res.setHeader('Content-Disposition', 'attachment; filename="file.pdf"');
        res.setHeader('Content-Type', 'application/pdf');
        res.send(response.data);
    // Redirect to the file URL to prompt download
    //res.redirect(fileUrl);
});

// Add middleware to protect routes
const requireLogin = (req, res, next) => {
    if (!req.session.isAuthenticated) {
        return res.redirect('/ulogin');
    }
    next();
};

// Protect routes that need authentication
app.get('/usercat', requireLogin, catchAsyncError(placeController.ushowAll));
app.get('/usershow/:id', requireLogin, catchAsyncError(placeController.ushowParticularPlace));


app.listen(port,()=>{
    console.log(`Server listening at port ${port}`);
})