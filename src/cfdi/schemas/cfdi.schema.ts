import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true }) // 📌 Agregamos timestamps para mejor control
export class CFDI extends Document {

  @Prop({ required: true })
  clientUsername: string;

  @Prop({ required: true })
  emisorRfc: string;

  @Prop({ required: true })
  emisorNombre: string;

  @Prop({ required: true })
  receptorRfc: string;

  @Prop({ required: true })
  receptorNombre: string;

  @Prop({ required: true })
  claveProdServ: string;

  @Prop({ required: true })
  periodo: string; 

  @Prop({ required: true })
  moneda: string;

  @Prop({ required: true })
  total: number;

  @Prop({ required: true })
  tipoCambio: number;

  @Prop({ required: true })
  totalMXN: number;

  @Prop({ required: true })
  uploadDate: Date;

  @Prop({ required: true })
  rfcList: string[];
  
}

export const CFDISchema = SchemaFactory.createForClass(CFDI);
