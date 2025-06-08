import { Router } from "express";
import { getTasks, getTaskById, createTask, updateTask, deleteTask, updateSubtask, deleteSubtask, addSubtask} from "../controllers/tasksController.js";
import { validateBody , validateQuery } from "../middlewares/joiValidate.js";
import { getTasksQuerySchema, createTaskSchema, updateTaskSchema, addSubtaskSchema, updateSubtaskSchema } 
from "../validationsSchemas/tasksSchema.js";
const tasksRouter = Router();


// Base Task Routes
tasksRouter.route('/')
    .get(validateQuery(getTasksQuerySchema), getTasks) // Validate query parameters
    .post(validateBody(createTaskSchema), createTask); // Validate body


tasksRouter.route('/:id')
    .get(getTaskById)
    .put(validateBody(updateTaskSchema), updateTask) // Validate body (for partial updates)
    .delete(deleteTask);

// Nested Subtask Routes
tasksRouter.route('/:taskId/subtasks')
    .post(validateBody(addSubtaskSchema), addSubtask); // Validate body

tasksRouter.route('/:taskId/subtasks/:subtaskId')
    .put(validateBody(updateSubtaskSchema), updateSubtask) // Validate body (for partial updates)
    .delete(deleteSubtask);





export default tasksRouter
