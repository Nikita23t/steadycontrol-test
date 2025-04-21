import { Controller, Get, Param } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { ApiParam, ApiTags } from '@nestjs/swagger';


@ApiTags("topics")
@Controller('/topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get('/topics/:topics')
  // @ApiParam({ })
  getTopics() {
    return 
  }

  @Get('/topics')
  // @ApiParam({ })
  getTransaction() {
    return 
  }
}