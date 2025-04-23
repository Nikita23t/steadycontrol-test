import { Controller, Get, Body, Post, Logger } from '@nestjs/common';
import { RutrackerService } from './rutracker.service';
import { ApiBody, ApiOperation, ApiProperty } from '@nestjs/swagger';

@Controller('/parser')
export class RutrackerController {
  private readonly logger = new Logger(RutrackerController.name);

  constructor(private readonly rutrackerService: RutrackerService) { }

  // @Post('login')
  // async login() {
  //   try {
  //     await this.rutrackerService.login();
  //     return 'Успешный логин!';
  //   } catch (err) {
  //     this.logger.error(`Ошибка при логине: ${err.message}`);
  //     return 'Ошибка при логине';
  //   }
  // }

  // @Post('/category')
  // async saveCategory(@Body() body: { name: string; url: string; subcategories: { name: string; url: string }[]; }) {
  //   try {
  //     await this.rutrackerService.login();
  //     const result = await this.rutrackerService.saveCategory(body.name, body.url, body.subcategories);
  //     return result;
  //   } catch (err) {
  //     this.logger.error(`Ошибка ${err.message}`);
  //     return 'Ошибка';
  //   }
  // }

  @ApiOperation({ summary: 'Распарсить все категории и подкатегории' })
  @Get('/parse-all-categories')
  async parseAll() {
    try {
      await this.rutrackerService.login();
      const result = await this.rutrackerService.parseAllCategories();
      return result;
    } catch (err) {
      this.logger.error(`Ошибка к ${err.message}`);
      return 'Ошибка к';
    }
  }

  @ApiOperation({ summary: 'Распарсить топики из подкатегории' })
  @ApiProperty({ example: 'https://rutracker.org/forum/viewforum.php?f=123', description: 'URL подкатегории' })
  @Post('/parse-topics')
  async parseTopics(@Body() body: { url: string }) {
    try {
      await this.rutrackerService.login();
      const result = await this.rutrackerService.parseTopicsFromSubcategory(body.url);
      return result;
    } catch (err) {
      this.logger.error(`Ошибка т ${err.message}`);
      return 'Ошибка т';
    }
  }


}
