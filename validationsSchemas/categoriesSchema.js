// validators/schemas.js (Enhanced Category Schemas)
import Joi from 'joi';

// Custom validation for hex colors
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// Predefined color options for better UX
const predefinedColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

// --- Category Schemas ---

/**
 * Schema for creating a new category
 * Validates: name (required), color (optional with hex validation), description
 */
export const createCategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Category name is required',
      'string.min': 'Category name cannot be empty',
      'string.max': 'Category name must be less than 50 characters'
    }),
    
  color: Joi.string()
    .regex(hexColorRegex)
    .default('#4ECDC4')
    .optional()
    .messages({
      'string.pattern.base': 'Color must be a valid hex color (e.g., #FF6B6B or #F6B)'
    }),
    
  description: Joi.string()
    .trim()
    .max(200)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description must be less than 200 characters'
    }),
    
  icon: Joi.string()
    .trim()
    .max(50)
    .default('folder')
    .optional()
    .messages({
      'string.max': 'Icon name must be less than 50 characters'
    }),
    
  order: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .optional()
});

/**
 * Schema for updating an existing category
 * All fields optional but at least one required for partial update
 */
export const updateCategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'string.empty': 'Category name cannot be empty',
      'string.min': 'Category name cannot be empty',
      'string.max': 'Category name must be less than 50 characters'
    }),
    
  color: Joi.alternatives()
    .try(
      Joi.string().valid(...predefinedColors),
      Joi.string().regex(hexColorRegex).message('Color must be a valid hex color (e.g., #FF6B6B or #F6B)')
    )
    .optional(),
    
  description: Joi.string()
    .trim()
    .max(200)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Description must be less than 200 characters'
    }),
    
  icon: Joi.string()
    .trim()
    .max(50)
    .optional()
    .messages({
      'string.max': 'Icon name must be less than 50 characters'
    }),
    
  isActive: Joi.boolean()
    .optional()
    
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Schema for querying categories with filtering, sorting, and pagination
 * Supports: search, filtering by active status, sorting, pagination
 */
export const getCategoriesQuerySchema = Joi.object({
  // Search functionality
  name: Joi.string()
    .trim()
    .optional()
    .description('Search categories by name (partial match)'),
    
  search: Joi.string()
    .trim()
    .optional()
    .description('Search in name and description'),
    
  // Filtering options
  isActive: Joi.boolean()
    .optional()
    .description('Filter by active status'),
    
  color: Joi.string()
    .optional()
    .description('Filter by specific color'),
    
  // Date range filtering
  createdAfter: Joi.date()
    .iso()
    .optional()
    .description('Categories created after this date'),
    
  createdBefore: Joi.date()
    .iso()
    .optional()
    .description('Categories created before this date'),
    
    
  // Pagination
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional()
    .description('Page number for pagination'),
    
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .optional()
    .description('Number of items per page (max 100)'),
    
  // Sorting
  sort: Joi.string()
    .valid('createdAt', 'updatedAt', 'name', 'color')
    .default('createdAt')
    .optional()
    .description('Field to sort by'),
    
  order: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .optional()
    .description('Sort order'),
    
  // Field selection
  fields: Joi.string()
    .optional()
    .description('Comma-separated list of fields to return'),
    
  // Include related data
  includeTaskCount: Joi.boolean()
    .default(false)
    .optional()
    .description('Include count of tasks in each category')
    
}).with('sort', 'order').messages({
  'object.with': 'order parameter is required when sort is specified'
});

// Export predefined colors for use in frontend
// export const CATEGORY_COLORS = predefinedColors;