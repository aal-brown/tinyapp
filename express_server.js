//====================================================================INCLUDES & CONSTANTS===================================================================//

const express = require("express");
const app = express();
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const { getIDfromEmail, urlsForUser, checkSafe, generateRandomString, getDate } = require("./helpers.js");
app.set("view engine", "ejs");

app.use(cookieSession({
  name: "session",
  keys: ["adawawz121"],

  maxAge: 24 * 60 * 60 * 1000
}));

app.use(bodyParser.urlencoded({extended: true}));

const PORT = 8080;


//====================================================================GLOBAL "VARIABLES"===================================================================//

const urlDatabase = {};

const users = {

  addUser: function(reqBody) {
    let newID = generateRandomString();
    users[newID] = {
      id: newID,
      email: reqBody.email,
      password: bcrypt.hashSync(reqBody.password, 10)
    };
    return newID;
  }
};


//====================================================================GET REQUESTS===================================================================//

app.get("/", (req, res) => {
  res.redirect("/urls"); // ends the request-response loop and gives a message.
});


//The following was part of the code we were asked to write, however it would give anyone who access the link access to the urlDatabase, so I've removed it from the code. If this was a real page, this would be very poor programming.
/* app.get("/urls.json", (req, res) => {
  res.json(urlDatabase); // the.json method parses incoming requests with JSON payloads
}); */


app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n"); //Incorporating HTML elements to stylize the page
});


//If a get request to the /urls page is made, and the user id is undefined, it doesn't display any data. Otherwise it will display whatever is associated with that user id.
app.get("/urls", (req, res) => {
  let userID = req.session.user_id;
  let templateVars = {};
  if (userID === undefined) {
    templateVars = {
      userID : undefined,
      urls: ""
    };
  } else {
    let urlsForID = urlsForUser(userID, urlDatabase);
    templateVars = {
      userID : users[userID],
      urls: urlsForID
    };
  }
  res.render("urls_index", templateVars);
});


//This needs to be above the :shortURL because otherwise any calls to urls new will be handled by the :shortURL.
app.get("/urls/new", (req, res) => {
  let userID = req.session.user_id;
  let templateVars = {
    userID : users[userID]
  };
  if (userID === undefined) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});


//Goes to the registration page, has to be above the :shortURL because otherwise "registration" will be treated as the new url on the urls_show page.
app.get("/register", (req, res) => {
  let userID = req.session.user_id;
  let templateVars = {
    userID : users[userID]
  };
  res.render("register", templateVars);
});


app.get("/urls/:shortURL", (req, res) => {
  let userID = req.session.user_id;
  if (userID === undefined) {
    res.status(403).send("Permission denied.");
  } else if (checkSafe(userID, req.params.shortURL, urlDatabase)) {
    let templateVars = {
      userID : users[userID],
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL
    };
    res.render("urls_show", templateVars);

  } else {
    res.status(403).send("Permission denied.");
  }
});


//This handles the actual use of the shortened links
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    urlDatabase[req.params.shortURL].uses = urlDatabase[req.params.shortURL].uses + 1;
    res.redirect(longURL);
  } else {
    res.status(404).send("Link doesn't exist.");
  }
});


app.get("/login", (req, res) => {
  let userID = req.session.user_id;
  let templateVars = {
    userID : users[userID],
  };
  res.render("login", templateVars);
});


//====================================================================POST REQUESTS===================================================================//

app.post("/urls", (req, res) => {
  let userID = req.session.user_id;
  if (userID === undefined) {
    res.send("You must be logged-in to use that feature.");
  } else {
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {"longURL": req.body["longURL"], "userID": userID, date: getDate(), uses: 0};
    res.redirect(`/urls/${shortURL}`);
    console.log(urlDatabase);
  }
});


//Handles the delete button from the "main" page.
app.post("/urls/:shortURL/delete", (req, res) => {
  let userID = req.session.user_id;
  if (checkSafe(userID, req.params.shortURL, urlDatabase)) { //Checks access
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(403).send("Permission denied.");
  }
});


//This code is used for edit requests from the main urls page.
app.post("/urls/:shortURL", (req, res) => {
  let userID = req.session.user_id;
  if (userID === undefined) {
    res.status(403).send("Permission denied.");
  } else if (checkSafe(userID, req.params.shortURL, urlDatabase)) {
    let templateVars = {
      userID : users[userID],
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL
    };
    res.render("urls_show", templateVars);
  } else {
    res.status(403).send("Permission denied.");
  }
});


//This is used for the edit requests at the urls_show page
app.post("/urls/:shortURL/edit", (req, res) => {
  let userID = req.session.user_id;
  if (userID === undefined) {
    res.status(403).send("Permission denied.");

  } else if (checkSafe(userID, req.params.shortURL, urlDatabase)) {
    let templateVars = {
      userID : users[userID],
      shortURL: req.params.shortURL,
      longURL: req.body.longURL
    };
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    urlDatabase[req.params.shortURL].date = getDate();
    res.render("urls_show", templateVars);
    console.log(urlDatabase);
  } else {
    res.send("Permission denied.");
  }
});


//Handles the login page, will respond with various errors if
app.post("/login", (req, res) => {
  let userID = getIDfromEmail(req.body.email, users);
  if (!req.body.email || !req.body.password) {
    res.status(400).redirect("/login");
  } else if (userID === undefined) {
    res.status(403).redirect("/login");
  } else if (!bcrypt.compareSync(req.body.password, users[userID].password)) {
    res.status(403).redirect("/login");
  } else {
    req.session.user_id = userID;
    res.redirect("/urls");
  }
});


//This handles the logout request, it clears the cookie of the username and redirects back to the main page.
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});


//This handles registration, it checks the supplied inputs and sends the appropriate response
app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).send("Invalid entry.");
  } else if (getIDfromEmail(req.body.email, users)) {
    res.status(400).send("Email already in use.");
  } else {
    req.session.user_id = users.addUser(req.body);
    res.redirect("/urls");
  }
});


//====================================================================START THE SERVER===================================================================//

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});