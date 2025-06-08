// controllers/categoryController.js
import Category from '../models/categoryModel.js';
import Task from '../models/taskModel.js'; // Needed for cascading updates



// @desc    Get all categories for the authenticated user
// @route   GET /api/categories
// @access  Private
// Supports filtering, sorting, pagination, and field selection
export const getCategories = async (req, res) => {
    try {
        // Extract validated query parameters (already validated by middleware)
        const {
            name,
            search,
            isActive,
            color,
            createdAfter,
            createdBefore,
            page,
            limit,
            sort,
            order,
            fields,
            includeTaskCount
        } = req.query;

        const userId = req.user._id;
        const query = { userId }; // Base query for the authenticated user

        // Build query filters
        if (name) {
            query.name = { $regex: name, $options: 'i' }; // Case-insensitive search
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (typeof isActive === 'boolean') {
            query.isActive = isActive;
        } else {
            query.isActive = true; // Default to active categories only
        }

        if (color) {
            query.color = color;
        }

        // Date range filtering
        if (createdAfter || createdBefore) {
            query.createdAt = {};
            if (createdAfter) query.createdAt.$gte = new Date(createdAfter);
            if (createdBefore) query.createdAt.$lte = new Date(createdBefore);
        }

        // Build sort options
        let sortOptions = {};
        if (sort) {
            sortOptions[sort] = order === 'desc' ? -1 : 1;
        } else {
            sortOptions = { order: 1, createdAt: -1 }; // Default: by order then newest first
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Build aggregation pipeline for complex queries
        let pipeline = [
            { $match: query },
            { $sort: sortOptions }
        ];

        // Add task count if requested
        if (includeTaskCount) {
            pipeline.push({
                $lookup: {
                    from: 'tasks',
                    let: { categoryId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$categoryId', '$$categoryId'] },
                                        { $eq: ['$userId', userId] }
                                    ]
                                }
                            }
                        },
                        { $count: 'count' }
                    ],
                    as: 'taskCountResult'
                }
            });
            
            pipeline.push({
                $addFields: {
                    taskCount: {
                        $ifNull: [{ $arrayElemAt: ['$taskCountResult.count', 0] }, 0]
                    }
                }
            });
            
            pipeline.push({
                $project: { taskCountResult: 0 }
            });
        }

        // Add pagination
        if (page && limit) {
            pipeline.push({ $skip: skip });
            pipeline.push({ $limit: limit });
        }

        // Field selection
        if (fields) {
            const selectedFields = {};
            fields.split(',').forEach(field => {
                selectedFields[field.trim()] = 1;
            });
            pipeline.push({ $project: selectedFields });
        }

        // Execute aggregation
        const categories = await Category.aggregate(pipeline);

        // Get total count for pagination metadata
        let totalCount = 0;
        if (page && limit) {
            const countPipeline = [
                { $match: query },
                { $count: 'total' }
            ];
            const countResult = await Category.aggregate(countPipeline);
            totalCount = countResult[0]?.total || 0;
        }

        // Prepare response
        const response = {
            categories,
            ...(page && limit && {
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalItems: totalCount,
                    itemsPerPage: limit,
                    hasNextPage: page < Math.ceil(totalCount / limit),
                    hasPrevPage: page > 1
                }
            })
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Server error fetching categories' });
    }
};

// @desc    Get a single category by ID for the authenticated user
// @route   GET /api/categories/:id
// @access  Private
export const getCategoryById = async (req, res) => {
    try {
        const { includeTaskCount } = req.query;
        
        let category = await Category.findOne({ 
            _id: req.params.id, 
            userId: req.user.id,
            isActive: true 
        });

        if (!category) {
            return res.status(404).json({ message: 'Category not found or you do not have access to it' });
        }

        // Add task count if requested
        if (includeTaskCount === 'true') {
            const taskCount = await Task.countDocuments({ 
                categoryId: category._id, 
                userId: req.user.id 
            });
            category = category.toObject();
            category.taskCount = taskCount;
        }

        res.status(200).json(category);
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ message: 'Server error fetching category' });
    }
};

// @desc    Create a new category for the authenticated user
// @route   POST /api/categories
// @access  Private
export const createCategory = async (req, res) => {
    try {
        // Extract validated data (already validated by middleware)
        const { name, color, description, icon, order } = req.body;

        // Check if a category with this name already exists for the user (active categories only)
        const existingCategory = await Category.findOne({ 
            name: name.trim(), 
            userId: req.user.id,
            isActive: true 
        });
        
        if (existingCategory) {
            return res.status(400).json({ 
                message: 'Category with this name already exists for your account.' 
            });
        }

        // If no order specified, set it to be last
        let finalOrder = order;
        if (finalOrder === undefined || finalOrder === 0) {
            const lastCategory = await Category.findOne({ userId: req.user.id })
                .sort({ order: -1 })
                .select('order');
            finalOrder = (lastCategory?.order || 0) + 1;
        }

        const newCategory = await Category.create({
            name: name.trim(),
            color,
            description,
            icon,
            order: finalOrder,
            userId: req.user.id,
        });

        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Error creating category:', error);
        
        // Handle Mongoose duplicate key error specifically
        if (error.code === 11000 && error.keyPattern?.name && error.keyPattern?.userId) {
            return res.status(400).json({ 
                message: 'A category with this name already exists for this user.' 
            });
        }
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Database validation error', 
                details: Object.values(error.errors).map(err => err.message)
            });
        }
        
        res.status(500).json({ message: 'Server error creating category' });
    }
};

