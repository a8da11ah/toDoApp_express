import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import connectDb from './config/mongoDBconnection.js';
import cookieParser from 'cookie-parser';
import errorHandler from './middlewares/errorHandler.js';
import cors from 'cors';

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';



const app = express();
connectDb()


// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000', // Adjust this to your frontend URL
    credentials: true, // Allow cookies to be sent with requests
}));
// allow us to access req.body in json
app.use(express.json()) 

// allow us to access req.body in form data
app.use(express.urlencoded({extended:false}))
app.use(express.static('public')) // serve static files from the public directory


// allow us to access cookies
app.use(cookieParser())

// Routes
import apiRouter from './routes/apiRoute.js';

// app.use('/api', (await import('./routes/apiRoute.js')).default);

app.use('/api', apiRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));




// error handling middleware
app.use(errorHandler)




// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
    
//     console.log(`Server is running on port ${PORT}`);
// });

export default app;