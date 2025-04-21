import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function start() {
  const app = await NestFactory.create(AppModule);

  const docs = new DocumentBuilder()
    .setTitle('Тестовое задание STAKEME')
    .setDescription('API для тестового задания')
    .setVersion("1.0.0")
    .addTag('nikita23t/pierrdoon')
    .build()

  const document = SwaggerModule.createDocument(app, docs);
  SwaggerModule.setup('/api/docs', app, document)

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.listen(process.env.PORT || 6999,
    () => console.log(`Сервер запустился на порту ${process.env.PORT || 6999}`));
}

start();