// @desc    Update an existing category for the authenticated user (PATCH for partial updates)
// @route   PATCH /api/categories/:id
// @access  Private
export const updateCategory = async (req, res) => {
    try {
        // Extract validated data (already validated by middleware)
        const updates = req.body;
        const { id } = req.params;

        const category = await Category.findOne({ 
            _id: id, 
            userId: req.user.id,
            isActive: true 
        });

        if (!category) {
            return res.status(404).json({ 
                message: 'Category not found or you do not have access to it' 
            });
        }

        // If name is updated, check for uniqueness for this user (among active categories)
        if (updates.name && updates.name.trim() !== category.name) {
            const existingCategory = await Category.findOne({ 
                name: updates.name.trim(), 
                userId: req.user.id,
                isActive: true,
                _id: { $ne: id } // Exclude current category
            });
            
            if (existingCategory) {
                return res.status(400).json({ 
                    message: 'Category with this name already exists for your account.' 
                });
            }
        }

        // Apply updates dynamically
        Object.keys(updates).forEach((key) => {
            if (key === 'name') {
                category[key] = updates[key].trim();
            } else {
                category[key] = updates[key];
            }
        });

        await category.save({ runValidators: true });

        res.status(200).json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Database validation error', 
                details: Object.values(error.errors).map(err => err.message)
            });
        }
        
        // Handle Mongoose duplicate key error
        if (error.code === 11000 && error.keyPattern?.name && error.keyPattern?.userId) {
            return res.status(400).json({ 
                message: 'A category with this name already exists for this user.' 
            });
        }
        
        res.status(500).json({ message: 'Server error updating category' });
    }
};

// @desc    Soft delete a category for the authenticated user
// @route   DELETE /api/categories/:id
// @access  Private
export const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;

        // Find the category (only active ones)
        const category = await Category.findOne({ 
            _id: categoryId, 
            userId: req.user.id,
            isActive: true 
        });

        if (!category) {
            return res.status(404).json({ 
                message: 'Category not found or you do not have access to it' 
            });
        }

        // Soft delete the category
        await category.softDelete();

        // --- Cascading Update for Tasks ---
        // When a category is soft deleted, remove its ID from tasks that reference it
        const updateResult = await Task.updateMany(
            { userId: req.user.id, categoryId: categoryId },
            { $unset: { categoryId: 1 } } // Remove categoryId field from tasks
        );

        res.status(200).json({ 
            message: 'Category deleted successfully and tasks updated',
            tasksUpdated: updateResult.modifiedCount
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Server error deleting category' });
    }
};



// @desc    Restore a soft-deleted category for the authenticated user
// @route   PATCH /api/categories/:id/restore
// @access  Private
export const restoreCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;

        // Find the soft-deleted category
        const category = await Category.findOne({ 
            _id: categoryId, 
            userId: req.user.id,
            isActive: false 
        });

        if (!category) {
            return res.status(404).json({ 
                message: 'Deleted category not found or you do not have access to it' 
            });
        }

        // Check if name conflicts with existing active categories
        const existingCategory = await Category.findOne({ 
            name: category.name, 
            userId: req.user.id,
            isActive: true 
        });
        
        if (existingCategory) {
            return res.status(400).json({ 
                message: 'Cannot restore: A category with this name already exists.' 
            });
        }

        // Restore the category
        await category.restore();

        res.status(200).json({ 
            message: 'Category restored successfully',
            category 
        });
    } catch (error) {
        console.error('Error restoring category:', error);
        res.status(500).json({ message: 'Server error restoring category' });
    }
};

// @desc    Reorder categories for the authenticated user
// @route   PATCH /api/categories/reorder
// @access  Private
export const reorderCategories = async (req, res) => {
    try {
        const { categoryIds } = req.body;

        if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
            return res.status(400).json({ 
                message: 'categoryIds must be a non-empty array' 
            });
        }

        // Verify all categories belong to the user and are active
        const categories = await Category.find({
            _id: { $in: categoryIds },
            userId: req.user.id,
            isActive: true
        });

        if (categories.length !== categoryIds.length) {
            return res.status(400).json({ 
                message: 'Some categories not found or you do not have access to them' 
            });
        }

        // Update order for each category
        const updatePromises = categoryIds.map((categoryId, index) => 
            Category.updateOne(
                { _id: categoryId, userId: req.user.id },
                { order: index + 1 }
            )
        );

        await Promise.all(updatePromises);

        res.status(200).json({ 
            message: 'Categories reordered successfully' 
        });
    } catch (error) {
        console.error('Error reordering categories:', error);
        res.status(500).json({ message: 'Server error reordering categories' });
    }
};