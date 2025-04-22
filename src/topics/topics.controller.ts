import { Controller, Get, Query } from '@nestjs/common';
import { ParserService } from './topics.service';


@Controller('parser')
export class ParserController {
  constructor(private readonly parserService: ParserService) {}

  @Get('login')
  async login(
    @Query('username') username: string,
    @Query('password') password: string,
  ) {
    await this.parserService.login(username, password);
    return { message: 'Logged in successfully' };
  }

  @Get('parse')
  async parse(
    @Query('subcategoryUrl') url: string,
    @Query('subcategoryName') subcategoryName: string,
  ) {
    await this.parserService.parseTopicsFromSubcategory(url, subcategoryName);
    return { message: 'Parsing and saving done' };
  }
}