import { Controller, Post, Body, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RegisterClientDto, ClientLoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 📌 REGISTRAR ADMIN
   * Solo se usa para agregar nuevos administradores.
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * 📌 INICIO DE SESIÓN ADMIN
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * 📌 REGISTRAR CLIENTE
   * Los clientes se registran con su RFC, nombre y contraseña.
   */
  @Post('register/client')
  async registerClient(@Body() registerClientDto: RegisterClientDto) {
    return this.authService.registerClient(registerClientDto);
  }

  /**
   * 📌 INICIO DE SESIÓN CLIENTE
   */
  @Post('client/login')
  async clientLogin(@Body() clientLoginDto: ClientLoginDto) {
    return this.authService.clientLogin(clientLoginDto);
  }
}
