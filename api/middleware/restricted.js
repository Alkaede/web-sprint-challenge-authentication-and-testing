const jwt = require('jsonwebtoken');
const {jwtSecret } = require('../auth/secret.js');

module.exports = (req, res, next) => {
  next();
  /*
    IMPLEMENT

    1- On valid token in the Authorization header, call next.

    2- On missing token in the Authorization header,
      the response body should include a string exactly as follows: "token required".

    3- On invalid or expired token in the Authorization header,
      the response body should include a string exactly as follows: "token invalid".
  */

  // grabbing the token from our header 
  const token = req.header.authorization;

  if(!token){
    return res.status(401).json({message: 'token required'})
  }else{
    // checking the token for our requirements
    jwt.verify(token, jwtSecret, (err, decoded) => {
      if(err){
        res.status(401).json({message: 'token invalid'})
      }
      // have to decode our token when verifying
      req.decodedJwt = decoded;
      next();
    });
  }
};
