import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator.ts';

@Controller()
export class HealthController {
  @Public()
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
