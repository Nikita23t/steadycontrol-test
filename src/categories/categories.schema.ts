import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Categories extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  url: string;

  @Prop({ type: [{ type: String }] })
  subcategories: string[];
}

export const CategorySchema = SchemaFactory.createForClass(Categories);
