const jwt = require('jsonwebtoken');
const User = require('../models/userSchema'); // Adjust path to your User model
function authenticateToken(req, res, next) {
    const token = req.cookies.token;
  
    if (!token) {
      return res.redirect('/login');
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.redirect('/login');
      }
      req.user = user;
      next();
    });
}  
module.exports = authenticateToken;