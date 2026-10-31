import type { Application } from 'express';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUI from 'swagger-ui-express';
import { createSwaggerOptions } from './swagger.config';

export function setupSwagger(app: Application, port: number): void {
  const swaggerDocs = swaggerJsDoc(createSwaggerOptions(port));
  app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));
}
