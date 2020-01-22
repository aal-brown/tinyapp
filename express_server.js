const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");
app.use(cookieParser());

const PORT = 8080;

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {

  addUser: function (reqBody) {
    let newID = generateRandomString();
    users[newID] = {
      id: newID,
      email: reqBody.body.email,
      password: reqBody.body.password,
    };
  }
};

class Users {
  constructor(userID, email, password) {
    this.id = userID;
    this.email = email;
    this.password = password;
  }
}




//toString(36) means to use any numbers from 0 to 9 and any letters from a to z. So 26+10 = 36
function generateRandomString() {
  return Math.random().toString(36).substr(2,6)
};

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", (req, res) => {
  res.send("Hello!"); // ends the request-response loop and gives a message.
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase); // the.json method parses incoming requests with JSON payloads
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n"); //Incorporating HTML elements to stylize the page
});

app.get("/urls", (req, res) => {
  let templateVars = { username: req.cookies["username"],
    urls: urlDatabase };
  res.render("urls_index", templateVars); //assumed .ejs extension, thus EJS knows to look in the "views" folder by default.
});

//This needs to be above the :shortURL because otherwise any calls to urls new will be handled by the :shortURL.
app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

//Goes to the registration page, has to be above the :shortURL because otherwise "registration" will be treated as the new url on the urls_show page.
app.get("/register", (req, res) => {
  let templateVars = { username: req.cookies["username"] };
  res.render("urls_registration", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { username: req.cookies["username"],
    shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});
//The render command is basically saying, that when we make a get request for the shortURL, we will respond by sending a rendered urls_show file.

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body["longURL"];
  //console.log(req.body);  // Log the POST request body to the console
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  //console.log(req.body);  // Log the POST request body to the console
  res.redirect(`/urls`);
});

//This code is used for edit requests from the main urls page.
app.post("/urls/:shortURL", (req, res) => {
  let templateVars = { username: req.cookies["username"],
    shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});

//This is used for the edit requests at the urls_show page
app.post("/urls/:shortURL/edit", (req, res) => {
  let templateVars = { username: req.cookies["username"],
    shortURL: req.params.shortURL, longURL: req.body.longURL};
  urlDatabase[req.params.shortURL] = req.body.longURL;
  console.log(templateVars)
  res.render("urls_show", templateVars);
});

app.post("/login", (req, res) => {
  res.cookie("username",req.body.username);
  // let templateVars = {
  //   username: req.cookies["username"],
  //   urls: urlDatabase
  // };
  res.redirect("/urls");
});

//This handles the logout request, it clears the cookie of the username and redirects back to the main page.
app.post("/logout", (req, res) => {
  res.clearCookie("username", req.body.username);
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  users.addUser(req.body)
  console.log(users);
  res.redirect("/urls");
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});