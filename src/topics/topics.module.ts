import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';

@Module({
  imports: [HttpModule],
  controllers: [TopicsController],
  providers: [TopicsService],
})
export class TopicsModule {}