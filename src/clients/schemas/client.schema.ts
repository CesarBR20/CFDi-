import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Client {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false }) 
  acceptedTerms: boolean;

  @Prop({ type: [String], default: [] }) 
  rfcList: string[];
}

export type ClientDocument = Client & Document; // 🔹 Ahora exportamos `ClientDocument`
export const ClientSchema = SchemaFactory.createForClass(Client);
