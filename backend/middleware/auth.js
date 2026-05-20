const jwt = require('jsonwebtoken');

const protect = (roles = []) => {
  return (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ error: 'تکایە پێشتر بچۆ ژوورەوە' });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: 'مافت نییە' });
      }
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'توکەنی نادروست' });
    }
  };
};

module.exports = { protect };
