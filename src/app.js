import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import connectDb from './config/mongoDBconnection.js';
import cookieParser from 'cookie-parser';
import errorHandler from './middlewares/errorHandler.js';

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';



const app = express();
connectDb()


// Middleware

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