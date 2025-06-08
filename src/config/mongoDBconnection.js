import mongoose from "mongoose"


const connectDb = async () => {

    try {
        const conn =await mongoose.connect(process.env.MONGO_URI)
        if(process.env.NODE_ENV === 'development') {
         console.log("Database connected")
        console.log(
            `MongoDB Connected to 
            host: ${conn.connection.host}, 
            port: ${conn.connection.port},
            name: ${conn.connection.name}`);
        }else{
        mongoose.set('debug', false) // disable debug mode in production
        }





    } catch (error) {
        console.log(`error: ${error.message}`)
        process.exit(1) //exit with failure code 1 , 0 is success
    }
}

export default connectDb