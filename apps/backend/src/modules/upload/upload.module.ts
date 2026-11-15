import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service.js';
import { UploadController } from './upload.controller.js';

@Module({
  providers: [CloudinaryService],
  controllers: [UploadController],
  exports: [CloudinaryService],
})
export class UploadModule {}
