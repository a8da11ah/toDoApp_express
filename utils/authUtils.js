import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 }  from "uuid"
import dotenv from "dotenv"
dotenv.config()


const generateAccessToken = (id) => {
    return jwt.sign({ id },
       process.env.JWT_ACCESS_SECRET,
       { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" });
  };
const generateRefreshToken = (id) => {
    // Generate a unique identifier for the user
    const refreshTokenId = uuidv4();
    // Generate the refresh token
    const refreshToken = jwt.sign({ id, refreshTokenId },
       process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" });

    // Return the refresh token
    return refreshToken;
  };




const setRefreshTokenToCookie = (res,refreshToken)=>{

    // const token = jwt.sign({id},process.env.JWT_ACCESS_SECRET , {expiresIn:"1d"})

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true, // accessible only by the web server , protect from xss
        secure: process.env.NODE_ENV !== "development", // accessible only in https
        sameSite: "strict", // accessible only by the same site , protect from csrf
        maxAge: 7 * 24 * 60 * 60 * 1000 // 1 day
    })
}

const setAccessTokenToCookie = (res,accessToken)=>{

    // const token = jwt.sign({id},process.env.JWT_ACCESS_SECRET , {expiresIn:"1d"})

    res.cookie("accessToken", accessToken, {
        httpOnly: true, // accessible only by the web server , protect from xss
        secure: process.env.NODE_ENV !== "development", // accessible only in https
        sameSite: "strict", // accessible only by the same site , protect from csrf
        maxAge: 15 * 60 * 1000 // 15 minutes
    })
} 




// 🔐 Hashing the password
const hashPassword = async (password) => {
    const saltRounds = 10;
    const hashed = await bcrypt.hash(String(password), saltRounds);
    return hashed;
  };
  
  // 🔍 Verifying password
  const comparePassword = async (password, hashed) => {
    const match = await bcrypt.compare(password, hashed);
    return match; // true or false
  };


  export {setRefreshTokenToCookie,generateAccessToken,generateRefreshToken,hashPassword,comparePassword,setAccessTokenToCookie}