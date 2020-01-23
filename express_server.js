//====================================================================INCLUDES & CONSTANTS===================================================================//
const express = require("express");
const app = express();
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

app.set("view engine", "ejs");

app.use(cookieSession({
  name: "session",
  keys: ["adawawz121"],

  maxAge: 24 * 60 * 60 * 1000
}));


const PORT = 8080;

//====================================================================GLOBAL FUNCTIONS & OBJECTS===================================================================//
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
  },
  
  //If the email is found, it returns the user id, otherwise it returns undefined
  getIDfromEmail: function(email) {
    for (let ids in users) {
      if (users[ids].email === email) {
        return users[ids].id;
      }
    }
  }
};

//Returns the urls for a specific user, by searching the url object for matching id's. Returns an empty object if no matches found.
const urlsForUser = function(id) {
  let userURLs = {};
  for (let urls in urlDatabase) {
    if (urlDatabase[urls].userID === id) {
      userURLs[urls] = urlDatabase[urls].longURL;
    }
  }
  return userURLs;
};

//Checks to see whether a given shorturl is associated with the id of the user making the request.
const checkSafe = function(id, shortURL) {
  let urlsForID = urlsForUser(id);
  for (let shorturls in urlsForID) {
    if (shorturls === shortURL) {
      return true;
    }
  }
  return false;
};


//toString(36) means to use any numbers from 0 to 9 and any letters from a to z. So 26+10 = 36
const generateRandomString = function() {
  return Math.random().toString(36).substr(2,6);
};

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


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
    let urlsForID = urlsForUser(userID);
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
  let templateVars = {
    userID : users[userID],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  res.render("urls_show", templateVars);
});

//This handles the actual use of the shortened links
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
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
    urlDatabase[shortURL] = {"longURL": req.body["longURL"], "userID": userID};
    res.redirect(`/urls/${shortURL}`);
  }
});


//Handles the delete button from the "main" page.
app.post("/urls/:shortURL/delete", (req, res) => {
  let userID = req.session.user_id;
  if (checkSafe(userID, req.params.shortURL)) { //Checks access
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.send("Permission denied.");
  }
});


//This code is used for edit requests from the main urls page.
app.post("/urls/:shortURL", (req, res) => {
  let userID = req.session.user_id;
  let templateVars = {
    userID : users[userID],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  res.render("urls_show", templateVars);
});


//This is used for the edit requests at the urls_show page
app.post("/urls/:shortURL/edit", (req, res) => {
  let userID = req.session.user_id;
  if (checkSafe(userID, req.params.shortURL)) {
    let templateVars = {
      userID : users[userID],
      shortURL: req.params.shortURL,
      longURL:req.body.longURL
    };
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.render("urls_show", templateVars);
  } else {
    res.send("Permission denied.");
  }
});


//Handles the login page, will respond with various errors if
app.post("/login", (req, res) => {
  let userID = users.getIDfromEmail(req.body.email);
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
  } else if (users.getIDfromEmail(req.body.email)) {
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