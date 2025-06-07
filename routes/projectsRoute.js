import { Router } from "express";
import { getProjects, getProjectById, createProject, updateProject, deleteProject, patchProject } from "../controllers/projectsController.js";

const projectsRouter = Router();



projectsRouter.route('/')
    .get(  getProjects)    // Changed controller function
    .post(  createProject); // Changed controller function

projectsRouter.route('/:id')
    .get(  getProjectById)    // Changed controller function
    .put(  updateProject)     // Changed controller function
    .patch(  patchProject)    // Changed controller function
    .delete(  deleteProject); // Changed controller function



export default projectsRouter
