// task.model.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// Define a schema for subtasks (embedded)
const SubtaskSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date
    },
    // Optional: Add createdAt/updatedAt for subtasks if needed
    // createdAt: { type: Date, default: Date.now },
    // updatedAt: { type: Date, default: Date.now }
});


const TaskSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: false // A task can be standalone (not in a specific list)
    },
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 1
    },
    description: {
        type: String,
        trim: true
    },
    dueDate: {
        type: Date
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Canceled'],
        default: 'Pending'
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date
    },
    // Array of ObjectIds to reference categories (Many-to-Many via referencing)
    categories: [{
        type: Schema.Types.ObjectId,
        ref: 'Category'
    }],
    // Embedding subtasks directly within the task document
    subtasks: [SubtaskSchema],

    // For recurring tasks (optional advanced feature)
    // recurrence: {
    //     type: String, // e.g., 'daily', 'weekly', 'monthly'
    //     interval: Number, // e.g., every 2 days
    //     endsOn: Date // when recurrence ends
    // }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Add indexes for common queries
TaskSchema.index({ userId: 1 });
TaskSchema.index({ listId: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ isCompleted: 1 });
TaskSchema.index({ categories: 1 }); // Index for querying by categories

const Task = mongoose.model('Task', TaskSchema);

export default  Task;