import mongoose from "mongoose"


const connectDb = async () => {

    try {
        const conn =await mongoose.connect(process.env.MONGO_URI)
        console.log("Database connected")
        console.log(
            `MongoDB Connected to 
            host: ${conn.connection.host}, 
            port: ${conn.connection.port},
            name: ${conn.connection.name}`);
        
    } catch (error) {
        console.log(`error: ${error.message}`)
        process.exit(1) //exit with failure code 1 , 0 is success
    }
}

export default connectDb