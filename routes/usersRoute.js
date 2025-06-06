import { Router } from "express";

import {getMe, deleteMe,updateMe} from "../controllers/usersController.js";
const usersRouter = Router();



usersRouter.put("/me", updateMe); // Update user profile
usersRouter.delete("/me", deleteMe); // Delete user profile
usersRouter.get("/", getMe); // Get user profile (for admin or self-view)




export default usersRouter
