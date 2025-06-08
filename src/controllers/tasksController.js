import Task from '../models/taskModel.js';
import Project from '../models/projectModel.js';
import Category from '../models/categoryModel.js';
import mongoose from 'mongoose'; // For ObjectId validation

// Helper function to handle completedAt timestamp
const handleCompletionStatus = (task, isCompleted) => {
    if (isCompleted !== undefined && task.isCompleted !== isCompleted) {
        task.isCompleted = isCompleted;
        task.completedAt = isCompleted ? new Date() : null;
    }
};


// @desc    Get all tasks for the authenticated user
// @route   GET /api/tasks
// @access  Private
// Supports filtering by projectId, categoryId, status, priority, isCompleted, dueDate, search, pagination, and sorting
export const getTasks = async (req, res) => {
    try {
        const userId = req.user._id;
        let query = { userId }; // Base query for authenticated user

        const {
            projectId,
            categoryId,
            status,
            priority,
            isCompleted,
            dueDate,
            search,
            createdAfter,
            createdBefore,
            updatedAfter,
            updatedBefore,
            page,
            limit,
            sort,
            order,
            fields,
            includeSubtasks
        } = req.query;

        // --- Business Logic Validation (things Joi can't check) ---
        
        // Verify project exists and belongs to user
        if (projectId) {
            const projectExists = await Project.findOne({ 
                _id: projectId, 
                userId
            });
            if (!projectExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Project not found or not accessible'
                });
            }
            query.ProjectId = projectId; // Note: capital P to match schema
        }

        // Verify category exists and belongs to user
        if (categoryId) {
            const categoryExists = await Category.findOne({ 
                _id: categoryId, 
                userId 
            });
            if (!categoryExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found or not accessible'
                });
            }
            query.categories = { $in: [categoryId] };
        }

        // --- Simple Parameter Processing (Joi already validated format) ---
        
        if (status) {
            query.status = Array.isArray(status) ? { $in: status } : status;
        }

        if (priority) {
            query.priority = Array.isArray(priority) ? { $in: priority } : priority;
        }

        if (isCompleted !== undefined) {
            query.isCompleted = isCompleted;
        }

        // --- Date Range Filtering ---
        if (createdAfter || createdBefore) {
            query.createdAt = {};
            if (createdAfter) query.createdAt.$gte = new Date(createdAfter);
            if (createdBefore) query.createdAt.$lte = new Date(createdBefore);
        }

        if (updatedAfter || updatedBefore) {
            query.updatedAt = {};
            if (updatedAfter) query.updatedAt.$gte = new Date(updatedAfter);
            if (updatedBefore) query.updatedAt.$lte = new Date(updatedBefore);
        }

        // --- Complex Due Date Logic (Joi can't handle this calculation) ---
        if (dueDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            switch (dueDate) {
                case 'today':
                    query.dueDate = { $gte: today, $lt: tomorrow };
                    break;
                case 'overdue':
                    query.dueDate = { $lt: today };
                    query.isCompleted = false;
                    break;
                case 'upcoming':
                    query.dueDate = { $gte: tomorrow };
                    query.isCompleted = false;
                    break;
                case 'this-week':
                    const thisWeek = new Date(today);
                    thisWeek.setDate(today.getDate() + 7);
                    query.dueDate = { $gte: today, $lt: thisWeek };
                    break;
                case 'this-month':
                    const thisMonth = new Date(today);
                    thisMonth.setMonth(today.getMonth() + 1);
                    query.dueDate = { $gte: today, $lt: thisMonth };
                    break;
                case 'no-due-date':
                    query.dueDate = { $exists: false };
                    break;
                default:
                    // Handle date ranges (startDate,endDate) or specific dates
                    if (dueDate.includes(',')) {
                        const [startDate, endDate] = dueDate.split(',');
                        query.dueDate = { 
                            $gte: new Date(startDate), 
                            $lte: new Date(endDate) 
                        };
                    } else {
                        // Specific date - Joi already validated it's a valid date
                        const specificDate = new Date(dueDate);
                        const nextDay = new Date(specificDate);
                        nextDay.setDate(specificDate.getDate() + 1);
                        query.dueDate = { $gte: specificDate, $lt: nextDay };
                    }
            }
        }

        // --- Search Logic (only in title and description based on schema) ---
        if (search) {
            const searchRegex = { $regex: search.trim(), $options: 'i' };
            query.$or = [
                { title: searchRegex },
                { description: searchRegex }
            ];
        }

        // --- Sorting Logic ---
        let sortOptions = {};
        
        if (sort) {
            sortOptions[sort] = order === 'desc' ? -1 : 1;
            // Add secondary sort for consistency
            if (sort !== 'createdAt') {
                sortOptions.createdAt = -1;
            }
        } else {
            // Smart default sorting based on context
            if (query.isCompleted === false) {
                sortOptions.dueDate = 1; // Incomplete tasks: earliest due date first
                sortOptions.priority = -1; // Then by priority (High -> Medium -> Low)
            } else {
                sortOptions.createdAt = -1; // Default: newest first
            }
        }

        // --- Pagination Setup ---
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;

        // --- Field Selection (based on actual schema fields) ---
        let selectFields = '';
        if (fields) {
            const allowedFields = [
                'title', 'description', 'status', 'priority', 'isCompleted',
                'dueDate', 'completedAt', 'createdAt', 'updatedAt', 
                 'categories'
            ];
            const requestedFields = fields.split(',').map(f => f.trim());
            const validFields = requestedFields.filter(f => allowedFields.includes(f));
            if (validFields.length > 0) {
                selectFields = validFields.join(' ');
            }
        }

        // --- Subtasks handling ---
        let subtaskProjection = {};
        if (includeSubtasks === 'false') {
            subtaskProjection = { subtasks: 0 }; // Exclude subtasks if not needed
        }

        // --- Execute Database Queries ---
        const [tasks, totalTasks, stats] = await Promise.all([
            Task.find(query, subtaskProjection)
                .populate('ProjectId', 'name')
                .populate('categories', 'name color')
                .select(selectFields || undefined)
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            
            Task.countDocuments(query),
            
            // Get user's task statistics with subtask info
            Task.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId) } },
                {
                    $addFields: {
                        totalSubtasks: { $size: { $ifNull: ['$subtasks', []] } },
                        completedSubtasks: {
                            $size: {
                                $filter: {
                                    input: { $ifNull: ['$subtasks', []] },
                                    cond: { $eq: ['$$this.isCompleted', true] }
                                }
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalTasks: { $sum: 1 },
                        completedTasks: { $sum: { $cond: ['$isCompleted', 1, 0] } },
                        overdueTasks: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $lt: ['$dueDate', new Date()] },
                                            { $eq: ['$isCompleted', false] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        highPriorityTasks: { 
                            $sum: { $cond: [{ $eq: ['$priority', 'High'] }, 1, 0] } 
                        },
                        pendingTasks: { 
                            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } 
                        },
                        inProgressTasks: { 
                            $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } 
                        },
                        totalSubtasks: { $sum: '$totalSubtasks' },
                        completedSubtasks: { $sum: '$completedSubtasks' }
                    }
                }
            ])
        ]);

        // --- Add subtask completion percentage to each task ---
        const tasksWithSubtaskStats = tasks.map(task => {
            if (task.subtasks && task.subtasks.length > 0) {
                const completedSubtasks = task.subtasks.filter(st => st.isCompleted).length;
                return {
                    ...task,
                    subtaskStats: {
                        total: task.subtasks.length,
                        completed: completedSubtasks,
                        completionPercentage: Math.round((completedSubtasks / task.subtasks.length) * 100)
                    }
                };
            }
            return task;
        });

        // --- Build Response ---
        const statsData = stats[0] || {
            totalTasks: 0,
            completedTasks: 0,
            overdueTasks: 0,
            highPriorityTasks: 0,
            pendingTasks: 0,
            inProgressTasks: 0,
            totalSubtasks: 0,
            completedSubtasks: 0
        };

        const response = {
            success: true,
            data: tasksWithSubtaskStats,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalTasks / limitNum),
                totalItems: totalTasks,
                itemsPerPage: limitNum,
                hasNextPage: pageNum < Math.ceil(totalTasks / limitNum),
                hasPrevPage: pageNum > 1
            },
            filters: {
                applied: Object.keys(req.query).length > 2, // More than page & limit
                count: Object.keys(req.query).filter(key => 
                    !['page', 'limit', 'sort', 'order', 'fields', 'includeSubtasks'].includes(key)
                ).length
            },
            stats: {
                tasks: {
                    total: statsData.totalTasks,
                    completed: statsData.completedTasks,
                    overdue: statsData.overdueTasks,
                    highPriority: statsData.highPriorityTasks,
                    pending: statsData.pendingTasks,
                    inProgress: statsData.inProgressTasks,
                    completionRate: statsData.totalTasks > 0 
                        ? Math.round((statsData.completedTasks / statsData.totalTasks) * 100) 
                        : 0
                },
                subtasks: {
                    total: statsData.totalSubtasks,
                    completed: statsData.completedSubtasks,
                    completionRate: statsData.totalSubtasks > 0 
                        ? Math.round((statsData.completedSubtasks / statsData.totalSubtasks) * 100) 
                        : 0
                }
            },
            message: `Retrieved ${tasks.length} of ${totalTasks} tasks`
        };

        // Add debug info in development
        // if (process.env.NODE_ENV === 'development') {
        //     response.debug = {
        //         query: JSON.stringify(query),
        //         executionTime: Date.now() - (req.startTime || Date.now())
        //     };
        // }

        res.status(200).json(response);

    } catch (error) {
        console.error('Error in getTasks:', error);
        
        // Handle specific MongoDB errors
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid data format in request'
            });
        }

        // Generic server error
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve tasks',
            ...(process.env.NODE_ENV === 'development' && { 
                error: error.message,
                stack: error.stack 
            })
        });
    }
};

