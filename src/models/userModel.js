// user.model.js (or user.schema.js)
// const mongoose = require('mongoose');
import mongoose from 'mongoose';
import { hashPassword } from '../utils/authUtils.js';
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true, // Remove whitespace from both ends of a string
        minlength: 1
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true, // Store emails in lowercase
        match: [/.+@.+\..+/, 'Please fill a valid email address'] // Basic email regex validation
    },
    password: { // Store the hashed password
        type: String,
        required: true
    },
    lastLogin: {
        type: Date,
        default: Date.now // Automatically set to current date/time when a user is created
    },
    role: {
        type: String,
        enum: ['user', 'admin'], // Only allow 'user' or 'admin' roles
        default: 'user' // Default role is 'user'
    }

}, {
    timestamps: true // Mongoose will automatically add createdAt and updatedAt fields
    // If you explicitly defined createdAt/updatedAt above, timestamps: true might conflict.
    // In this case, you can remove the manual createdAt/updatedAt and let timestamps: true handle it.
    // For demonstration, I'll keep the manual ones for clarity on the field names.
    // If using 'timestamps: true', the fields would be 'createdAt' and 'updatedAt' by default.
});

// Example of a pre-save hook to update 'updatedAt' (if not using timestamps: true)
// UserSchema.pre('save', function(next) {
//     this.updatedAt = Date.now();
//     next();
// });


// Hash password before saving if it's new or modified
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await hashPassword(this.password); // Hash with salt rounds
    next();
});


const User = mongoose.model('User', UserSchema);



export default User;