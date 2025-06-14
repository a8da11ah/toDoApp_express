import app from './src/app.js';




// In server.js or app.js, near the top

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    
    console.log(`Server is running on port ${PORT}`);
});