// validators/schemas.js
import Joi from 'joi';

// Helper for ObjectId validation (Joi doesn't have a native ObjectId type)
const JoiObjectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/, 'MongoDB ObjectId');

// --- Task Schemas ---
const SubtaskSchema = Joi.object({
    title: Joi.string().trim().min(1).required(),
    isCompleted: Joi.boolean().optional(),
    // completedAt is managed by the controller, not directly validated here
});

export const createTaskSchema = Joi.object({
    title: Joi.string().trim().min(1).required(),
    description: Joi.string().trim().allow('').optional(),
    dueDate: Joi.date().iso().optional().allow(null), // ISO 8601 date string, allow null
    priority: Joi.string().valid('Low', 'Medium', 'High').optional(),
    status: Joi.string().valid('Pending', 'In Progress', 'Completed', 'Canceled').optional(),
    projectId: JoiObjectId.optional().allow(null), // Allow null for no project
    categories: Joi.array().items(JoiObjectId).optional(), // Array of ObjectIds
    subtasks: Joi.array().items(SubtaskSchema).optional(), // Array of embedded subtask objects
    isCompleted: Joi.boolean().optional(),
});

export const updateTaskSchema = Joi.object({
    title: Joi.string().trim().min(1).optional(),
    description: Joi.string().trim().allow('').optional(),
    dueDate: Joi.date().iso().optional().allow(null),
    priority: Joi.string().valid('Low', 'Medium', 'High').optional(),
    status: Joi.string().valid('Pending', 'In Progress', 'Completed', 'Canceled').optional(),
    projectId: JoiObjectId.optional().allow(null),
    categories: Joi.array().items(JoiObjectId).optional(),
    isCompleted: Joi.boolean().optional(),
}).min(1); // At least one field must be provided for update

// --- Subtask Schemas (for individual add/update) ---
export const addSubtaskSchema = Joi.object({
    title: Joi.string().trim().min(1).required()
});

export const updateSubtaskSchema = Joi.object({
    title: Joi.string().trim().min(1).optional(),
    isCompleted: Joi.boolean().optional()
}).min(1); // At least one field for partial update

// --- Query Schema for GET /api/tasks ---
export const getTasksQuerySchema = Joi.object({
  projectId: JoiObjectId.optional(),
  categoryId: JoiObjectId.optional(),
  status: Joi.string().valid('Pending', 'In Progress', 'Completed', 'Canceled').optional(),
  priority: Joi.string().valid('Low', 'Medium', 'High').optional(),
  isCompleted: Joi.boolean().optional(),
  // Allow 'today', 'overdue', 'upcoming' or an ISO date string
  dueDate: Joi.alternatives().try(
    Joi.string().valid('today', 'overdue', 'upcoming'),
    Joi.date().iso()
  ).optional(),
  search: Joi.string().trim().optional(),
  createdAfter: Joi.date().iso().optional(),
  createdBefore: Joi.date().iso().optional(),
  updatedAfter: Joi.date().iso().optional(),
  updatedBefore: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
  sort: Joi.string().valid('createdAt', 'dueDate', 'title', 'priority', 'status').optional(),
  order: Joi.string().valid('asc', 'desc').optional(),
  fields: Joi.string().optional(), // Comma-separated field names
  includeSubtasks: Joi.boolean().optional(),
}).with('sort', 'order'); // 'order' is required if 'sort' is present
