const port = process.env.PORT || 3000;

const isProduction = process.env.NODE_ENV === 'production';
const basePath = isProduction ? './dist' : './src';
const ext = isProduction ? '.js' : '.ts';

export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express API with Swagger',
      version: '1.0.0',
      description: 'REST API documentation using Swagger/OpenAPI',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Development server (HTTP)',
      },
      {
        url: `https://localhost:${port}`,
        description: 'Development server (HTTPS)',
      },
    ],
  },
  apis: [`${basePath}/models/*${ext}`, `${basePath}/routes/!(*.test)${ext}`],
};
