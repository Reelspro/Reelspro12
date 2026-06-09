const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'reels_pro_ultimate_secret';

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      
      req.user = decoded; // { id, role, status }
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Not authorized as an admin' });
  }
};

const requireApproved = (req, res, next) => {
  if (req.user && req.user.status === 'approved') {
    next();
  } else {
    res.status(403).json({ error: 'Account pending approval or suspended' });
  }
};

module.exports = { protect, admin, requireApproved };
