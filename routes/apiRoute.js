import { Router } from "express";
import authProtect from "../middlewares/authProtect.js";


const apiRouter = Router();

import authRouter from "./authRoute.js"
import usersRouter from "./usersRoute.js"
import projectsRouter from "./projectsRoute.js"
import tasksRouter from "./tasksRoute.js"
import categoriesRouter from "./categoriesRoute.js";



// Public routes

apiRouter.use("/auth", authRouter)


// Note: The authRouter handles authentication routes like login, register, etc.
// These routes do not require authentication, so they are placed before the authProtect middleware.
// The authProtect middleware will be applied to all routes below this line, ensuring that only authenticated users can access them.
// Protected routes
apiRouter.use(authProtect); // Apply authProtect middleware to all routes below this line
apiRouter.use("/users", usersRouter);
apiRouter.use("/projects", projectsRouter);
apiRouter.use("/tasks", tasksRouter);
apiRouter.use("/categories", categoriesRouter);

export default apiRouter
