import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategorySchema } from 'src/schemas/categories.schema';
import { TopicSchema } from 'src/schemas/topics.schema';
import { ParserController } from './topics.controller';
import { ParserService } from './topics.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Categories', schema: CategorySchema },
      { name: 'Topics', schema: TopicSchema },
    ]),
  ],
  controllers: [ParserController],
  providers: [ParserService],
})
export class ParserModule {}