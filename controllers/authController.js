import User from "../models/userModel.js"
import RefreshToken from "../models/refreshTokenModel.js";
import { hashPassword, comparePassword ,
  setRefreshTokenToCookie,
   generateAccessToken,
   setAccessTokenToCookie,
   generateRefreshToken} from "../utils/authUtils.js";

import jwt from 'jsonwebtoken';










const register = async(req, res) => {

    try {
          const { name, email, password } = req.body;

      
        // check if user exists in db
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400)
            throw new Error("User already exists");
        }

        // hash password 
        // const hashedPassword = await hashPassword(password);
        // const verificationToken = Math.floor(100000+Math.random() * 900000).toString();

        // create user in db
        const user = await User.create(
            {
            name: name,
            email:email,
            password:password,
        });


        // generate token and set cookie
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        setAccessTokenToCookie(res,accessToken);
        setRefreshTokenToCookie(res, refreshToken);

        // save to db
        await RefreshToken.create({
                token: refreshToken,
                userId: user._id,
                // You can add deviceName, ipAddress etc. here from req object
                deviceName: req.headers['user-agent'], // Example
                ipAddress: req.ip, // Example
                });


        // send a 201 status code with user details
        res.status(201).json(
            { accessToken: accessToken, refreshToken: refreshToken } );

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

            res.status(400).json({ message: "User does not exist" });
            return; // Important: prevent further execution
        }
        // check if password is correct
        const match = await comparePassword(password,user.password);
        if (!match) {
          
            res.status(400).json({ message: "Invalid password" });
            return; // Important: prevent further execution
        }


        // update last login
        user.lastLogin = Date.now()
        await user.save()

        // generate access token and refresh token
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // set access token to cookie
        setRefreshTokenToCookie(res, refreshToken);
        setAccessTokenToCookie(res, accessToken);



        // check if refresh token already exists for the user
        // const existingRefreshToken = await RefreshToken.findByIdAndDelete({ userId: user._id });
        // if (existingRefreshToken) {
        //     // If it exists, delete the old refresh token
            
        //     await RefreshToken.create({
        //             token: refreshToken,
        //             userId: user._id,
        //             // You can add deviceName, ipAddress etc. here from req object
        //             deviceName: req.headers['user-agent'], // Example
        //             ipAddress: req.ip, // Example,
        //             previousToken: existingRefreshToken.token, // Store the old token for reuse detection if needed
        //         });
        // }

        // save to db
        await RefreshToken.create({
                token: refreshToken,
                userId: user._id,
                // You can add deviceName, ipAddress etc. here from req object
                deviceName: req.headers['user-agent'], // Example
                ipAddress: req.ip, // Example
            });


        // send a 200 status code with user details
        res.status(200).json(
            { accessToken: accessToken, refreshToken: refreshToken } );
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
    res.clearCookie('accessToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });  
    // Optionally, you can also clear the access token cookie if you set it


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
        res.clearCookie('accessToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

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
        const decoded = jwt.verify(clientRefreshToken, process.env.JWT_REFRESH_SECRET);

        // Find the refresh token that matches the client's token AND is not revoked
        let storedRefreshToken = await RefreshToken.findOne({
            token: clientRefreshToken,
            userId: decoded.id, // Ensure the user ID in token matches what's stored
            isRevoked: false
        });

        if (!storedRefreshToken) {
            // Case 1: Token not found or already revoked.
            // This could be an expired token not yet cleaned by TTL, or a genuine invalid/revoked token.
            // Or, more critically, it could be a reused OLD token if token rotation is active.

            // To handle token reuse (if `previousToken` is properly implemented):
            // Check if this token is a `previousToken` for *any* active refresh token of this user.
            const potentiallyReusedToken = await RefreshToken.findOne({
                previousToken: clientRefreshToken,
                userId: decoded.id,
                isRevoked: false,
            });

            if (potentiallyReusedToken) {
                // This means an old refresh token was used after rotation.
                // IMMEDIATE SECURITY ACTION: Revoke ALL refresh tokens for this user.
                // This prevents an attacker who might have compromised an old token from continuing to use it.
                await RefreshToken.updateMany(
                    { userId: decoded.id, isRevoked: false },
                    { $set: { isRevoked: true } }
                );
                // console.warn(`User ${decoded.id} detected using an old/reused refresh token. All tokens revoked.`);
                return res.status(403).json({ message: 'Security alert: Reused token detected. Please log in again.' });
            }

            // If it's not a reused old token, then it's just invalid/expired/not found.
            return res.status(401).json({ message: 'Invalid or expired refresh token. Please log in again.' });
        }

        // --- Token Rotation Logic ---

        // 1. Generate new tokens first
        const newAccessToken = generateAccessToken(decoded.id);
        const newRefreshToken = generateRefreshToken(decoded.id);

        // 2. Create the new refresh token record
        const newRefreshTokenDoc = await RefreshToken.create({
            token: newRefreshToken,
            userId: decoded.id,
            previousToken: clientRefreshToken, // Store for reuse detection
            deviceName: storedRefreshToken.deviceName, // Carry over device info
            ipAddress: storedRefreshToken.ipAddress, // Carry over IP
            // You might want to add `expiresAt` based on your JWT expiration logic
        });

        // 3. Invalidate/Delete the old refresh token record (after the new one is successfully saved)
        // If you're using `isRevoked`, it's safer to mark as revoked than delete immediately
        await RefreshToken.findByIdAndUpdate(storedRefreshToken._id, { $set: { isRevoked: true } });
        // Or, if immediate deletion is fine for your setup:
        // await RefreshToken.findByIdAndDelete(storedRefreshToken._id);


        // Set the new access token in a cookie (assuming this function is defined elsewhere)
        // setRefreshTokenToCookie(res, newRefreshToken); // This name is confusing, likely for Access Token

        // It's more common to send access token in body, refresh token in cookie for web.
        // If you mean to set the *new refresh token* to a cookie:
        setRefreshTokenToCookie(res, newRefreshToken); // Ensure this function sets the correct cookie name and flags
        setAccessTokenToCookie(res, newAccessToken); // Set the new access token in a cookie

        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken }); // Still send refresh token in body if preferred

    } catch (err) {
    // Log the full error object for detailed debugging
    console.error('Detailed Refresh token error:', err);
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    // If it's a Mongoose validation error, it might have `errors` property
    if (err.errors) {
        console.error('Mongoose Validation Errors:', err.errors);
    }
    // Also, potentially log the stack trace
    console.error('Error stack:', err.stack);


    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Refresh token has expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid refresh token. Please log in again.' });
    }
    // Generic error for other issues
    return res.status(500).json({ message: 'An internal server error occurred during token refresh.' });
}
};



export { register, login, logout , refreshToken ,logoutAll };


