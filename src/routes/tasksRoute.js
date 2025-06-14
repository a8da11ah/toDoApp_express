import { Router } from "express";
import { getTasks, getTaskById, createTask, updateTask, deleteTask, updateSubtask, deleteSubtask, addSubtask} from "../controllers/tasksController.js";
import { validateBody , validateQuery } from "../middlewares/joiValidate.js";
import { getTasksQuerySchema, createTaskSchema, updateTaskSchema, addSubtaskSchema, updateSubtaskSchema }
from "../validationsSchemas/tasksSchema.js";

const tasksRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Subtask:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the subtask
 *         title:
 *           type: string
 *           description: The title of the subtask
 *         isCompleted:
 *           type: boolean
 *           default: false
 *           description: Whether the subtask is completed
 *         completedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When the subtask was completed
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the subtask was created
 *       example:
 *         _id: 60d0fe4f5311236168a109cd
 *         title: "Review design mockups"
 *         isCompleted: false
 *         completedAt: null
 *         createdAt: 2023-06-22T09:32:15.000Z
 *     
 *     Task:
 *       type: object
 *       required:
 *         - title
 *         - userId
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the task
 *         title:
 *           type: string
 *           description: The title of the task
 *         description:
 *           type: string
 *           description: The description of the task
 *         status:
 *           type: string
 *           enum: [Pending, In Progress, Completed, On Hold]
 *           default: Pending
 *           description: The status of the task
 *         priority:
 *           type: string
 *           enum: [Low, Medium, High]
 *           default: Medium
 *           description: The priority level of the task
 *         isCompleted:
 *           type: boolean
 *           default: false
 *           description: Whether the task is completed
 *         dueDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: The due date of the task
 *         completedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When the task was completed
 *         ProjectId:
 *           type: string
 *           nullable: true
 *           description: The ID of the associated project
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of category IDs
 *         subtasks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Subtask'
 *           description: Array of subtasks
 *         userId:
 *           type: string
 *           description: The ID of the user who owns the task
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the task was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the task was last updated
 *         subtaskStats:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             completed:
 *               type: integer
 *             completionPercentage:
 *               type: integer
 *           description: Statistics about subtasks (included in responses)
 *       example:
 *         _id: 60d0fe4f5311236168a109ca
 *         title: "Implement user authentication"
 *         description: "Add JWT-based authentication system"
 *         status: "In Progress"
 *         priority: "High"
 *         isCompleted: false
 *         dueDate: "2023-06-30T23:59:59.000Z"
 *         completedAt: null
 *         ProjectId: 60d0fe4f5311236168a109cb
 *         categories: ["60d0fe4f5311236168a109cc"]
 *         subtasks: []
 *         userId: 60d0fe4f5311236168a109cd
 *         createdAt: 2023-06-22T09:32:15.000Z
 *         updatedAt: 2023-06-22T09:32:15.000Z
 *     
 *     TaskInput:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *           description: The title of the task
 *         description:
 *           type: string
 *           description: The description of the task
 *         status:
 *           type: string
 *           enum: [Pending, In Progress, Completed, On Hold]
 *           default: Pending
 *           description: The status of the task
 *         priority:
 *           type: string
 *           enum: [Low, Medium, High]
 *           default: Medium
 *           description: The priority level of the task
 *         dueDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: The due date of the task
 *         projectId:
 *           type: string
 *           nullable: true
 *           description: The ID of the associated project
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of category IDs
 *         subtasks:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *           description: Array of initial subtasks
 *         isCompleted:
 *           type: boolean
 *           default: false
 *           description: Whether the task is completed
 *       example:
 *         title: "Implement user authentication"
 *         description: "Add JWT-based authentication system"
 *         status: "Pending"
 *         priority: "High"
 *         dueDate: "2023-06-30T23:59:59.000Z"
 *         projectId: "60d0fe4f5311236168a109cb"
 *         categories: ["60d0fe4f5311236168a109cc"]
 *         isCompleted: false
 *     
 *     TaskUpdateInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: The title of the task
 *         description:
 *           type: string
 *           description: The description of the task
 *         status:
 *           type: string
 *           enum: [Pending, In Progress, Completed, On Hold]
 *           description: The status of the task
 *         priority:
 *           type: string
 *           enum: [Low, Medium, High]
 *           description: The priority level of the task
 *         dueDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: The due date of the task
 *         projectId:
 *           type: string
 *           nullable: true
 *           description: The ID of the associated project
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of category IDs
 *         isCompleted:
 *           type: boolean
 *           description: Whether the task is completed
 *       example:
 *         title: "Updated task title"
 *         priority: "Medium"
 *         isCompleted: true
 *     
 *     SubtaskInput:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *           description: The title of the subtask
 *       example:
 *         title: "Review design mockups"
 *     
 *     SubtaskUpdateInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: The title of the subtask
 *         isCompleted:
 *           type: boolean
 *           description: Whether the subtask is completed
 *       example:
 *         title: "Updated subtask title"
 *         isCompleted: true
 *     
 *     TasksResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Task'
 *           description: Array of tasks
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage:
 *               type: integer
 *             totalPages:
 *               type: integer
 *             totalItems:
 *               type: integer
 *             itemsPerPage:
 *               type: integer
 *             hasNextPage:
 *               type: boolean
 *             hasPrevPage:
 *               type: boolean
 *         filters:
 *           type: object
 *           properties:
 *             applied:
 *               type: boolean
 *             count:
 *               type: integer
 *         stats:
 *           type: object
 *           properties:
 *             tasks:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 completed:
 *                   type: integer
 *                 overdue:
 *                   type: integer
 *                 highPriority:
 *                   type: integer
 *                 pending:
 *                   type: integer
 *                 inProgress:
 *                   type: integer
 *                 completionRate:
 *                   type: integer
 *             subtasks:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 completed:
 *                   type: integer
 *                 completionRate:
 *                   type: integer
 *         message:
 *           type: string
 *           description: Response message
 *     
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *         success:
 *           type: boolean
 *           default: false
 *           description: Whether the request was successful
 *       example:
 *         success: false
 *         message: "Server error"
 *   
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management API with filtering, sorting, pagination, and subtask operations
 */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks for the authenticated user with advanced filtering
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter tasks by project ID
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter tasks by category ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, In Progress, Completed, On Hold]
 *         description: Filter tasks by status (can be array)
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [Low, Medium, High]
 *         description: Filter tasks by priority (can be array)
 *       - in: query
 *         name: isCompleted
 *         schema:
 *           type: boolean
 *         description: Filter tasks by completion status
 *       - in: query
 *         name: dueDate
 *         schema:
 *           type: string
 *           enum: [today, overdue, upcoming, this-week, this-month, no-due-date]
 *         description: Filter tasks by due date (predefined values or date range as 'startDate,endDate' or specific date)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in task title and description
 *       - in: query
 *         name: createdAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter tasks created after this date
 *       - in: query
 *         name: createdBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter tasks created before this date
 *       - in: query
 *         name: updatedAfter
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter tasks updated after this date
 *       - in: query
 *         name: updatedBefore
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter tasks updated before this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of tasks per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [title, createdAt, updatedAt, dueDate, priority, status]
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to include in response
 *       - in: query
 *         name: includeSubtasks
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: true
 *         description: Whether to include subtasks in response
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TasksResponse'
 *       400:
 *         description: Bad request - Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project or category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskInput'
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Bad request - Missing required fields or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project or category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a single task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The task ID
 *     responses:
 *       200:
 *         description: Task found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   
 *   put:
 *     summary: Update a task (partial update)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskUpdateInput'
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Bad request - Invalid updates or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task, project, or category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Task deleted successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/tasks/{taskId}/subtasks:
 *   post:
 *     summary: Add a subtask to a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The parent task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubtaskInput'
 *     responses:
 *       201:
 *         description: Subtask added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subtask'
 *       400:
 *         description: Bad request - Missing title or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/tasks/{taskId}/subtasks/{subtaskId}:
 *   put:
 *     summary: Update a specific subtask
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The parent task ID
 *       - in: path
 *         name: subtaskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The subtask ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubtaskUpdateInput'
 *     responses:
 *       200:
 *         description: Subtask updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subtask'
 *       400:
 *         description: Bad request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task or subtask not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   
 *   delete:
 *     summary: Delete a specific subtask
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The parent task ID
 *       - in: path
 *         name: subtaskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The subtask ID
 *     responses:
 *       200:
 *         description: Subtask deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: "Subtask deleted successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task or subtask not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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

export default tasksRouter;