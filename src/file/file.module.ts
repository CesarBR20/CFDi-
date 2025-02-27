import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { FileSchema } from './schemas/file.schema';
import { ConfigModule } from '../config/config.module';
import { Client, ClientSchema } from '../clients/schemas/client.schema';
import { ClientModule } from '../clients/clients.module';
import { FileUpload, FileUploadSchema } from './schemas/file-upload.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'File', schema: FileSchema },
      { name: Client.name, schema: ClientSchema },
      { name: 'FileUpload', schema: FileUploadSchema },
    ]),
    ConfigModule,
    ClientModule,
  ],
  providers: [FileService],
  controllers: [FileController],
  exports: [FileService],
})
export class FileModule {}
