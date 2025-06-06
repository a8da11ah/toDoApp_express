import swaggerJSDoc from "swagger-jsdoc";


const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "ToDo App API",
    version: "1.0.0",
    description: "API documentation for the ToDo App",
  },
  servers: [
    {
      url: "http://localhost:3000",
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ["../routes/*.js"],
};

export const swaggerSpec = swaggerJSDoc(options);