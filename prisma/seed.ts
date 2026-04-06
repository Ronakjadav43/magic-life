// Seed script for Magic Life database
// Run: npx tsx prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --- Seed Users ---
  const adminPw = await bcrypt.hash('admin123', 10);
  const managerPw = await bcrypt.hash('manager123', 10);
  const staffPw = await bcrypt.hash('staff123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@magiclife.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@magiclife.com',
      password: adminPw,
      role: 'Admin',
      initials: 'AU',
      color: '#f43f5e',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@magiclife.com' },
    update: {},
    create: {
      name: 'Project Manager',
      email: 'manager@magiclife.com',
      password: managerPw,
      role: 'Manager',
      initials: 'PM',
      color: '#f97316',
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@magiclife.com' },
    update: {},
    create: {
      name: 'Dev Staff',
      email: 'staff@magiclife.com',
      password: staffPw,
      role: 'Staff',
      initials: 'DS',
      color: '#3b82f6',
    },
  });

  console.log('✅ Users seeded:', admin.name, manager.name, staffUser.name);

  // --- Seed Projects ---
  const project1 = await prisma.project.upsert({
    where: { id: 'proj-001' },
    update: {},
    create: {
      id: 'proj-001',
      name: 'E-Commerce Platform',
      clientName: 'TechCorp India',
      startDate: '2026-03-01',
      deadline: '2026-06-30',
      status: 'Active',
      progress: 45,
      revenue: 250000,
      teamIds: [admin.id, manager.id, staffUser.id],
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: 'proj-002' },
    update: {},
    create: {
      id: 'proj-002',
      name: 'Mobile App Redesign',
      clientName: 'HealthPlus',
      startDate: '2026-02-15',
      deadline: '2026-05-15',
      status: 'Active',
      progress: 70,
      revenue: 180000,
      teamIds: [manager.id, staffUser.id],
    },
  });

  await prisma.project.upsert({
    where: { id: 'proj-003' },
    update: {},
    create: {
      id: 'proj-003',
      name: 'Landing Page',
      clientName: 'StartupXYZ',
      startDate: '2026-01-10',
      deadline: '2026-02-10',
      status: 'Completed',
      progress: 100,
      revenue: 50000,
    },
  });

  console.log('✅ Projects seeded');

  // --- Seed Tasks ---
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const overdue = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);

  await prisma.task.createMany({
    skipDuplicates: true,
    data: [
      { title: 'Setup CI/CD Pipeline', description: 'Configure GitHub Actions for auto-deploy', priority: 'High', dueDate: nextWeek, projectId: project1.id, status: 'in_progress', assigneeId: staffUser.id },
      { title: 'Design System Components', description: 'Create reusable UI components library', priority: 'Medium', dueDate: nextWeek, projectId: project1.id, status: 'todo', assigneeId: staffUser.id },
      { title: 'API Integration', description: 'Connect frontend to backend REST API', priority: 'Urgent', dueDate: overdue, projectId: project1.id, status: 'todo', assigneeId: staffUser.id },
      { title: 'Code Review Sprint 2', description: 'Review all PRs from last sprint', priority: 'Medium', dueDate: today, projectId: project2.id, status: 'in_progress', assigneeId: manager.id },
      { title: 'Database Migration', description: 'Migrate from MongoDB to PostgreSQL', priority: 'High', dueDate: nextWeek, projectId: project1.id, status: 'done', assigneeId: staffUser.id },
      { title: 'User Testing Feedback', description: 'Collect and organize user feedback from beta testing', priority: 'Low', dueDate: nextWeek, projectId: project2.id, status: 'review', assigneeId: manager.id },
    ],
  });

  console.log('✅ Tasks seeded');

  // --- Seed Daily Entries ---
  await prisma.dailyEntry.createMany({
    skipDuplicates: true,
    data: [
      { date: today, taskName: 'Feature Development', category: 'Freelance', projectId: project1.id, timeSpent: 4, status: 'Done', notes: 'Implemented auth module', assigneeId: staffUser.id },
      { date: today, taskName: 'Code Review', category: 'Freelance', projectId: project2.id, timeSpent: 2, status: 'Done', notes: 'Reviewed 3 PRs', assigneeId: manager.id },
      { date: today, taskName: 'Morning Run', category: 'Health', timeSpent: 1, status: 'Done', notes: '5km run' },
      { date: yesterday, taskName: 'Database Design', category: 'Freelance', projectId: project1.id, timeSpent: 3, status: 'Done', notes: 'Schema design for e-commerce' },
      { date: yesterday, taskName: 'React Tutorial', category: 'Learning', timeSpent: 2, status: 'Done', notes: 'Advanced hooks patterns' },
      { date: yesterday, taskName: 'Client Meeting', category: 'Freelance', timeSpent: 1.5, status: 'Done', notes: 'Sprint planning with TechCorp' },
    ],
  });

  console.log('✅ Daily entries seeded');

  // --- Seed Leads ---
  await prisma.lead.createMany({
    skipDuplicates: true,
    data: [
      { date: today, clientName: 'FinServ Digital', platform: 'LinkedIn', proposalSent: true, followUpDate: nextWeek, status: 'Contacted', dealValue: 120000 },
      { date: yesterday, clientName: 'EduTech Solutions', platform: 'Upwork', proposalSent: true, followUpDate: today, status: 'Replied', dealValue: 85000 },
      { date: yesterday, clientName: 'RetailMax', platform: 'Direct', proposalSent: false, status: 'New', dealValue: 200000 },
      { date: '2026-03-25', clientName: 'CloudNine Labs', platform: 'LinkedIn', proposalSent: true, status: 'Closed', dealValue: 150000 },
    ],
  });

  console.log('✅ Leads seeded');
  console.log('🎉 Database seeded successfully!');
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
