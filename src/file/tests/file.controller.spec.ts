import { Test, TestingModule } from '@nestjs/testing';
import { FileController } from '../file.controller';
import { FileService } from '../file.service';
import { BadRequestException } from '@nestjs/common';

describe('FileController', () => {
  let controller: FileController;
  let fileService: FileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileController],
      providers: [
        {
          provide: FileService,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue({
              message: 'Archivo subido y guardado',
              fileUrl: 'https://s3-bucket-url.com/file.pdf',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<FileController>(FileController);
    fileService = module.get<FileService>(FileService);
  });

  it('should throw BadRequestException if no file is uploaded', async () => {
    await expect(controller.uploadFile(null as any, 'ABC123456XYZ'))
      .rejects.toThrow(BadRequestException);
  });

  it('should call fileService.uploadFile when a file is uploaded', async () => {
    const mockFile = {
      originalname: 'test.pdf',
      buffer: Buffer.from(''),
      mimetype: 'application/pdf',
    } as Express.Multer.File;

    const mockRFC = 'ABC123456XYZ';

    await expect(controller.uploadFile(mockFile, mockRFC)).resolves.toEqual({
      message: 'Archivo subido y guardado',
      fileUrl: 'https://s3-bucket-url.com/file.pdf',
    });

    expect(fileService.uploadFile).toHaveBeenCalledWith(mockFile, mockRFC);
  });
});
