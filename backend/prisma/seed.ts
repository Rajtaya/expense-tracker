import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default categories with emoji icons + colors (matches the spec).
const CATEGORIES = [
  { name: 'Food', icon: '🍔', color: '#F97316' },
  { name: 'Fuel', icon: '🚗', color: '#EF4444' },
  { name: 'Rent', icon: '🏠', color: '#8B5CF6' },
  { name: 'Electricity', icon: '💡', color: '#F59E0B' },
  { name: 'Mobile Recharge', icon: '📱', color: '#06B6D4' },
  { name: 'Internet', icon: '🌐', color: '#3B82F6' },
  { name: 'Grocery', icon: '🛒', color: '#22C55E' },
  { name: 'Entertainment', icon: '🎬', color: '#EC4899' },
  { name: 'Medical', icon: '🏥', color: '#14B8A6' },
  { name: 'Education', icon: '📚', color: '#6366F1' },
  { name: 'Shopping', icon: '👕', color: '#D946EF' },
  { name: 'Travel', icon: '✈️', color: '#0EA5E9' },
  { name: 'Gift', icon: '🎁', color: '#F43F5E' },
  { name: 'Others', icon: '📦', color: '#64748B' },
];

async function main() {
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: { icon: c.icon, color: c.color },
      create: c,
    });
  }
  console.log(`Seeded ${CATEGORIES.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
