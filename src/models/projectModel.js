// list.model.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId, // Reference to the User model
        ref: 'User', // The model name 'User'
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 1
    },
    description: {
        type: String,
        trim: true
    },
    // Optional: Add a 'type' field for pre-defined lists like 'Inbox', 'Today', 'Upcoming'
    // type: {
    //     type: String,
    //     enum: ['Custom', 'Inbox', 'Today', 'Upcoming'],
    //     default: 'Custom'
    // }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Add an index for userId to speed up queries by user
ProjectSchema.index({ userId: 1 });

const Project = mongoose.model('Project', ProjectSchema);

export default Project