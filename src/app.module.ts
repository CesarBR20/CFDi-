import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { FileModule } from './file/file.module';
import { AdminModule } from './admin/admin.module';
import { CfdiModule } from './cfdi/cfdi.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI || ''),
    AuthModule,
    FileModule,
    AdminModule,
    CfdiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
