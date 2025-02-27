import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Client, ClientSchema } from '../clients/schemas/client.schema';
import { File, FileSchema } from '../file/schemas/file.schema';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: File.name, schema: FileSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
