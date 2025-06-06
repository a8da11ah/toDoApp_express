import { Router } from "express";
import {login, logout, register ,refreshToken ,logoutAll } from "../controllers/authController.js";
import { validateBody } from "../middlewares/joiValidate.js";
import { registerSchema, loginSchema } from "../validationsSchemas/authSchema.js";
import  authProtect  from "../middlewares/authProtect.js";
const authRouter = Router();



// apiRouter.use("/auth", authRouter)


//@desc register user
//@route POST /api/auth/register
//@access public
authRouter.post("/register",validateBody(registerSchema), register)



//@desc login user
//@route POST /api/auth/login
//@access public
authRouter.post("/login",validateBody(loginSchema), login)



//@desc logout user
//@route POST /api/auth/logout
//@access public
authRouter.post("/logout", logout)


// @desc refresh token
//@route POST /api/auth/refresh-token
//@access public
authRouter.post("/refresh-token", refreshToken)



authRouter.post("/logout-all",authProtect, logoutAll) // Logout from all devices
export default authRouter
