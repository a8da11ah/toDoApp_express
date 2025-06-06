// middleware/validate.js
import { createValidator } from 'express-joi-validation';
const validator = createValidator();

 const validateBody = (schema) => validator.body(schema);
 const validateQuery = (schema) => validator.query(schema);
 const validateParams = (schema) => validator.params(schema);
 const validateHeaders = (schema) => validator.headers(schema);

 export { validateBody, validateQuery, validateParams, validateHeaders };
 