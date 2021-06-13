const router = require('express').Router();
const jwt = require('jsonwebtoken');
const {jwtSecret} = require('../auth/secret');
const bcrypt = require('bcryptjs');

// bringing in our db since we dont have a user model
// (we weren't told to make one either)
const db = require('../../data/dbConfig');

router.post('/register', async (req, res) => {
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
  
  // middleware was causing issues so i brought the validation portion over
  function validCredentials(user){
    return Boolean(user.username && user.password && typeof user.password === "string" )
  }
  
  // checking to see user credentials
  if(validCredentials(req.body)){
    try{
      const {username, password} = req.body
      // setting the number of times we want our bcrypt before saving
      const rounds = process.env.BCRYPT_ROUNDS || 8;
      // I want to hash our password based on our rounds
      const hash = bcrypt.hashSync(password, rounds)
      // new user to add into the db with hashed password
      const newUser = {username, password: hash}
      // needed to make post asynchronus for it to add the new user
      const addedUser = await db('users').insert(newUser)
      res.json(addedUser.id)
    }catch{
      res.status(500).json({message: 'username taken'})
    }
  }else{
    res.status(400).json({message: 'username and password required'})
  }
});



router.post('/login', async (req, res) => {
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

  function validCredentials(user){
    return Boolean(user.username && user.password && typeof user.password === "string" )
  }

  // grabbing our info from our request body to use in our validation
  const { username, password } = req.body

  if(validCredentials(req.body)) {
    // grabbing our user data based on the unique username
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
      .catch(err => {
        res.status(500).json({message: err.message})
      })   
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
