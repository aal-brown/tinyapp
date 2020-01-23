//If the email is found, it returns the user id, otherwise it returns undefined
const getIDfromEmail = function(email,database) {
  for (let ids in database) {
    if (database[ids].email === email) {
      return database[ids].id;
    }
  }
};

//Returns the urls for a specific user, by searching the url object for matching id's. Returns an empty object if no matches found.
const urlsForUser = function(id, urldatabase) {
  let userURLs = {};
  for (let urls in urldatabase) {
    if (urldatabase[urls].userID === id) {
      userURLs[urls] = urldatabase[urls].longURL;
    }
  }
  return userURLs;
};

//Checks to see whether a given shorturl is associated with the id of the user making the request.
const checkSafe = function(id, shortURL, urldatabase) {
  let urlsForID = urlsForUser(id, urldatabase);
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

module.exports = {
  getIDfromEmail,
  urlsForUser,
  checkSafe,
  generateRandomString
};