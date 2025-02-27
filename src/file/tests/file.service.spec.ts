import { Test, TestingModule } from '@nestjs/testing';
import { FileService } from '../file.service';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '../../config/config.service';

describe('FileService', () => {
  let service: FileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        {
          provide: ConfigService,
          useValue: {
            awsAccessKeyId: 'test',
            awsSecretAccessKey: 'test',
            awsRegion: 'test',
            awsBucketName: 'test',
          },
        },
        {
          provide: getModelToken('File'),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<FileService>(FileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