// @desc    Get a single task by ID for the authenticated user
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, userId: req.user.id })
            .populate('projectId', 'name')
            .populate('categories', 'name color');

        if (!task) {
            return res.status(404).json({ message: 'Task not found or you do not have access to it' });
        }

        res.status(200).json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching task' });
    }
};




// @desc    Create a new task for the authenticated user
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res) => {
    const { title, description, dueDate, priority, status, projectId, categories, subtasks, isCompleted } = req.body;

    if (!title) {
        return res.status(400).json({ message: 'Task title is required' });
    }

    try {
        // Optional: Validate projectId existence and ownership
        if (projectId && !mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ message: 'Invalid projectId format' });
        }
        if (projectId) {
            const project = await Project.findOne({ _id: projectId, userId: req.user.id });
            if (!project) {
                return res.status(404).json({ message: 'Project not found or does not belong to you' });
            }
        }

        // Optional: Validate categories existence and ownership
        if (categories && categories.length > 0) {
            const existingCategories = await Category.find({ _id: { $in: categories }, userId: req.user.id });
            if (existingCategories.length !== categories.length) {
                return res.status(404).json({ message: 'One or more categories not found or do not belong to you' });
            }
        }

        const newTask = await Task.create({
            userId: req.user.id,
            title,
            description,
            dueDate,
            priority,
            status: status || 'Pending', // Default status if not provided
            projectId: projectId || null, // Allow tasks without a project
            categories: categories || [],
            subtasks: subtasks || [],
            // If isCompleted is explicitly set to true on creation
            isCompleted: isCompleted === true,
            completedAt: isCompleted === true ? new Date() : null,
        });

        res.status(201).json(newTask);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating task' });
    }
};

