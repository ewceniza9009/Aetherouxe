import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export interface UploadFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get('S3_BUCKET', 'elite-realty');
    this.s3 = new S3Client({
      endpoint: this.config.get('S3_ENDPOINT', 'http://localhost:9000'),
      region: this.config.get('S3_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.config.get('S3_ACCESS_KEY', 'minioadmin'),
        secretAccessKey: this.config.get('S3_SECRET_KEY', 'minioadmin'),
      },
      forcePathStyle: true,
    });
    this.logger.log(`S3 service initialized — bucket: ${this.bucket}`);
  }

  async upload(file: UploadFile, folder: string): Promise<{ key: string; url: string }> {
    const ext = file.originalname.split('.').pop() || 'bin';
    const key = `${folder}/${randomUUID()}.${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: { originalName: file.originalname },
      }),
    );

    const url = `${this.config.get('S3_ENDPOINT', 'http://localhost:9000')}/${this.bucket}/${key}`;
    this.logger.log(`Uploaded: ${key}`);
    return { key, url };
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    this.logger.log(`Deleted: ${key}`);
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn });
  }
}
