import type { Options } from 'swagger-jsdoc';
import authSwagger from './authSwagger.json';
import rootSwagger from './rootSwagger.json';
import testAuthSwagger from './testAuthSwagger.json';
import userFilesSwagger from './userFilesSwagger.json';
import userSwagger from './userSwagger.json';

export function createSwaggerOptions(port: number): Options {
  return {
    definition: {
      openapi: '3.0.4',
      info: {
        title: 'TestrisBattle API',
        version: '1.0.0',
        description: 'API endpoints currently implemented by the backend.',
      },
      servers: [
        {
          url: `http://localhost:${port}`,
        },
      ],
      paths: {
        ...rootSwagger.paths,
        ...authSwagger.paths,
        ...testAuthSwagger.paths,
        ...userSwagger.paths,
        ...userFilesSwagger.paths,
      },
      components: {
        schemas: {
          ...authSwagger.components.schemas,
          ...userFilesSwagger.components.schemas,
          ...userSwagger.components.schemas,
        },
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          },
        },
      },
    },
    apis: [],
  };
}
