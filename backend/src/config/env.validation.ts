import Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRATION: Joi.number().default(900),
  JWT_REFRESH_EXPIRATION: Joi.number().default(604800),
  BACKEND_PORT: Joi.number().default(3001),
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),
});
