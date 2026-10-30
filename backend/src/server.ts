import app from './app';
import config from './config/config';
import swaggerUI from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import mongoose from 'mongoose';


mongoose.connect(config.mongoDBURL)
    .then(() => console.log("Connection Successful"))
    .catch((err) => console.error("Connection Error:", err));

// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    myapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'API documentation',
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
      },
    ],
  },
  apis: ['./routes/*.js'], // files containing annotations as above
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});