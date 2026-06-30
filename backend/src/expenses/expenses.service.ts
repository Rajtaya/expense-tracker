import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

const includeCategory = { category: true } satisfies Prisma.ExpenseInclude;

// Decimal -> number so the JSON API returns plain numbers.
function serialize<T extends { amount: Prisma.Decimal }>(e: T) {
  return { ...e, amount: Number(e.amount) };
}

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateExpenseDto) {
    const e = await this.prisma.expense.create({
      data: {
        userId,
        amount: dto.amount,
        type: dto.type ?? 'EXPENSE',
        person: dto.person ?? null,
        categoryId: dto.categoryId ?? null,
        description: dto.description ?? null,
        paymentMethod: dto.paymentMethod ?? 'CASH',
        expenseDate: new Date(dto.expenseDate),
        receiptImage: dto.receiptImage ?? null,
      },
      include: includeCategory,
    });
    return serialize(e);
  }

  async findAll(userId: string, q: QueryExpenseDto) {
    const where: Prisma.ExpenseWhereInput = { userId };
    if (q.type) where.type = q.type;
    if (q.from || q.to) {
      where.expenseDate = {
        ...(q.from ? { gte: new Date(q.from) } : {}),
        ...(q.to ? { lte: new Date(q.to) } : {}),
      };
    }
    if (q.categoryId) where.categoryId = q.categoryId;
    if (q.paymentMethod) where.paymentMethod = q.paymentMethod;
    if (q.search) where.description = { contains: q.search, mode: 'insensitive' };

    const page = q.page ?? 1;
    const limit = q.limit ?? 50;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        include: includeCategory,
        orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.expense.count({ where }),
    ]);
    return { data: rows.map(serialize), total, page, limit };
  }

  async findOne(userId: string, id: string) {
    const e = await this.prisma.expense.findFirst({ where: { id, userId }, include: includeCategory });
    if (!e) throw new NotFoundException('Expense not found');
    return serialize(e);
  }

  async update(userId: string, id: string, dto: UpdateExpenseDto) {
    await this.findOne(userId, id);
    const e = await this.prisma.expense.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.person !== undefined ? { person: dto.person } : {}),
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.paymentMethod !== undefined ? { paymentMethod: dto.paymentMethod } : {}),
        ...(dto.expenseDate !== undefined ? { expenseDate: new Date(dto.expenseDate) } : {}),
        ...(dto.receiptImage !== undefined ? { receiptImage: dto.receiptImage } : {}),
      },
      include: includeCategory,
    });
    return serialize(e);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.expense.delete({ where: { id } });
    return { success: true };
  }
}
