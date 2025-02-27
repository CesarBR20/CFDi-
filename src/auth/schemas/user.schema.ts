import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  username: string; // 🔹 Ahora usamos `username` en lugar de `name`

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: ['admin', 'client'] })
  role: string;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
