import Joi from 'joi';

// Schema for updating user profile (PUT /me)
 const updateUserProfileSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .messages({
      'string.base': 'Name should be a string',
      'string.min': 'Name should have a minimum length of {#limit}',
      'string.max': 'Name should have a maximum length of {#limit}'
    })
    .optional(), // Make name optional for update

  email: Joi.string()
    .email({ tlds: { allow: false } }) // allow: false means 'gmail.com' is fine, but not '.com' alone
    .trim()
    .messages({
      'string.email': 'Email must be a valid email address'
    })
    .optional(), // Make email optional for update

  password: Joi.string()
    .min(6)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$')) // At least one lowercase, one uppercase, one number
    .messages({
      'string.min': 'Password must be at least {#limit} characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    })
    .optional(), // Make password optional for update

  // Add more fields as needed for your user profile
  // For example:
  // age: Joi.number().integer().min(0).max(120).optional(),
  // address: Joi.string().trim().optional(),
});


export {updateUserProfileSchema};