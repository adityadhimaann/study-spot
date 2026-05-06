const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = function(req, res, next) {
  const authHeader = req.header('Authorization');
  let token;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id; // Corrected from userId to id
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminAuth = async function(req, res, next) {
  auth(req, res, async () => {
    try {
      const user = await User.findById(req.user);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Admins only' });
      }
      next();
    } catch (err) {
      res.status(500).json({ message: 'Server error checking admin role' });
    }
  });
};

module.exports = { auth, adminAuth };
