// category.model.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  userId: { 
    // Categories can be user-specific or global (if null)
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true // Set to false if you want global categories, true if user-specific
  },
  
  name: {
    type: String,
    required: true,
    unique: false, // Categories can have the same name for different users
    trim: true,
    minlength: 1,
    maxlength: 50 // Add reasonable limit
  },
  
  // Enhanced color field with validation
  color: {
    type: String,
    default: '#4ECDC4',
    validate: {
      validator: function(v) {
        // Validate hex color format (#RRGGBB or #RGB)
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Color must be a valid hex color (e.g., #FF6B6B or #F6B)'
    }
  },
  
  // Optional: description for better categorization
  description: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ''
  },
  
  // Optional: icon for UI representation
  icon: {
    type: String,
    trim: true,
    maxlength: 50,
    default: 'folder'
  },
  
  // Soft delete functionality
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Order/position for user-defined sorting
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound unique index - user can't have duplicate category names
CategorySchema.index(
  { userId: 1, name: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { 
      userId: { $exists: true },
      isActive: true // Only enforce uniqueness for active categories
    } 
  }
);

// Index for efficient querying
CategorySchema.index({ userId: 1, isActive: 1 });
CategorySchema.index({ userId: 1, order: 1 });

// Virtual for task count (if needed)
CategorySchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'categoryId',
  count: true
});

// Instance methods
CategorySchema.methods.softDelete = function() {
  this.isActive = false;
  return this.save();
};

CategorySchema.methods.restore = function() {
  this.isActive = true;
  return this.save();
};

// Static methods
CategorySchema.statics.findActiveByUser = function(userId) {
  return this.find({ userId, isActive: true }).sort({ order: 1, createdAt: -1 });
};

CategorySchema.statics.findByUserAndName = function(userId, name) {
  return this.findOne({ userId, name: name.trim(), isActive: true });
};

// Pre-save middleware
CategorySchema.pre('save', function(next) {
  // Ensure name is properly trimmed and capitalized
  if (this.name) {
    this.name = this.name.trim();
  }
  next();
});

const Category = mongoose.model('Category', CategorySchema);
export default Category;