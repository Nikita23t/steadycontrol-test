import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export interface Subcategory {
  name: string;
  url: string;
}

export interface Category {
  name: string;
  url: string;
  subcategories: Subcategory[];
}

@Schema()
export class Categories extends Document {

  @ApiProperty({ example: 'Фильмы', description: 'Название категории' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ 
    example: 'https://rutracker.org/forum/viewforum.php?f=42', 
    description: 'Ссылка на категорию' 
  })
  @Prop()
  url: string;

  @ApiProperty({
    description: 'Список подкатегорий',
    type: [Object],
    example: [{ name: 'Подкатегория 1', url: 'https://rutracker.org/forum/viewforum.php?f=123' }]
  })
  @Prop([{ type: { name: String, url: String } }])
  subcategories: { name: string; url: string }[];
  
}

export const CategorySchema = SchemaFactory.createForClass(Categories);
