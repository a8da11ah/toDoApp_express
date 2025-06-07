import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';


const authProtect = async (req, res, next) => {
  let accessToken 


  // 1. Try to get accessToken from Authorization header (preferred for mobile & some SPAs)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    accessToken = req.headers.authorization.split(' ')[1]; // Extract accessToken after "Bearer "
  }

  // 2. Try to get accessToken from cookie (preferred for web browsers)
  if (!accessToken && req.cookies.accessToken) {
    accessToken = req.cookies.accessToken;
  }
  
  

  
  if (!accessToken) return res.status(401).json({ message: 'No accessToken provided' });

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.id).select('-password -__v'); // Exclude password and version from the response

    if (!user) return res.status(404).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (err) {

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Access Token has expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid access token. Please log in again.' });
    }
    // Generic error for other issues
    console.error('Authentication error:', err); // Log the actual error for debugging
    return res.status(401).json({ message: 'Not authorized, token failed.' });  }
};

export default authProtect;