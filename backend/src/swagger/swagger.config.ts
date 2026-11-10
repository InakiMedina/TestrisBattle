import type { Options } from 'swagger-jsdoc';
import authSwagger from './authSwagger.json';
import rootSwagger from './rootSwagger.json';
import testAuthSwagger from './testAuthSwagger.json';

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
      },
      components: {
        ...authSwagger.components,
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
