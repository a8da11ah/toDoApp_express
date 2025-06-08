import { Router } from "express";
import {validateBody, validateQuery} from "../middlewares/joiValidate.js";
import{createCategorySchema, getCategoriesQuerySchema,updateCategorySchema} 
from "../validationsSchemas/categoriesSchema.js"


import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  restoreCategory,
  getCategoryById,
  reorderCategories
} from "../controllers/categoriesController.js";
const categoriesRouter = Router();


categoriesRouter.post(
  "/",
  validateBody(createCategorySchema),
  createCategory
);

categoriesRouter.get("/", validateQuery(getCategoriesQuerySchema), getCategories);    


categoriesRouter.patch("/:id", validateBody(updateCategorySchema), updateCategory); // Update category
categoriesRouter.delete("/:id", deleteCategory); // Delete category
categoriesRouter.get("/:id", getCategoryById); // Get category by ID


categoriesRouter.patch("/:id/restore", restoreCategory); // Restore category
categoriesRouter.patch("/reorder", reorderCategories);





export default categoriesRouter
