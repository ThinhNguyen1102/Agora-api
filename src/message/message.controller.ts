import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetUserRequest } from 'src/auth/decorators'
import { UserDocument } from 'src/user/schemas/user.schema'
import { NewMessageDto } from './dto/new-message.dto'
import { MessageService } from './message.service'
import { FilesInterceptor } from '@nestjs/platform-express'
import { filterImageConfig, storageConfig } from 'src/configs/upload-file.config'
import { CloudinaryService, ImageType } from 'src/cloudinary/cloudinary.service'
import { CloudinaryResponse } from 'src/cloudinary/cloudinary-response'

@ApiTags('Message')
@Controller('messages')
export class MessageController {
  constructor(
    private cloudinaryService: CloudinaryService,
    private messageService: MessageService
  ) {}

  @Post()
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FilesInterceptor('chats', 5, {
      storage: storageConfig('chats'),
      fileFilter: filterImageConfig(1024 * 1024 * 20)
    })
  )
  async newMessage(
    @Req() req: any,
    @GetUserRequest() user: UserDocument,
    @Body() newMessageDto: NewMessageDto,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    if (req.fileValidationError) {
      throw new BadRequestException(req.fileValidationError)
    }

    let newMessage

    if (files) {
      const uploadFilePromises = files.map(file => {
        return this.cloudinaryService.uploadFile(file, ImageType.CHAT)
      })

      const cloudImages = await Promise.all(uploadFilePromises)
      const imageUrls = cloudImages.map((image: CloudinaryResponse) => image.secure_url)

      newMessage = await this.messageService.createMessage(user._id, newMessageDto, imageUrls)
    } else {
      newMessage = await this.messageService.createMessage(user._id, newMessageDto)
    }

    return {
      success: true,
      message: 'Message sent successfully',
      metadata: newMessage
    }
  }

  @Post('typing')
  async typingMessage(
    @GetUserRequest() user: UserDocument,
    @Body() { conversationId }: { conversationId: string }
  ) {
    await this.messageService.typingMessage(user._id, conversationId)
    return {
      success: true,
      message: 'Typingggg'
    }
  }

  @Get(':conversationId')
  async getMessages(
    @GetUserRequest() user: UserDocument,
    @Param('conversationId') conversationId: string
  ) {
    const messages = await this.messageService.getMessages(user._id, conversationId)
    return {
      success: true,
      message: 'Messages fetched successfully',
      metadata: messages
    }
  }
}