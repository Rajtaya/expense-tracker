import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CategoryTotal {
  categoryId: string | null;
  name: string;
  icon: string;
  color: string;
  total: number;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private async breakdown(userId: string, where: Prisma.ExpenseWhereInput): Promise<CategoryTotal[]> {
    const grouped = await this.prisma.expense.groupBy({
      by: ['categoryId'],
      _sum: { amount: true },
      where: { ...where, userId },
    });
    const cats = await this.prisma.category.findMany();
    return grouped
      .map((g): CategoryTotal => {
        const c = cats.find((x) => x.id === g.categoryId);
        return {
          categoryId: g.categoryId,
          name: c?.name ?? 'Uncategorized',
          icon: c?.icon ?? '📦',
          color: c?.color ?? '#64748B',
          total: Number(g._sum.amount ?? 0),
        };
      })
      .sort((a, b) => b.total - a.total);
  }

  async summary(userId: string) {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startYear = new Date(now.getFullYear(), 0, 1);

    const sumSince = async (gte: Date) => {
      const r = await this.prisma.expense.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { userId, expenseDate: { gte } },
      });
      return { total: Number(r._sum.amount ?? 0), count: r._count };
    };

    const [today, month, year, byCategory] = await Promise.all([
      sumSince(startToday),
      sumSince(startMonth),
      sumSince(startYear),
      this.breakdown(userId, { expenseDate: { gte: startMonth } }),
    ]);

    return {
      today: today.total,
      thisMonth: month.total,
      thisYear: year.total,
      monthCount: month.count,
      byCategory,
    };
  }

  byCategory(userId: string, from?: string, to?: string) {
    const where: Prisma.ExpenseWhereInput = {};
    if (from || to) {
      where.expenseDate = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }
    return this.breakdown(userId, where);
  }

  async trend(userId: string, from?: string, to?: string, groupBy: 'day' | 'month' = 'month') {
    const trunc = groupBy === 'day' ? 'day' : 'month';
    const fmt = groupBy === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM';
    const conditions: Prisma.Sql[] = [Prisma.sql`"userId" = ${userId}`];
    if (from) conditions.push(Prisma.sql`"expenseDate" >= ${new Date(from)}`);
    if (to) conditions.push(Prisma.sql`"expenseDate" <= ${new Date(to)}`);
    const whereSql = Prisma.join(conditions, ' AND ');

    const rows = await this.prisma.$queryRaw<{ period: string; total: number }[]>(Prisma.sql`
      SELECT to_char(date_trunc(${trunc}, "expenseDate"), ${fmt}) AS period,
             SUM(amount)::float AS total
      FROM "Expense"
      WHERE ${whereSql}
      GROUP BY 1
      ORDER BY 1
    `);
    return rows;
  }
}
