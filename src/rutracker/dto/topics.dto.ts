import { ApiProperty } from '@nestjs/swagger';

export class TopicsDto {
  @ApiProperty({
    example: 'https://rutracker.org/forum/viewforum.php?f=123',
    description: 'URL подкатегории'
  })
  url: string;

  @ApiProperty({ example: 'username', description: 'Логин от Rutracker' })
  username: string;

  @ApiProperty({ example: 'password', description: 'Пароль от Rutracker' })
  password: string;
}