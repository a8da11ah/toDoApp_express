import { Router } from "express";
import {getMe, deleteMe,updateMe} from "../controllers/usersController.js";
import { updateUserProfileSchema } from "../validationsSchemas/usersSchem.js";
import { validateBody} from "../middlewares/joiValidate.js";
const usersRouter = Router();



usersRouter.put("/me", updateMe); // Update user profile
usersRouter.delete("/me",validateBody(updateUserProfileSchema), deleteMe); // Delete user profile
usersRouter.get("/", getMe); // Get user profile (for admin or self-view)




export default usersRouter
