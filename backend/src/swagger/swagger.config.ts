import type { Options } from 'swagger-jsdoc';
import authSwagger from './authSwagger.json';
import rootSwagger from './rootSwagger.json';

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
      },
      components: authSwagger.components,
    },
    apis: [],
  };
}
