import User from "../models/userModel.js";
import Task from "../models/taskModel.js";
import Project from "../models/projectModel.js";
import Category from "../models/categoryModel.js";
import RefreshToken from "../models/refreshTokenModel.js"; // Assuming you have a model for refresh tokens




// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
    // req.user will be populated by authMiddleware (containing user.id)
    try {
        // Retrieve user but exclude the password field for security
        const user = await User.findById(req.user.id).select('-password -__v'); // Exclude password and version key
        if (!user) {
            return res.status(404).json({ message: 'User profile not found.' });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.error(`Error fetching user profile: ${error.message}`);
        res.status(500).json({ message: 'Server error fetching user profile.' });
    }
};


// @desc    Delete user account and all associated data
// @route   DELETE /api/users/me
// @access  Private
 const deleteMe = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find and delete the user
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({ message: 'User account not found.' });
        }

        // --- Cascading Deletes (Crucial for data integrity) ---
        // Delete all associated tasks
        await Task.deleteMany({ userId });
        // Delete all associated projects
        await Project.deleteMany({ userId });
        // Delete all associated categories (if user-specific)
        await Category.deleteMany({ userId });
        // Delete all associated refresh tokens (if you have this model)
        await RefreshToken.deleteMany({ userId });
        // --- End Cascading Deletes ---

        // Clear cookies if using them for JWT storage (accessToken and refreshToken)
        res.clearCookie('accessToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
        res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });

        res.status(200).json({ message: 'User account and all associated data deleted successfully.' });

    } catch (error) {
        console.error(`Error deleting user account: ${error.message}`);
        res.status(500).json({ message: 'Server error deleting user account.' });
    }
};



// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
 const updateMe = async (req, res) => {
    const { name, email, password } = req.body; // Allow partial updates

    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User profile not found.' });
        }

        // Update name if provided and changed
        if (name && name !== user.name) {
            const existingUser = await User.findOne({ name });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: 'name is already taken.' });
            }
            user.name = name;
        }

        // Update email if provided and changed
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: 'Email is already in use by another account.' });
            }
            user.email = email;
        }

        // Update password if provided
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
            }
            user.password = password; // The pre-save hook will hash this new password
        }

        await user.save(); // Mongoose will automatically update `updatedAt`

        res.status(200).json({
            message: 'User profile updated successfully.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error(`Error updating user profile: ${error.message}`);
        res.status(500).json({ message: 'Server error updating user profile.' });
    }
};



export { getMe, deleteMe, updateMe };