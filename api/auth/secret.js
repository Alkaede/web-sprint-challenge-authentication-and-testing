//setting up a secret for our web token
module.exports = { 
  jwtSecret: process.env.JWT_SECRET || 'only cool people can see this'
}