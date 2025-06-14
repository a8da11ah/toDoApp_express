import { Router } from "express";
import { login, logout, register, refreshToken, logoutAll } from "../controllers/authController.js";
import { validateBody } from "../middlewares/joiValidate.js";
import { registerSchema, loginSchema } from "../validationsSchemas/authSchema.js";
import authProtect from "../middlewares/authProtect.js";
const authRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization operations
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     description: Registers a new user with a name, email, and password. Returns access and refresh tokens and sets them as HTTP-only cookies.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the user.
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address.
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password (will be hashed automatically).
 *                 example: MySecurePass123
 *     responses:
 *       201:
 *         description: User registered successfully. Tokens are returned in response body and set as HTTP-only cookies.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT Access Token.
 *                   example: eyJhbGciOiJIUzI1Ni...
 *                 refreshToken:
 *                   type: string
 *                   description: JWT Refresh Token.
 *                   example: eyJhbGciOiJIUzI1Ni...
 *         headers:
 *           Set-Cookie:
 *             description: HTTP-only cookies containing access and refresh tokens
 *             schema:
 *               type: string
 *               example: accessToken=eyJhbGciOiJIUzI1Ni...; HttpOnly; Secure; refreshToken=eyJhbGciOiJIUzI1Ni...; HttpOnly; Secure
 *       400:
 *         description: Bad request - User already exists or validation error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User already exists
 *       500:
 *         description: Internal server error.
 */
authRouter.post("/register", validateBody(registerSchema), register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Authentication]
 *     description: Authenticates a user with email and password, updates last login timestamp, and returns access and refresh tokens. Also sets tokens as HTTP-only cookies.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address.
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password.
 *                 example: MySecurePass123
 *     responses:
 *       200:
 *         description: User logged in successfully. Returns tokens in response body and sets them as HTTP-only cookies.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT Access Token.
 *                   example: eyJhbGciOiJIUzI1Ni...
 *                 refreshToken:
 *                   type: string
 *                   description: JWT Refresh Token.
 *                   example: eyJhbGciOiJIUzI1Ni...
 *         headers:
 *           Set-Cookie:
 *             description: HTTP-only cookies containing access and refresh tokens
 *             schema:
 *               type: string
 *               example: accessToken=eyJhbGciOiJIUzI1Ni...; HttpOnly; Secure; refreshToken=eyJhbGciOiJIUzI1Ni...; HttpOnly; Secure
 *       400:
 *         description: Bad request - User does not exist or invalid password.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User does not exist
 *       500:
 *         description: Internal server error.
 */
authRouter.post("/login", validateBody(loginSchema), login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out current user
 *     tags: [Authentication]
 *     description: Invalidates the current refresh token and clears HTTP-only cookies. Accepts refresh token from request body or cookies.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token to invalidate. Optional if token is available in cookies.
 *                 example: eyJhbGciOiJIUzI1Ni...
 *     responses:
 *       200:
 *         description: User logged out successfully or already logged out.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully.
 *         headers:
 *           Set-Cookie:
 *             description: Cleared HTTP-only cookies
 *             schema:
 *               type: string
 *               example: accessToken=; HttpOnly; Secure; Expires=Thu, 01 Jan 1970 00:00:00 GMT
 *       500:
 *         description: Internal server error - Failed to log out.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to log out.
 */
authRouter.post("/logout", logout);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token with token rotation
 *     tags: [Authentication]
 *     description: Obtains new access and refresh tokens using a valid refresh token. Implements token rotation for enhanced security. Accepts refresh token from request body or cookies.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token to generate new tokens. Optional if token is available in cookies.
 *                 example: eyJhbGciOiJIUzI1Ni...
 *     responses:
 *       200:
 *         description: New access and refresh tokens generated successfully. Old refresh token is invalidated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: New JWT Access Token.
 *                   example: eyJhbGciOiJIUzI1Ni...
 *                 refreshToken:
 *                   type: string
 *                   description: New JWT Refresh Token.
 *                   example: eyJhbGciOiJIUzI1Ni...
 *         headers:
 *           Set-Cookie:
 *             description: HTTP-only cookies containing new access and refresh tokens
 *             schema:
 *               type: string
 *               example: accessToken=eyJhbGciOiJIUzI1Ni...; HttpOnly; Secure; refreshToken=eyJhbGciOiJIUzI1Ni...; HttpOnly; Secure
 *       401:
 *         description: Unauthorized - Invalid, expired, or no refresh token provided.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No refresh token provided.
 *       403:
 *         description: Forbidden - Token reuse detected, all user tokens revoked for security.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Security alert - Reused token detected. Please log in again.
 *       500:
 *         description: Internal server error during token refresh.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: An internal server error occurred during token refresh.
 */
authRouter.post("/refresh-token", refreshToken);

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: Log out from all devices
 *     tags: [Authentication]
 *     description: Invalidates all refresh tokens for the authenticated user and clears HTTP-only cookies, logging them out from all devices.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out from all devices.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out from all devices successfully.
 *         headers:
 *           Set-Cookie:
 *             description: Cleared HTTP-only cookies
 *             schema:
 *               type: string
 *               example: accessToken=; HttpOnly; Secure; Expires=Thu, 01 Jan 1970 00:00:00 GMT
 *       401:
 *         description: Unauthorized - No access token provided or invalid access token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized. Access token required.
 *       500:
 *         description: Internal server error - Failed to log out from all devices.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to log out from all devices.
 */
authRouter.post("/logout-all", authProtect, logoutAll);

export default authRouter;