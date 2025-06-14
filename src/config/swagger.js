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
      url: "http://localhost:5000/", // Update this to your server URL
        description: "Development server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  // security: [
  //   {
  //     // bearerAuth: [],
  //   },
  // ],
};

const options = {
   definition: swaggerDefinition,
  apis: ["src/routes/*.js"],
};

export const swaggerSpec = swaggerJSDoc(options);