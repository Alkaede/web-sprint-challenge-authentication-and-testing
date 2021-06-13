const router = require('express').Router();
const jwt = require('jsonwebtoken');
const {jwtSecret} = require('../auth/secret');
const bcrypt = require('bcryptjs');
const checkCredentials = require('../middleware/check-payload');

// bringing in our db since we dont have a user model
// (we weren't told to make one either)
const db = require('../../data/dbConfig');

router.post('/register',checkCredentials,(req, res, next) => {
  /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.
    DO NOT EXCEED 2^8 ROUNDS OF HASHING!

    1- In order to register a new account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel", // must not exist already in the `users` table
        "password": "foobar"          // needs to be hashed before it's saved
      }

    2- On SUCCESSFUL registration,
      the response body should have `id`, `username` and `password`:
      {
        "id": 1,
        "username": "Captain Marvel",
        "password": "2a$08$jG.wIGR2S4hxuyWNcBf9MuoC4y0dNy7qC/LbmtuFBSdIhWks2LhpG"
      }

    3- On FAILED registration due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED registration due to the `username` being taken,
      the response body should include a string exactly as follows: "username taken".
  */
  let user = req.body

  // checking to see user credentials
  if(checkCredentials(user)){
    // setting the number of times we want our bcrypt before saving
    const rounds = process.env.BCRYPT_ROUNDS || 8;
    const hash = bcrypt.hashSync(user.password, rounds)
    
    // I want to hash our password based on our rounds
    user.password = hash
    return db('users').insert(user)
      .then(userData => {
        res.status(201).json(userData)
      })
      .catch(next)
      
  }else{
    res.status(400).json({message: 'username is already in use'})
  }


});

router.post('/login', checkCredentials, async (req, res, next) => {
  /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.

    1- In order to log into an existing account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel",
        "password": "foobar"
      }

    2- On SUCCESSFUL login,
      the response body should have `message` and `token`:
      {
        "message": "welcome, Captain Marvel",
        "token": "eyJhbGciOiJIUzI ... ETC ... vUPjZYDSa46Nwz8"
      }

    3- On FAILED login due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED login due to `username` not existing in the db, or `password` being incorrect,
      the response body should include a string exactly as follows: "invalid credentials".
  */
  const { username, password } = req.body

  if(checkCredentials(username)) {
    // grabbing our user data based on the hashed password in the database
    await db('users').where( "username", username)
      .then(([user]) => {
        // comparing our user hash to the one in the db making sure its the proper user/credential
        if(user && bcrypt.compareSync( password, user.password)) {
          const token = makeToken(user)
          res.status(200).json({ message:`Welcome back ${user.username}`, token })
        } else {
          res.status(401).json({ message: 'Invalid credentials' })
        }
      })
      .catch(next)   
  } else {
    res.status(400).json({
      message: "username and password required"
    })
  }
});


function makeToken(user){
// jsonwebtoken required library modules for a proper payload
  const payload = {
    // our token payloads, grabbing our user id and username
    subject: user.id,
    username: user.username
  }
  // expiration time for our token (will auto logout the user)
  const options = {
    expiresIn: '500s'
  }
  return jwt.sign(payload, jwtSecret, options)
}


module.exports = router;
