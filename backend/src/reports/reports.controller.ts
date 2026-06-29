import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get('summary')
  summary(@CurrentUser() user: AuthUser) {
    return this.reports.summary(user.id);
  }

  @Get('by-category')
  byCategory(@CurrentUser() user: AuthUser, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reports.byCategory(user.id, from, to);
  }

  @Get('trend')
  trend(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupBy') groupBy?: 'day' | 'month',
  ) {
    return this.reports.trend(user.id, from, to, groupBy ?? 'month');
  }
}
