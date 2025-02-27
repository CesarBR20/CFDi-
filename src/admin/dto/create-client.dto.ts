import { IsString, IsNotEmpty } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  readonly username: string; // 🔹 Asegúrate de que este campo exista

  @IsString()
  @IsNotEmpty()
  readonly password: string;
}
  