const { getAuth } = require('firebase-admin/auth');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If no token is provided, proceed without setting req.user
    // The controller can decide if it wants to block the request or handle it anonymously
    req.user = null;
    return next();
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = { verifyToken };
