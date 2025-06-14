import { Router } from "express";
import { getMe, deleteMe, updateMe } from "../controllers/usersController.js";
import { updateUserProfileSchema } from "../validationsSchemas/usersSchem.js";
import { validateBody } from "../middlewares/joiValidate.js";

const usersRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the user
 *         name:
 *           type: string
 *           description: The username of the user
 *         email:
 *           type: string
 *           format: email
 *           description: The email address of the user
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the user account was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the user account was last updated
 *       example:
 *         _id: 60d0fe4f5311236168a109ca
 *         name: john_doe
 *         email: john.doe@example.com
 *         createdAt: 2023-06-22T09:32:15.000Z
 *         updatedAt: 2023-06-22T09:32:15.000Z
 *     
 *     UserProfile:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/User'
 *       example:
 *         user:
 *           _id: 60d0fe4f5311236168a109ca
 *           name: john_doe
 *           email: john.doe@example.com
 *           createdAt: 2023-06-22T09:32:15.000Z
 *           updatedAt: 2023-06-22T09:32:15.000Z
 *     
 *     UpdateUserInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The new username (optional)
 *           minLength: 1
 *         email:
 *           type: string
 *           format: email
 *           description: The new email address (optional)
 *         password:
 *           type: string
 *           description: The new password (optional)
 *           minLength: 6
 *       example:
 *         name: john_doe_updated
 *         email: john.updated@example.com
 *         password: newSecurePassword123
 *     
 *     UpdateUserResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: The user ID
 *             name:
 *               type: string
 *               description: The updated username
 *             email:
 *               type: string
 *               format: email
 *               description: The updated email address
 *       example:
 *         message: "User profile updated successfully."
 *         user:
 *           id: 60d0fe4f5311236168a109ca
 *           name: john_doe_updated
 *           email: john.updated@example.com
 *     
 *     SuccessMessage:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *       example:
 *         message: "Operation completed successfully"
 *     
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *       example:
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
 *   name: Users
 *   description: User profile management API
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information (password excluded for security)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Access denied. No token provided."
 *       404:
 *         description: User profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "User profile not found."
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Server error fetching user profile."
 *   
 *   put:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile information. All fields are optional - only provided fields will be updated.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserInput'
 *           examples:
 *             updateName:
 *               summary: Update only name
 *               value:
 *                 name: "new_username"
 *             updateEmail:
 *               summary: Update only email
 *               value:
 *                 email: "newemail@example.com"
 *             updatePassword:
 *               summary: Update only password
 *               value:
 *                 password: "newPassword123"
 *             updateAll:
 *               summary: Update all fields
 *               value:
 *                 name: "updated_user"
 *                 email: "updated@example.com"
 *                 password: "newSecurePassword123"
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateUserResponse'
 *       400:
 *         description: Bad request - Validation error or duplicate username/email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               duplicateUsername:
 *                 summary: Username already taken
 *                 value:
 *                   message: "name is already taken."
 *               duplicateEmail:
 *                 summary: Email already in use
 *                 value:
 *                   message: "Email is already in use by another account."
 *               passwordTooShort:
 *                 summary: Password too short
 *                 value:
 *                   message: "New password must be at least 6 characters long."
 *               validationError:
 *                 summary: General validation error
 *                 value:
 *                   message: "Validation failed"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Access denied. No token provided."
 *       404:
 *         description: User profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "User profile not found."
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Server error updating user profile."
 *   
 *   delete:
 *     summary: Delete user account
 *     description: Permanently delete the authenticated user's account and all associated data (tasks, projects, categories, refresh tokens). This action cannot be undone.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User account and all associated data deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *             example:
 *               message: "User account and all associated data deleted successfully."
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Access denied. No token provided."
 *       404:
 *         description: User account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "User account not found."
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Server error deleting user account."
 */

usersRouter.put("/me", validateBody(updateUserProfileSchema), updateMe); // Update user profile
usersRouter.delete("/me", deleteMe); // Delete user profile
usersRouter.get("/me", getMe); // Get user profile (for admin or self-view)

export default usersRouter;