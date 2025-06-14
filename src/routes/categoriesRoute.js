import { Router } from "express";
import { validateBody, validateQuery } from "../middlewares/joiValidate.js";
import { createCategorySchema, getCategoriesQuerySchema, updateCategorySchema }
from "../validationsSchemas/categoriesSchema.js";
import {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
    restoreCategory,
    getCategoryById,
    reorderCategories
} from "../controllers/categoriesController.js";

const categoriesRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management operations for authenticated users
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Category ID
 *           example: "60c72b2f9d4b0b0015f8e4a9"
 *         name:
 *           type: string
 *           description: Category name
 *           example: "Work"
 *         color:
 *           type: string
 *           description: Category color
 *           example: "#FF5733"
 *         description:
 *           type: string
 *           description: Category description
 *           example: "Work-related tasks"
 *         icon:
 *           type: string
 *           description: Category icon
 *           example: "briefcase"
 *         order:
 *           type: number
 *           description: Display order
 *           example: 1
 *         isActive:
 *           type: boolean
 *           description: Whether the category is active
 *           example: true
 *         userId:
 *           type: string
 *           description: Owner's user ID
 *           example: "60c72b2f9d4b0b0015f8e4a8"
 *         taskCount:
 *           type: number
 *           description: Number of tasks in this category (when includeTaskCount=true)
 *           example: 5
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         currentPage:
 *           type: number
 *           example: 1
 *         totalPages:
 *           type: number
 *           example: 5
 *         totalItems:
 *           type: number
 *           example: 25
 *         itemsPerPage:
 *           type: number
 *           example: 10
 *         hasNextPage:
 *           type: boolean
 *           example: true
 *         hasPrevPage:
 *           type: boolean
 *           example: false
 */

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     description: Creates a new category for the authenticated user. Automatically assigns order if not specified.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name (will be trimmed)
 *                 example: "Work Projects"
 *               color:
 *                 type: string
 *                 description: Category color (hex code)
 *                 example: "#FF5733"
 *               description:
 *                 type: string
 *                 description: Category description
 *                 example: "Projects related to work tasks"
 *               icon:
 *                 type: string
 *                 description: Category icon identifier
 *                 example: "briefcase"
 *               order:
 *                 type: number
 *                 description: Display order (auto-assigned if not provided)
 *                 example: 1
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Bad request - validation error or duplicate name
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category with this name already exists for your account."
 *                 details:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Name field is required"]
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Internal server error
 */
categoriesRouter.post(
    "/",
    validateBody(createCategorySchema),
    createCategory
);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories for authenticated user
 *     tags: [Categories]
 *     description: Retrieves categories with support for filtering, sorting, pagination, field selection, and task counts.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by category name (case-insensitive regex)
 *         example: "work"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and description fields
 *         example: "project"
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status (defaults to true)
 *         example: true
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *         description: Filter by color
 *         example: "#FF5733"
 *       - in: query
 *         name: createdAfter
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter categories created after this date
 *         example: "2023-01-01"
 *       - in: query
 *         name: createdBefore
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter categories created before this date
 *         example: "2023-12-31"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *         example: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Field to sort by
 *         example: "name"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order (defaults to asc)
 *         example: "asc"
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to include
 *         example: "name,color,order"
 *       - in: query
 *         name: includeTaskCount
 *         schema:
 *           type: boolean
 *         description: Include task count for each category
 *         example: true
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Internal server error
 */
categoriesRouter.get("/", validateQuery(getCategoriesQuerySchema), getCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get a single category by ID
 *     tags: [Categories]
 *     description: Retrieves a specific category for the authenticated user. Only returns active categories.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *         example: "60c72b2f9d4b0b0015f8e4a9"
 *       - in: query
 *         name: includeTaskCount
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Include task count for the category
 *         example: "true"
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category not found or you do not have access to it"
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Internal server error
 */
categoriesRouter.get("/:id", getCategoryById);

/**
 * @swagger
 * /api/categories/{id}:
 *   patch:
 *     summary: Update an existing category
 *     tags: [Categories]
 *     description: Partially updates a category for the authenticated user. Only active categories can be updated.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *         example: "60c72b2f9d4b0b0015f8e4a9"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name (will be trimmed and checked for uniqueness)
 *                 example: "Updated Work Projects"
 *               color:
 *                 type: string
 *                 description: Category color
 *                 example: "#00FF00"
 *               description:
 *                 type: string
 *                 description: Category description
 *                 example: "Updated description"
 *               icon:
 *                 type: string
 *                 description: Category icon
 *                 example: "folder"
 *               order:
 *                 type: number
 *                 description: Display order
 *                 example: 2
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Bad request - validation error or duplicate name
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category with this name already exists for your account."
 *                 details:
 *                   type: array
 *                   items:
 *                     type: string
 *       404:
 *         description: Category not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category not found or you do not have access to it"
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Internal server error
 */
categoriesRouter.patch("/:id", validateBody(updateCategorySchema), updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Soft delete a category
 *     tags: [Categories]
 *     description: Soft deletes a category and removes category references from associated tasks. Only active categories can be deleted.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *         example: "60c72b2f9d4b0b0015f8e4a9"
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category deleted successfully and tasks updated"
 *                 tasksUpdated:
 *                   type: number
 *                   description: Number of tasks that had their category reference removed
 *                   example: 3
 *       404:
 *         description: Category not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category not found or you do not have access to it"
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Internal server error
 */
categoriesRouter.delete("/:id", deleteCategory);

/**
 * @swagger
 * /api/categories/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted category
 *     tags: [Categories]
 *     description: Restores a previously soft-deleted category. Checks for name conflicts with active categories.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *         example: "60c72b2f9d4b0b0015f8e4a9"
 *     responses:
 *       200:
 *         description: Category restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category restored successfully"
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Bad request - name conflict with existing active category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cannot restore: A category with this name already exists."
 *       404:
 *         description: Deleted category not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Deleted category not found or you do not have access to it"
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Internal server error
 */
categoriesRouter.patch("/:id/restore", restoreCategory);

/**
 * @swagger
 * /api/categories/reorder:
 *   patch:
 *     summary: Reorder categories
 *     tags: [Categories]
 *     description: Updates the display order of multiple categories for the authenticated user. All specified categories must belong to the user and be active.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryIds
 *             properties:
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of category IDs in the desired order
 *                 example: ["60c72b2f9d4b0b0015f8e4a9", "60c72b2f9d4b0b0015f8e4aa", "60c72b2f9d4b0b0015f8e4ab"]
 *     responses:
 *       200:
 *         description: Categories reordered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Categories reordered successfully"
 *       400:
 *         description: Bad request - invalid input or categories not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Some categories not found or you do not have access to them"
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Internal server error
 */
categoriesRouter.patch("/reorder", reorderCategories);

export default categoriesRouter;