import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags("categories")
@Controller('/categories')
export class CategoriesController {
  constructor(private readonly cosmosService: CategoriesService) {}

  // @Get('/categories/:categories')
  // @ApiParam({ })
  // async getCategories() {
  //   return 
  // }

  // @Get('/categories')
  // @ApiParam({ })
  // async getTransaction() {
  //   return 
  // }
}