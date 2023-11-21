import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'

export class NewMessageDto {
  @ApiProperty()
  content: string

  @ApiProperty()
  @IsNotEmpty()
  conversationId: string
}