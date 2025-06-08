import Joi from "joi";

const registerSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required() ,
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const verifiyEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().required().min(6).max(6),
})

const resendCodeSchema = Joi.object({
  email: Joi.string().email().required(),
})


export { registerSchema, loginSchema ,verifiyEmailSchema,resendCodeSchema};
