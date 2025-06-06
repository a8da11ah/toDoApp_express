import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import connectDb from './config/mongoDBconnection.js';
import cookieParser from 'cookie-parser';
import errorHandler from './middlewares/errorHandler.js';




const app = express();


// Middleware

// allow us to access req.body in json
app.use(express.json()) 

// allow us to access req.body in form data
app.use(express.urlencoded({extended:false}))


// allow us to access cookies
app.use(cookieParser())

// Routes
import apiRouter from './routes/apiRoute.js';

// app.use('/api', (await import('./routes/apiRoute.js')).default);

app.use('/api', apiRouter);





// error handling middleware
app.use(errorHandler)





const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    connectDb()
    console.log(`Server is running on port ${PORT}`);
});