import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';


const authProtect = async (req, res, next) => {
  let token 


  // 1. Try to get token from Authorization header (preferred for mobile & some SPAs)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]; // Extract token after "Bearer "
  }

  // 2. Try to get token from cookie (preferred for web browsers)
  if (!token && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  
  

  
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password -__v'); // Exclude password and version from the response

    if (!user) return res.status(404).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (err) {

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token. Please log in again.' });
    }
    // Generic error for other issues
    console.error('Authentication error:', err); // Log the actual error for debugging
    return res.status(401).json({ message: 'Not authorized, token failed.' });  }
};

export default authProtect;