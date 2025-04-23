import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategorySchema } from 'src/schemas/categories.schema';
import { TopicsSchema } from 'src/schemas/topics.schema';
import { RutrackerService } from './rutracker.service';
import { RutrackerController } from './rutracker.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Categories', schema: CategorySchema },
      { name: 'Topics', schema: TopicsSchema },
    ]),
  ],
  controllers: [RutrackerController],
  providers: [RutrackerService],
})
export class RutrackerModule {}