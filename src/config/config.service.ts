import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService) {}

  get mongoUri(): string {
    return this.configService.get<string>('MONGO_URI') ?? 'mongodb://localhost:27017/defaultDb';
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET') ?? 'default-secret-key';
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN') ?? '1h'; 
  }

  get awsBucketName(): string {
    return this.configService.get<string>('AWS_BUCKET_NAME') ?? 'default-bucket-name';
  }

  get awsRegion(): string {
    return this.configService.get<string>('AWS_REGION') ?? 'us-east-1';
  }

  get awsAccessKeyId(): string {
    return this.configService.get<string>('AWS_ACCESS_KEY_ID') ?? 'default-access-key';
  }

  get awsSecretAccessKey(): string {
    return this.configService.get<string>('AWS_SECRET_ACCESS_KEY') ?? 'default-secret-key';
  }
}