// @desc    Update an existing task for the authenticated user (PATCH for partial updates)
// @route   PATCH /api/tasks/:id
// @access  Private
export const updateTask = async (req, res) => {
    const updates = req.body;
    const { id } = req.params;

    const allowedUpdates = [
        'title', 'description', 'dueDate', 'priority', 'status', 'projectId', 'categories', 'isCompleted'
    ];
    const isValidOperation = Object.keys(updates).every((key) => allowedUpdates.includes(key));

    if (!isValidOperation) {
        return res.status(400).json({ message: 'Invalid updates provided' });
    }

    try {
        const task = await Task.findOne({ _id: id, userId: req.user.id });

        if (!task) {
            return res.status(404).json({ message: 'Task not found or you do not have access to it' });
        }

        // Handle `isCompleted` and `completedAt` logic
        handleCompletionStatus(task, updates.isCompleted);
        delete updates.isCompleted; // Remove from updates to prevent double handling

        // Validate projectId if it's being updated
        if (updates.projectId !== undefined) {
            if (updates.projectId === null || updates.projectId === '') { // Allow removing project
                task.projectId = null;
            } else if (!mongoose.Types.ObjectId.isValid(updates.projectId)) {
                return res.status(400).json({ message: 'Invalid projectId format' });
            } else {
                const project = await Project.findOne({ _id: updates.projectId, userId: req.user.id });
                if (!project) {
                    return res.status(404).json({ message: 'Project not found or does not belong to you' });
                }
                task.projectId = updates.projectId;
            }
            delete updates.projectId;
        }

        // Validate categories if they are being updated
        if (updates.categories !== undefined) {
            if (!Array.isArray(updates.categories)) {
                return res.status(400).json({ message: 'Categories must be an array' });
            }
            if (updates.categories.length > 0) {
                const existingCategories = await Category.find({ _id: { $in: updates.categories }, userId: req.user.id });
                if (existingCategories.length !== updates.categories.length) {
                    return res.status(404).json({ message: 'One or more categories not found or do not belong to you' });
                }
            }
            task.categories = updates.categories;
            delete updates.categories;
        }

        // Apply remaining updates
        Object.keys(updates).forEach((key) => {
            task[key] = updates[key];
        });

        await task.save({ runValidators: true });

        res.status(200).json(task);

    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error updating task' });
    }
};

