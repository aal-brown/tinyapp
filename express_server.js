const express = require("express");
const app = express();

app.set("view engine", "ejs");

const PORT = 8080;

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars); //assumed .ejs extension, thus EJS knows to look in the "views" folder by default.
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});