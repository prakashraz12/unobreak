import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  type UploadApiOptions,
  type UploadApiResponse,
} from 'cloudinary';
import type { Env } from '../../config/env.validation.js';

@Injectable()
export class CloudinaryService {
  constructor(private readonly config: ConfigService<Env, true>) {
    const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME');
    if (cloudName) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: this.config.get('CLOUDINARY_API_KEY'),
        api_secret: this.config.get('CLOUDINARY_API_SECRET'),
      });
    } else {
      // Falls back to parsing CLOUDINARY_URL from the environment.
      cloudinary.config();
    }
  }

  private ensureConfigured() {
    if (!cloudinary.config().cloud_name) {
      throw new InternalServerErrorException(
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
      );
    }
  }

  uploadBuffer(
    buffer: Buffer,
    options: UploadApiOptions = {},
  ): Promise<UploadApiResponse> {
    this.ensureConfigured();
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error || !result) {
            return reject(
              error ??
                new InternalServerErrorException('Cloudinary upload failed'),
            );
          }
          resolve(result);
        },
      );
      stream.end(buffer);
    });
  }

  async destroy(publicId: string): Promise<void> {
    this.ensureConfigured();
    await cloudinary.uploader.destroy(publicId);
  }
}
