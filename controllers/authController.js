import User from "../models/userModel.js"
import RefreshToken from "../models/refreshTokenModel.js";
import { hashPassword, comparePassword ,setRefreshTokenToCookie, generateAccessToken,generateRefreshToken} from "../utils/authUtils.js";
// import { generateTokenAndCookie } from "../utils/tokenUtils.js";











const register = async(req, res) => {
    const { name, email, password } = req.body;

    try {
      
        // check if user exists in db
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400)
            throw new Error("User already exists");
        }

        // hash password 
        const hashedPassword = await hashPassword(password);
        // const verificationToken = Math.floor(100000+Math.random() * 900000).toString();

        // create user in db
        const user = await User.create(
            {
            name: name,
            email:email,
            password:hashedPassword,
        });


        // generate token and set cookie
        const token = generateAccessToken(user._id);
        setAccessTokenToCookie(res,token);
        // generate refresh token and save to db
        const refreshToken = generateRefreshToken(user._id);
        await RefreshToken.create({
                token: refreshToken,
                userId: user._id,
                // You can add deviceName, ipAddress etc. here from req object
                deviceName: req.headers['user-agent'], // Example
                ipAddress: req.ip, // Example
                });

        // await sendEmailVerification(user.email,user.verificationToken)

        // send a 201 status code with user details
        res.status(201).json(
            { accessToken: token, refreshToken: refreshToken } );

    } catch (error) {
        res.status(400)
        throw new Error(error.message);
    }

}
const login = async(req, res) => {
    const { email, password } = req.body;

    try {
      
        // check if user exists in db
        const user = await User.findOne({ email });
        if (!user) {
            res.status(400)
            throw new Error("User does not exist");
        }
        // check if password is correct
        const match = await comparePassword(password,user.password);
        if (!match) {
            res.status(400)
            throw new Error("Invalid password");
        }


        // update last login
        user.lastLogin = Date.now()
        await user.save()

        // generate access token and refresh token
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // set access token to cookie
        setRefreshTokenToCookie(res, refreshToken);



        await RefreshToken.create({
                token: refreshToken,
                userId: user._id,
                // You can add deviceName, ipAddress etc. here from req object
                deviceName: req.headers['user-agent'], // Example
                ipAddress: req.ip, // Example
            });


        // send a 200 status code with user details
        res.status(200).json(
            { accessToken: token, refreshToken: refreshToken } );
    } catch (error) {
        res.status(400)
        throw new Error(error.message);
    }

}


const logout = async(req, res) => {
    // res.send("logout")
  const clientRefreshToken = req.body.refreshToken || req.cookies.refreshToken;

  if (!clientRefreshToken) {
    return res.status(200).json({ message: 'Already logged out or no token provided.' });
  }

  try {
    // Find and delete the specific refresh token
    await RefreshToken.deleteOne({ token: clientRefreshToken });

    // For browser clients, clear the cookie
    res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Failed to log out.' });
  }
}

const logoutAll = async (req, res) => {
    const userId = req.user._id; // Assuming you have user info in req.user

    try {
        // Delete all refresh tokens for the user
        await RefreshToken.deleteMany({ userId });

        // Clear the cookie for the user
        res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

        res.status(200).json({ message: 'Logged out from all devices successfully.' });
    } catch (error) {
        console.error('Error logging out from all devices:', error);
        res.status(500).json({ message: 'Failed to log out from all devices.' });
    }

  }






const refreshToken = async(req, res) => {
    const clientRefreshToken = req.body.refreshToken || req.cookies.refreshToken;

if (!clientRefreshToken) {
  return res.status(401).json({ message: 'No refresh token provided.' });
}

try {
  // 1. Verify the refresh token's signature and basic validity (e.g., format)
  const decoded = jwt.verify(clientRefreshToken, process.env.JWT_REFRESH_SECRET);

  // 2. Look up the refresh token in the database
  const storedRefreshToken = await RefreshToken.findOne({
    token: clientRefreshToken,
    userId: decoded.userId, // Ensure the user ID in token matches what's stored
    isRevoked: false, // Make sure it's not explicitly revoked
  });

  if (!storedRefreshToken) {
    // This could indicate a stolen/invalid token or an expired token not yet cleaned by TTL
    // Or if rotation is used, it might be an old, reused token.
    // For security, if `previousToken` is implemented, you might want to revoke all tokens for this user
    // if an old token is detected being reused.
    // console.warn('Attempt to use invalid or revoked refresh token:', clientRefreshToken);
    return res.status(401).json({ message: 'Invalid or expired refresh token. Please log in again.' });
  }

  // 3. Optional: Implement refresh token rotation
  // Invalidate the current refresh token record in the DB
  await RefreshToken.findByIdAndDelete(storedRefreshToken._id); // Delete the old token



  // Generate new access and refresh tokens
  const newAccessToken = generateAccessToken(decoded.userId);

  const newRefreshToken = generateRefreshToken(decoded.userId);


  // Save the new refresh token in the database
  await RefreshToken.create({
    token: newRefreshToken,
    userId: decoded.userId,
    previousToken: clientRefreshToken, // Store for reuse detection if desired
    deviceName: storedRefreshToken.deviceName, // Carry over device info
    ipAddress: storedRefreshToken.ipAddress, // Carry over IP
  });
    // Set the new access token in a cookie
    setRefreshTokenToCookie(res,  newRefreshToken);

  res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });

} catch (err) {
  console.error('Refresh token error:', err);

  if (err.name === 'TokenExpiredError') {
    
    return res.status(401).json({ message: 'Refresh token has expired. Please log in again.' });
  }
  return res.status(401).json({ message: 'Invalid refresh token. Please log in again.' });
}
}



export { register, login, logout , refreshToken ,logoutAll };


