import joi from 'joi';


// --- Category Schemas ---
export const createCategorySchema = Joi.object({
    name: Joi.string().trim().min(1).required(),
    color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional() // Basic hex color validation
});

export const updateCategorySchema = Joi.object({
    name: Joi.string().trim().min(1).optional(),
    color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional()
}).min(1);