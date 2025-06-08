// models/refreshTokenModel.js
import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true, // Ensure no duplicate tokens
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Link to your User model
    ref: 'User', // Reference the User model
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d', // MongoDB TTL index (adjust as needed for your refresh token expiry)
                     // This will automatically delete tokens after this period
  },
  // Optional: For refresh token rotation and reuse detection
  previousToken: { // Store a hash or ID of the previous token in the chain
    type: String,
    default: null,
  },
  // Optional: For multi-device management / more specific revocation
  deviceName: {
    type: String,
    // e.g., 'iPhone 15', 'Chrome on Windows', 'Safari on MacBook Pro'
    // You'd get this from user-agent string or client-provided data
  },
  ipAddress: {
    type: String, // Store the IP address from which the token was issued
  },
  // Optional: For manual revocation status (if you don't delete on revoke)
  isRevoked: {
    type: Boolean,
    default: false,
  },
});

// Create an index on the 'token' field for fast lookups
// refreshTokenSchema.index({ token: 1 });

// Create an index on the 'userId' field for efficient lookup of all tokens for a user
refreshTokenSchema.index({ userId: 1 });


const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;