// @desc    Delete a task for the authenticated user
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

        if (!task) {
            return res.status(404).json({ message: 'Task not found or you do not have access to it' });
        }

        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting task' });
    }
};


// --- Subtask Operations (Nested) ---

// @desc    Add a subtask to a task
// @route   POST /api/tasks/:taskId/subtasks
// @access  Private
export const addSubtask = async (req, res) => {
    const { title } = req.body;
    const { taskId } = req.params;

    if (!title) {
        return res.status(400).json({ message: 'Subtask title is required' });
    }

    try {
        const task = await Task.findOne({ _id: taskId, userId: req.user.id });

        if (!task) {
            return res.status(404).json({ message: 'Task not found or you do not have access to it' });
        }

        task.subtasks.push({ title });
        await task.save({ runValidators: true });

        // Return the newly added subtask or the updated task (client's choice)
        res.status(201).json(task.subtasks[task.subtasks.length - 1]);
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error adding subtask' });
    }
};

// @desc    Update a specific subtask within a task
// @route   PATCH /api/tasks/:taskId/subtasks/:subtaskId
// @access  Private
export const updateSubtask = async (req, res) => {
    const { taskId, subtaskId } = req.params;
    const { title, isCompleted } = req.body; // Can be partial update

    try {
        const task = await Task.findOne({ _id: taskId, userId: req.user.id });

        if (!task) {
            return res.status(404).json({ message: 'Task not found or you do not have access to it' });
        }

        const subtask = task.subtasks.id(subtaskId); // Find subtask by its _id
        if (!subtask) {
            return res.status(404).json({ message: 'Subtask not found' });
        }

        if (title !== undefined) {
            subtask.title = title;
        }

        // Handle subtask completion status and timestamp
        if (isCompleted !== undefined && subtask.isCompleted !== isCompleted) {
            subtask.isCompleted = isCompleted;
            subtask.completedAt = isCompleted ? new Date() : null;
        }

        await task.save({ runValidators: true });

        res.status(200).json(subtask);
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error updating subtask' });
    }
};

// @desc    Delete a specific subtask from a task
// @route   DELETE /api/tasks/:taskId/subtasks/:subtaskId
// @access  Private
export const deleteSubtask = async (req, res) => {
    const { taskId, subtaskId } = req.params;

    try {
        const task = await Task.findOne({ _id: taskId, userId: req.user.id });

        if (!task) {
            return res.status(404).json({ message: 'Task not found or you do not have access to it' });
        }

        // Use Mongoose's .pull() method or filter
        task.subtasks.id(subtaskId).remove(); // Removes subdocument by _id
        // Alternative: task.subtasks = task.subtasks.filter(sub => sub._id.toString() !== subtaskId);

        await task.save();

        res.status(200).json({ message: 'Subtask deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting subtask' });
    }
};

