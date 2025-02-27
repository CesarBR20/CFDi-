import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('ping')
  getPing() {
    return { message: 'pong' };
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
