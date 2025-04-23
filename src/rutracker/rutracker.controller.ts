import { Controller, Get, Query, Body, Post, Logger } from '@nestjs/common';
import { ParserService } from './rutracker.service';

@Controller('parser')
export class ParserController {
  private readonly logger = new Logger(ParserController.name);

  constructor(private readonly parserService: ParserService) { }

  @Post('login')
  async login(
    @Body() body: { username: string; password: string },
  ): Promise<string> {
    try {
      await this.parserService.login(body.username, body.password);
      return 'Успешный логин!';
    } catch (err) {
      this.logger.error(`Ошибка при логине: ${err.message}`);
      return 'Ошибка при логине';
    }
  }

  @Post('category')
  async saveCategory(@Body() body: { name: string; url: string; subcategories: { name: string; url: string }[]; }): Promise<string> {
    try {
      await this.parserService.saveCategory(body.name, body.url, body.subcategories);
      return 'Категория сохранена/обновлена';
    } catch (err) {
      this.logger.error(`Ошибка при сохранении категории: ${err.message}`);
      return 'Ошибка при сохранении категории';
    }
  }

  @Get('parse-all-categories')
  async parseAll(): Promise<string> {
    try {
      await this.parserService.parseAllCategories();
      return 'Все категории и подкатегории успешно распарсены и сохранены';
    } catch (err) {
      this.logger.error(`Ошибка при парсинге категорий: ${err.message}`);
      return 'Ошибка при парсинге категорий';
    }
  }


}
