import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class FileUpload extends Document {
  @Prop({ required: true })
  clientUsername: string;

  @Prop({ required: true })
  uploadDate: Date;

  @Prop({ required: true })
  uploadFolder: string;

  @Prop({ type: [String], default: [] })
  rfcList: string[];

  @Prop({ type: [{ filename: String, s3Url: String }] })
  zipFiles: { filename: string; s3Url: string }[];  
}

export const FileUploadSchema = SchemaFactory.createForClass(FileUpload);
