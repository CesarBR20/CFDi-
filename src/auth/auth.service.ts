import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Client, ClientDocument } from '../clients/schemas/client.schema';
import { RegisterDto, LoginDto, RegisterClientDto, ClientLoginDto } from './dto/auth.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Client.name) private readonly clientModel: Model<ClientDocument>,
  ) {}

  /**
   * 📌 REGISTRAR ADMIN
   */
  async register(registerDto: RegisterDto) {
    // 🔹 Verificar si el usuario ya existe
    const existingUser = await this.userModel.findOne({ username: registerDto.username }).exec();
    if (existingUser) {
      throw new BadRequestException('Este usuario ya está registrado');
    }

    // 🔹 Encriptar la contraseña correctamente antes de guardarla
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // 🔹 Guardar usuario con la contraseña encriptada
    const user = new this.userModel({
      username: registerDto.username,
      password: hashedPassword, // 🔹 Contraseña encriptada
      role: 'admin',
    });

    await user.save();
    return { message: 'Administrador registrado correctamente' };
  }

  /**
   * 📌 INICIO DE SESIÓN ADMIN
   */
  async login(loginDto: LoginDto) {
    const user = await this.userModel.findOne({ username: loginDto.username }).lean().exec();

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    console.log('Usuario encontrado:', user);

    // 🔹 Verificar si la contraseña es válida
    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    console.log('¿Contraseña válida?', isMatch);

    if (!isMatch) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload: JwtPayload = { 
      username: user.username, 
      sub: user._id.toString(), // 🔹 Convertimos `_id` a string 
      role: 'admin' 
    };

    return { access_token: this.jwtService.sign(payload) };
  }

  /**
   * 📌 REGISTRAR CLIENTE
   */
  async registerClient(registerClientDto: RegisterClientDto) {
    // 🔹 Verificar si el cliente ya existe
    const existingClient = await this.userModel.findOne({ username: registerClientDto.username }).exec();
    if (existingClient) {
      throw new BadRequestException('Este usuario ya está registrado');
    }

    // 🔹 Encriptar la contraseña correctamente
    const hashedPassword = await bcrypt.hash(registerClientDto.password, 10);

    // 🔹 Crear el cliente
    const client = new this.userModel({
      username: registerClientDto.username, // Ahora usamos `username`
      password: hashedPassword,
      role: 'client',
    });

    await client.save();
    return { message: 'Cliente registrado correctamente' };
  }

  /**
   * 📌 INICIO DE SESIÓN CLIENTE
   */
  async clientLogin(clientLoginDto: ClientLoginDto) {
    console.log('📌 Datos recibidos en el login:', clientLoginDto);

    // 🔹 Buscar el cliente en la colección `clients`, no en `users`
    const client = await this.clientModel.findOne({
        username: clientLoginDto.username, // Ahora buscamos en `clientModel`
    }).lean().exec();

    if (!client) {
        console.log('❌ Usuario no encontrado en la base de datos');
        throw new UnauthorizedException('Usuario no encontrado');
    }

    console.log('✅ Usuario encontrado:', client);

    // 🔹 Verificar si la contraseña es correcta
    const isMatch = await bcrypt.compare(clientLoginDto.password, client.password);
    console.log('✅ ¿Contraseña válida?', isMatch);

    if (!isMatch) {
        throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload: JwtPayload = { 
        username: client.username, 
        sub: client._id.toString(), 
        role: 'client' 
    };

    return { access_token: this.jwtService.sign(payload) };
  }

}
