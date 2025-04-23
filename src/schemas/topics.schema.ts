import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export interface Topic {
  title: string;
  url: string;
}

@Schema()
export class TopicSchema extends Document {

  @ApiProperty({ example: 'Интересный торрент', description: 'Название темы' })
  @Prop() 
  title: string;

  @ApiProperty({ 
    example: 'https://rutracker.org/forum/viewtopic.php?t=123456', 
    description: 'Ссылка на тему' 
  })
  @Prop() 
  url: string;

  @ApiProperty({ example: 'someuser', description: 'Автор топика' })
  @Prop() 
  author: string;

  @ApiProperty({ example: '2025-04-23 14:00', description: 'Дата публикации' })
  @Prop() 
  postedAt: string;

  @ApiProperty({ example: 'magnet:?xt=urn:btih:...', description: 'Magnet-ссылка' })
  @Prop() 
  magnetLink: string;

  @ApiProperty({ 
    example: 'https://rutracker.org/dl.php?t=123456', 
    description: 'Ссылка на .torrent файл' 
  })
  @Prop() 
  torrentFileLink: string;

  @ApiProperty({ 
    example: { 'Качество': 'HD', 'Язык': 'Русский' }, 
    description: 'Дополнительные детали (ключ-значение)' 
  })
  @Prop({ type: Map, of: String })
  details: Record<string, string>;

  @ApiProperty({
    example: [{ username: 'user123', date: '2025-04-23' }],
    description: 'Список пользователей, выразивших благодарность',
    type: [Object]
  })
  @Prop({ type: [{ username: String, date: String }] })
  thanks: { username: string; date: string }[];
}

export const TopicsSchema = SchemaFactory.createForClass(TopicSchema);
