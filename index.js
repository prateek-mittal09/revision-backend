import express, { urlencoded } from "express";
import path from "path";
import mongoose, { mongo } from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"


const app = express();

const port = 5000;

mongoose
  .connect("mongodb://127.0.0.1:27017", {
    dbName: "backend",
  })
  .then(() => console.log("database connected"))
  .catch((e) => console.log(e));
const users = [];

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

app.use(express.static(path.join(path.resolve(), "public")));

const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const decoded = jwt.verify(token, "sadfghjkl");

    req.user = await User.findById(decoded._id);
    next();
  } else {
    return res.redirect("/login");
  }
};

app.get("/", isAuthenticated, (req, res) => {
  console.log(req.user);
  res.render("logout", { name: req.user.name });
});

app.get("/register", (req, res) => {
  res.render("register");
});



app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  let user = await User.findOne({ email });
  if (user) {
    return res.redirect("/login");
  }

  const hashedPassword = await bcrypt.hash(password,10)

  user = await User.create({ name, email, password:hashedPassword });
  const token = jwt.sign({ _id: user._id }, "sadfghjkl");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

app.post("/login",async(req,res)=>{

  const{email,password} = req.body

  let user = await User.findOne({email})

  if(!user) res.redirect("/register")

  const isMatch = await bcrypt.compare(password,user.password);

  if(!isMatch) return res.render("login",{email,message:"Incorrect Password"})

  const token = jwt.sign({ _id: user._id }, "sadfghjkl");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");

})

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", (req, res) => {
  res.cookie("token", null, { httpOnly: true, expires: new Date(Date.now()) });
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server is listening on port:${port}`);
});
