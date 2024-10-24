const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');
// app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render("index");
});

// multer knowledge
app.get("/files", (req, res) => {
  res.render("test");
});

app.get('/login', (req, res) => {
  res.render("login");
});

// profile
app.get('/profile', isLoggedIn , async (req, res) => {
//   console.log(req.user);
let user = await userModel.findOne({email: req.user.email}).populate("posts");
     // populate is used to get post from the id of poost
    res.render("profile", {user});
});

// like
app.get('/like/:id', isLoggedIn , async (req, res) => {
let post = await postModel.findOne({_id: req.params.id}).populate("user");

    if(post.likes.indexOf(req.user.userid) === -1) {
        post.likes.push(req.user.userid);
    }
    else{
        // post ke likes me se us index ke bande ko hatyo or kitne bande hatyo ek banda hatyo to ek like hat jayega 
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);
    }
    await post.save(); 
    res.redirect("/profile");
});

// post page 
app.post('/post', isLoggedIn , async (req, res) => {
    let user = await userModel.findOne({email: req.user.email});
    let {content} = req.body;
    let post = await postModel.create({
        user:user._id,
        content
    });

    user.posts.push(post._id);
    await user.save();
    res.redirect('/profile');
    });
   
// register routes
app.post('/register', async (req, res) => {
    let {email,password,username,age,name} = req.body;
    
    //   checking if the user already have account from the email address
    let user = await userModel.findOne({ email});
// user already has present 
if (user) return res.status(500).send("User already Present");

// create a new user
bcrypt.genSalt(10 , (err, salt) => {
    // console.log(salt);
    bcrypt.hash(password, salt, async (err, hash) => {
        // console.log(hash);
       let user =  await userModel.create({
            username,
            email,
            password: hash,
            age,
            name
        });
      let token = jwt.sign({email:email, userid : user._id}, "shhhh");
      res.cookie("token", token);
      res.status(200).send("User Created Successfully");
    });
});
});

// login routes
app.post('/login', async (req, res) => {
    let {email,password} = req.body;
    
    //   checking if the user already have account from the email address
    let user = await userModel.findOne({ email});
// user not present
if (!user) return res.status(500).send("Something went wrong");

bcrypt.compare(password, user.password , function(err, result) {
    if(result) {
        let token = jwt.sign({email:email, userid : user._id}, "shhhh");
        res.cookie("token", token);
        res.status(200).redirect("/profile");
    }
    else res.redirect("/login");
});
});

// logout routes
app.get('/logout', async (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
});

// edit
app.get('/edit/:id', isLoggedIn , async (req, res) => {
    // sabse pehle post dundhna hai 
    let post = await postModel.findOne({_id: req.params.id}).populate("user");
    
      res.render("edit", {post});  
    });

// update post
app.post('/update/:id', isLoggedIn , async (req, res) => {
    // sabse pehle post dundhna hai 
    let post = await postModel.findOneAndUpdate({_id: req.params.id},{content: req.body.content});
      res.redirect("/profile");  
    });


// middleware for protected routes to verify the token is present 
function isLoggedIn(req,res,next){
    if(req.cookies.token === "") res.redirect("/login");
    else{
    let data = jwt.verify(req.cookies.token , "shhhh");
    req.user = data;
    next();
}
};

app.listen(3000);