import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Allows the Vercel frontend to communicate with this backend
  app.enableCors({
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // CRITICAL FIX: Use process.env.PORT for Render, fallback to 3000 for local dev
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`Backend server is running on port: ${port}`);
}
bootstrap();