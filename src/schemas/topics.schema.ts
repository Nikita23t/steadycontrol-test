import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Topics extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop()
  releaseDate: Date;

  @Prop()
  author: string;

  @Prop()
  magnetLink: string;

  @Prop()
  torrentFileUrl: string;

  @Prop({ type: [{ name: String, date: Date }] })
  thanks: { name: string; date: Date }[];

  @Prop()
  topicUrl: string;

  @Prop()
  subcategory: string;
}

export const TopicSchema = SchemaFactory.createForClass(Topics);
