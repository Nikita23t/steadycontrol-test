import { Controller, Get, Body, Post, Logger } from '@nestjs/common';
import { RutrackerService } from './rutracker.service';
import { ApiOperation, ApiProperty } from '@nestjs/swagger';
import { TopicsDto } from './dto/topics.dto';

@Controller('/parser')
export class RutrackerController {
  private readonly logger = new Logger(RutrackerController.name);

  constructor(private readonly rutrackerService: RutrackerService) { }

  @ApiOperation({ summary: 'логин для получения куков' })
  @ApiProperty({ example: { username: "username",password: "password"}, description: 'логин' })
  @Post('/login')
  async login(  @Body() body: { username: string; password: string } ) {
    try {
      const result = await this.rutrackerService.login(body.username, body.password);
      return result;
    } catch (err) {
      this.logger.error(`Ошибка л ${err.message}`);
      return 'Ошибка л';
    }
  }

  @ApiOperation({ summary: 'Распарсить все категории и подкатегории' })
  @Get('/categories')
  async categories() {
    try {
      const result = await this.rutrackerService.categories();
      return result;
    } catch (err) {
      this.logger.error(`Ошибка к ${err.message}`);
      return 'Ошибка к';
    }
  }

  @ApiOperation({ summary: 'Распарсить топики из подкатегории' })
  @ApiProperty({ example: 'https://rutracker.org/forum/viewforum.php?f=123', description: 'URL подкатегории' })
  @Post('/topics')
  async topics(@Body() body: TopicsDto) {
    try {
      const result = await this.rutrackerService.topics(body);
      return result;
    } catch (err) {
      this.logger.error(`Ошибка т ${err.message}`);
      return 'Ошибка т';
    }
  }


}
