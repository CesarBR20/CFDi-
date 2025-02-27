import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true }) 
export class File extends Document {
  @Prop({ required: true })
  rfc: string;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  s3Url: string;

  @Prop({ required: true })
  s3Key: string;

  @Prop({ required: true, unique: true })
  fileHash: string; 
}

export const FileSchema = SchemaFactory.createForClass(File);
