// category.model.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
    userId: { // Categories can be user-specific or global (if null)
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true // Set to false if you want global categories, true if user-specific
    },
    name: {
        type: String,
        required: true,
        unique: false, // Categories can have the same name for different users
        trim: true,
        minlength: 1
    },
    // Optional: color for UI representation
    color: {
        type: String,
        default: '#CCCCCC'
    }
}, {
    timestamps: true
});

// Add a compound unique index if categories are user-specific AND you want unique names per user
CategorySchema.index({ userId: 1, name: 1 }, { unique: true, partialFilterExpression: { userId: { $exists: true } } });
// This index ensures a user can't have two categories with the exact same name, but allows different users to have similarly named categories.

const Category = mongoose.model('Category', CategorySchema);

export default Category;