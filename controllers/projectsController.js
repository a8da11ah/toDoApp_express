// controllers/projectController.js
import Project from '../models/projectModel.js'; // Changed from List
import Task from '../models/taskModel.js';

// @desc    Get all projects for the authenticated user with filtering, sorting, and pagination
// @route   GET /api/projects?name=<name>&sort=<field>&order=(asc|desc)&page=<num>&limit=<num>
// @access  Private
 const getProjects = async (req, res) => { // Changed from getLists
    try {
        //
        const userId = req.user.id;
        const query = { userId };
        //
        if (req.query.name) {
            query.name = { $regex: req.query.name, $options: 'i' };
        }

        let sort = {};
        if (req.query.sort) {
            const orderBy = req.query.order === 'desc' ? -1 : 1;
            sort[req.query.sort] = orderBy;
        } else {
            sort.createdAt = -1;
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Fetch projects with pagination, sorting, and filtering
        // Changed from List.find to Project.find
        // Also changed from List.countDocuments to Project.countDocuments
        // Note: Ensure that the Project model has the necessary fields and indexes for efficient querying
        const projects = await Project.find(query) 
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const totalProjects = await Project.countDocuments(query);

        res.status(200).json({
            data: projects,
            currentPage: page,
            totalPages: Math.ceil(totalProjects / limit),
            totalItems: totalProjects,
            message: 'Projects fetched successfully' // Changed message
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching projects' }); // Changed message
    }
};

// @desc    Get a single project by ID for the authenticated user
// @route   GET /api/projects/:id
// @access  Private
 const getProjectById = async (req, res) => { 
    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.user.id }); 

        if (!project) { // Changed variable name
            return res.status(404).json({ message: 'Project not found or you do not have access to it' }); // Changed message
        }

        res.status(200).json(project); // Changed variable name
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching project' }); // Changed message
    }
};

// @desc    Create a new project for the authenticated user
// @route   POST /api/projects
// @access  Private
 const createProject = async (req, res) => { // Changed from createList
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Project name is required' }); // Changed message
    }

    try {
        const newProject = await Project.create({ // Changed from List.create
            name,
            description,
            userId: req.user.id,
        });

        res.status(201).json(newProject); // Changed variable name
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating project' }); // Changed message
    }
};

// @desc    Update an existing project for the authenticated user (Full replacement)
// @route   PUT /api/projects/:id
// @access  Private
 const updateProject = async (req, res) => { // Changed from updateList
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Project name is required for PUT update' }); // Changed message
    }

    try {
        const project = await Project.findOneAndUpdate( // Changed from List.findOneAndUpdate
            { _id: req.params.id, userId: req.user.id },
            { $set: { name, description } },
            { new: true, runValidators: true }
        );

        if (!project) { // Changed variable name
            return res.status(404).json({ message: 'Project not found or you do not have access to it' }); // Changed message
        }

        res.status(200).json(project); // Changed variable name
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating project' }); // Changed message
    }
};


// @desc    Partially update an existing project for the authenticated user (Partial modification)
// @route   PATCH /api/projects/:id
// @access  Private
 const patchProject = async (req, res) => { // Changed from patchList
    const updates = req.body;

    const allowedUpdates = ['name', 'description'];
    const isValidOperation = Object.keys(updates).every((key) => allowedUpdates.includes(key));

    if (!isValidOperation) {
        return res.status(400).json({ message: 'Invalid updates provided' });
    }

    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.user.id }); // Changed from List.findOne

        if (!project) { // Changed variable name
            return res.status(404).json({ message: 'Project not found or you do not have access to it' }); // Changed message
        }

        for (const key in updates) {
            if (updates.hasOwnProperty(key)) {
                project[key] = updates[key]; // Changed variable name
            }
        }

        await project.save({ runValidators: true }); // Changed variable name

        res.status(200).json(project); // Changed variable name
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error patching project' }); // Changed message
    }
};

// @desc    Delete a project for the authenticated user
// @route   DELETE /api/projects/:id
// @access  Private
 const deleteProject = async (req, res) => { // Changed from deleteList
    try {
        const projectId = req.params.id; // Changed from listId

        const project = await Project.findOneAndDelete({ _id: projectId, userId: req.user.id }); // Changed from List.findOneAndDelete

        if (!project) { // Changed variable name
            return res.status(404).json({ message: 'Project not found or you do not have access to it' }); // Changed message
        }

        // Cascading Update for Tasks: Set projectId to null for associated tasks
        await Task.updateMany(
            { projectId: projectId, userId: req.user.id }, // Changed from listId
            { $set: { projectId: null } } // Changed from listId
        );

        res.status(200).json({ message: 'Project deleted successfully and associated tasks updated' }); // Changed message
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting project' }); // Changed message
    }
};

export {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    patchProject,
    deleteProject
}