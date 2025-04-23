import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
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
  @Prop({ required: true })
  name: string;

  @Prop()
  url: string;

  @Prop([{ 
    type: {
      name: String,
      url: String,
    }
  }])
  subcategories: { name: string; url: string }[];
  
}

export const CategorySchema = SchemaFactory.createForClass(Categories);
