/**
 * GymSmart Database Seeder — Prisma v7
 * Run: npm run seed
 *
 * Creates default SuperAdmin user and sample data for all modules
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding GymSmart database...\n');

  // 1. Create SuperAdmin User
  const hashedPassword = await bcrypt.hash('superadmin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@gymsmart.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@gymsmart.com',
      password: hashedPassword,
      role: 'SUPERADMIN',
      phone: '+91 98765 43210',
      branch: 'Main Branch',
      isActive: true,
    },
  });
  console.log('✅ SuperAdmin created');

  // 1.5 Create Gym Admin User
  const adminHashed = await bcrypt.hash('gymadmin123', 10);
  await prisma.user.upsert({
    where: { email: 'gymadmin@gymsmart.com' },
    update: {},
    create: {
      name: 'Gym Admin',
      email: 'gymadmin@gymsmart.com',
      password: adminHashed,
      role: 'ADMIN',
      phone: '+91 88888 77777',
      branch: 'Main Branch',
      isActive: true,
    },
  });
  console.log('✅ Gym Admin created');

  // 2. Plans
  const plans = [
    { id: 1, name: 'Basic', tier: 'BASIC' as const, price1Month: 1200, price3Month: 3000, price6Month: 5500, price12Month: 10000, features: ['Gym Access', 'Locker'] },
    { id: 2, name: 'Gold', tier: 'GOLD' as const, price1Month: 1800, price3Month: 4500, price6Month: 8000, price12Month: 15000, features: ['Gym Access', 'Group Classes'] },
    { id: 3, name: 'Premium', tier: 'PREMIUM' as const, price1Month: 2500, price3Month: 6500, price6Month: 12000, price12Month: 22000, features: ['24/7 Access', 'PT'] },
  ];
  for (const p of plans) {
    await prisma.plan.upsert({ where: { id: p.id }, update: p, create: p });
  }
  console.log('✅ Plans created');

  // 3. Staff
  const staff = [
    { email: 'trainer@gymsmart.com', name: 'Rajesh Kumar', phone: '+91 91234 56789', role: 'Head Trainer', salary: 35000, branch: 'Main Branch', gender: 'MALE' as const, joinDate: new Date('2025-01-01') },
    { email: 'reception@gymsmart.com', name: 'Priya Desai', phone: '+91 92345 67890', role: 'Receptionist', salary: 22000, branch: 'Main Branch', gender: 'FEMALE' as const, joinDate: new Date('2025-03-01') },
    { email: 'trainer2@gymsmart.com', name: 'Amit Verma', phone: '+91 93456 78901', role: 'Trainer', salary: 28000, branch: 'Branch 2', gender: 'MALE' as const, joinDate: new Date('2025-06-01') },
    { email: 'manager@gymsmart.com', name: 'Sunita Rao', phone: '+91 94567 89012', role: 'Branch Manager', salary: 42000, branch: 'Branch 2', gender: 'FEMALE' as const, joinDate: new Date('2025-02-01') },
    { email: 'trainer3@gymsmart.com', name: 'Vikram Singh', phone: '+91 95678 90123', role: 'Yoga Instructor', salary: 25000, branch: 'Branch 3', gender: 'MALE' as const, joinDate: new Date('2026-01-01') },
  ];
  for (const s of staff) {
    await prisma.staff.upsert({ where: { email: s.email }, update: s, create: s });
  }
  console.log('✅ Staff created');

  // 4. Members
  const members = [
    { email: 'rahul@gmail.com', name: 'Rahul Sharma', phone: '+91 98765 43210', gender: 'MALE' as const, address: 'Andheri', branch: 'Main Branch', planId: 3, billingCycle: 'ONE_MONTH' as any, joinDate: new Date('2026-01-15'), expiryDate: new Date('2026-02-15'), paidAmount: 2500, pendingAmount: 0, status: 'ACTIVE' as any },
    { email: 'priya@gmail.com', name: 'Priya Patel', phone: '+91 87654 32109', gender: 'FEMALE' as const, address: 'Borivali', branch: 'Branch 2', planId: 1, billingCycle: 'THREE_MONTHS' as any, joinDate: new Date('2026-02-10'), expiryDate: new Date('2026-05-10'), paidAmount: 3000, pendingAmount: 0, status: 'ACTIVE' as any },
    { email: 'amit@gmail.com', name: 'Amit Kumar', phone: '+91 76543 21098', gender: 'MALE' as const, address: 'Powai', branch: 'Main Branch', planId: 2, billingCycle: 'ONE_MONTH' as any, joinDate: new Date('2026-03-08'), expiryDate: new Date('2026-04-08'), paidAmount: 900, pendingAmount: 900, status: 'PENDING' as any },
    { email: 'sneha@gmail.com', name: 'Sneha Mehta', phone: '+91 65432 10987', gender: 'FEMALE' as const, address: 'Dadar', branch: 'Branch 3', planId: 3, billingCycle: 'SIX_MONTHS' as any, joinDate: new Date('2026-01-05'), expiryDate: new Date('2026-07-05'), paidAmount: 12000, pendingAmount: 0, status: 'ACTIVE' as any },
    { email: 'vijay@gmail.com', name: 'Vijay Singh', phone: '+91 54321 09876', gender: 'MALE' as const, address: 'Thane', branch: 'Main Branch', planId: 1, billingCycle: 'ONE_MONTH' as any, joinDate: new Date('2025-05-01'), expiryDate: new Date('2025-06-01'), paidAmount: 1200, pendingAmount: 1200, status: 'EXPIRED' as any },
    { email: 'anita@gmail.com', name: 'Anita Gupta', phone: '+91 43210 98765', gender: 'FEMALE' as const, address: 'Bandra', branch: 'Branch 2', planId: 2, billingCycle: 'TWELVE_MONTHS' as any, joinDate: new Date('2026-06-20'), expiryDate: new Date('2027-06-20'), paidAmount: 15000, pendingAmount: 0, status: 'ACTIVE' as any },
  ];
  for (const m of members) {
    const mem = await prisma.member.upsert({ where: { email: m.email }, update: m, create: m });
    // create payment record if not exists
    const pCount = await prisma.payment.count({ where: { memberId: mem.id } });
    if(pCount === 0 && m.paidAmount > 0) {
      await prisma.payment.create({
        data: {
          memberId: mem.id, amount: m.paidAmount, method: 'UPI', status: 'PAID', invoiceNo: 'INV-' + mem.id, paidAt: m.joinDate
        }
      });
    }
  }
  console.log('✅ Members & Payments created');

  // 5. Products
  const products = [
    { name: 'Whey Protein', category: 'Supplements', price: 2500, stock: 50 },
    { name: 'Creatine Monohydrate', category: 'Supplements', price: 800, stock: 30 },
    { name: 'Gym Gloves', category: 'Accessories', price: 450, stock: 100 },
    { name: 'Resistance Bands', category: 'Accessories', price: 600, stock: 75 },
    { name: 'GymSmart T-Shirt', category: 'Merchandise', price: 599, stock: 200 },
    { name: 'Shaker Bottle', category: 'Accessories', price: 299, stock: 150 },
    { name: 'Pre-Workout', category: 'Supplements', price: 1800, stock: 25 },
    { name: 'Yoga Mat', category: 'Equipment', price: 1200, stock: 40 },
  ];
  for (const p of products) {
    const count = await prisma.product.count({ where: { name: p.name } });
    if (count === 0) await prisma.product.create({ data: p });
  }
  console.log('✅ Products created');

  // 6. Workouts
  const workouts = [
    { name: 'Bench Press', category: 'Chest', muscleGroup: ['Chest', 'Triceps'], sets: 4, reps: '8-12', difficulty: 'INTERMEDIATE' },
    { name: 'Deadlift', category: 'Back', muscleGroup: ['Back', 'Hamstrings'], sets: 4, reps: '5-8', difficulty: 'ADVANCED' },
    { name: 'Squats', category: 'Legs', muscleGroup: ['Quads', 'Glutes'], sets: 4, reps: '10-15', difficulty: 'INTERMEDIATE' },
    { name: 'Pull-ups', category: 'Back', muscleGroup: ['Lats', 'Biceps'], sets: 3, reps: '8-12', difficulty: 'INTERMEDIATE' },
    { name: 'Treadmill Run', category: 'Cardio', muscleGroup: ['Full Body'], duration: '30 min', difficulty: 'BEGINNER' },
    { name: 'Plank', category: 'Core', muscleGroup: ['Core'], duration: '60 sec', difficulty: 'BEGINNER' },
  ];
  for (const w of workouts) {
    const count = await prisma.workout.count({ where: { name: w.name } });
    if (count === 0) await prisma.workout.create({ data: w });
  }
  console.log('✅ Workouts created');

  // 7. Diet Plans
  const diets = [
    { name: 'Weight Loss', goal: 'Weight Loss', calories: 1800, protein: 150, carbs: 150, fats: 60, meals: ['Oats + Eggs', 'Chicken Salad', 'Protein Shake'] },
    { name: 'Muscle Gain', goal: 'Muscle Gain', calories: 3000, protein: 200, carbs: 350, fats: 80, meals: ['Eggs + Toast', 'Rice + Chicken', 'Protein Shake'] },
  ];
  for (const d of diets) {
    const count = await prisma.dietPlan.count({ where: { name: d.name } });
    if (count === 0) await prisma.dietPlan.create({ data: d });
  }
  console.log('✅ Diet Plans created');

  // 8. Inquiries
  const inquiries = [
    { name: 'Ravi Tiwari',     phone: '+91 99887 76655', email: 'ravi@gmail.com',    interest: 'Premium',  status: 'NEW' as any,       source: 'Walk-in'  },
    { name: 'Meena Joshi',     phone: '+91 88776 65544', interest: 'Gold',            status: 'FOLLOW_UP' as any, source: 'Call'     },
    { name: 'Karan Malhotra',  phone: '+91 77665 54433', interest: 'PT',              status: 'CONVERTED' as any, source: 'Referral' },
    { name: 'Pooja Shah',      phone: '+91 66554 43322', interest: 'Basic',           status: 'NEW' as any,       source: 'Website'  },
    { name: 'Arjun Nair',      phone: '+91 91122 33445', interest: 'Premium',         status: 'FOLLOW_UP' as any, source: 'Instagram'},
    { name: 'Divya Menon',     phone: '+91 92233 44556', interest: 'Gold',            status: 'NEW' as any,       source: 'Facebook' },
    { name: 'Suresh Pillai',   phone: '+91 93344 55667', interest: 'Basic',           status: 'LOST' as any,      source: 'Walk-in'  },
    { name: 'Kavita Joshi',    phone: '+91 94455 66778', interest: 'Personal Training',status: 'CONVERTED' as any,source: 'Referral' },
    { name: 'Nikhil Bose',     phone: '+91 95566 77889', interest: 'Premium',         status: 'NEW' as any,       source: 'WhatsApp' },
    { name: 'Rekha Sharma',    phone: '+91 96677 88990', interest: 'Gold',            status: 'FOLLOW_UP' as any, source: 'Call'     },
    { name: 'Tarun Kapoor',    phone: '+91 97788 99001', interest: 'Basic',           status: 'NEW' as any,       source: 'Website'  },
    { name: 'Simran Kaur',     phone: '+91 98899 00112', interest: 'Premium',         status: 'CONVERTED' as any, source: 'Instagram'},
    { name: 'Deepak Yadav',    phone: '+91 99900 11223', interest: 'Gold',            status: 'LOST' as any,      source: 'Walk-in'  },
    { name: 'Anjali Singh',    phone: '+91 90011 22334', interest: 'Basic',           status: 'NEW' as any,       source: 'Facebook' },
    { name: 'Mohit Saxena',    phone: '+91 91122 44556', interest: 'Personal Training',status: 'FOLLOW_UP' as any,source: 'Referral' },
    { name: 'Preethi Nair',    phone: '+91 92233 55667', interest: 'Premium',         status: 'NEW' as any,       source: 'WhatsApp' },
    { name: 'Gaurav Mishra',   phone: '+91 93344 66778', interest: 'Gold',            status: 'CONVERTED' as any, source: 'Call'     },
    { name: 'Swati Pandey',    phone: '+91 94455 77889', interest: 'Basic',           status: 'NEW' as any,       source: 'Website'  },
    { name: 'Rohit Tiwari',    phone: '+91 95566 88990', interest: 'Premium',         status: 'FOLLOW_UP' as any, source: 'Instagram'},
    { name: 'Nisha Agarwal',   phone: '+91 96677 99001', interest: 'Gold',            status: 'LOST' as any,      source: 'Walk-in'  },
  ];
  for (const i of inquiries) {
    const count = await prisma.inquiry.count({ where: { phone: i.phone } });
    if (count === 0) await prisma.inquiry.create({ data: i });
  }
  console.log('✅ Inquiries created');

  // 9. Extra Members (to reach 20 total)
  const extraMembers = [
    { email: 'karan@gmail.com',   name: 'Karan Mehta',    phone: '+91 70001 00001', gender: 'MALE' as const,   address: 'Juhu',      branch: 'Main Branch', planId: 1, billingCycle: 'ONE_MONTH' as any,    joinDate: new Date('2026-04-01'), expiryDate: new Date('2026-05-01'), paidAmount: 1200,  pendingAmount: 0,    status: 'ACTIVE' as any  },
    { email: 'neha@gmail.com',    name: 'Neha Joshi',     phone: '+91 70002 00002', gender: 'FEMALE' as const, address: 'Malad',     branch: 'Branch 2',   planId: 2, billingCycle: 'THREE_MONTHS' as any, joinDate: new Date('2026-03-15'), expiryDate: new Date('2026-06-15'), paidAmount: 4500,  pendingAmount: 0,    status: 'ACTIVE' as any  },
    { email: 'suresh@gmail.com',  name: 'Suresh Nair',    phone: '+91 70003 00003', gender: 'MALE' as const,   address: 'Goregaon',  branch: 'Branch 3',   planId: 3, billingCycle: 'SIX_MONTHS' as any,   joinDate: new Date('2026-02-01'), expiryDate: new Date('2026-08-01'), paidAmount: 12000, pendingAmount: 0,    status: 'ACTIVE' as any  },
    { email: 'pooja@gmail.com',   name: 'Pooja Verma',    phone: '+91 70004 00004', gender: 'FEMALE' as const, address: 'Kandivali', branch: 'Main Branch', planId: 1, billingCycle: 'ONE_MONTH' as any,    joinDate: new Date('2026-05-01'), expiryDate: new Date('2026-06-01'), paidAmount: 0,     pendingAmount: 1200, status: 'PENDING' as any },
    { email: 'arjun@gmail.com',   name: 'Arjun Kapoor',   phone: '+91 70005 00005', gender: 'MALE' as const,   address: 'Versova',   branch: 'Branch 2',   planId: 2, billingCycle: 'ONE_MONTH' as any,    joinDate: new Date('2025-11-01'), expiryDate: new Date('2025-12-01'), paidAmount: 1800,  pendingAmount: 0,    status: 'EXPIRED' as any },
    { email: 'divya@gmail.com',   name: 'Divya Pillai',   phone: '+91 70006 00006', gender: 'FEMALE' as const, address: 'Chembur',   branch: 'Branch 3',   planId: 3, billingCycle: 'TWELVE_MONTHS' as any,joinDate: new Date('2026-01-10'), expiryDate: new Date('2027-01-10'), paidAmount: 22000, pendingAmount: 0,    status: 'ACTIVE' as any  },
    { email: 'rohit2@gmail.com',  name: 'Rohit Desai',    phone: '+91 70007 00007', gender: 'MALE' as const,   address: 'Kurla',     branch: 'Main Branch', planId: 2, billingCycle: 'THREE_MONTHS' as any, joinDate: new Date('2026-04-10'), expiryDate: new Date('2026-07-10'), paidAmount: 4500,  pendingAmount: 0,    status: 'ACTIVE' as any  },
    { email: 'meena@gmail.com',   name: 'Meena Rao',      phone: '+91 70008 00008', gender: 'FEMALE' as const, address: 'Sion',      branch: 'Branch 2',   planId: 1, billingCycle: 'SIX_MONTHS' as any,   joinDate: new Date('2026-03-01'), expiryDate: new Date('2026-09-01'), paidAmount: 5500,  pendingAmount: 0,    status: 'ACTIVE' as any  },
    { email: 'tarun@gmail.com',   name: 'Tarun Bose',     phone: '+91 70009 00009', gender: 'MALE' as const,   address: 'Mulund',    branch: 'Branch 3',   planId: 3, billingCycle: 'ONE_MONTH' as any,    joinDate: new Date('2026-05-15'), expiryDate: new Date('2026-06-15'), paidAmount: 0,     pendingAmount: 2500, status: 'PENDING' as any },
    { email: 'simran@gmail.com',  name: 'Simran Kaur',    phone: '+91 70010 00010', gender: 'FEMALE' as const, address: 'Vikhroli',  branch: 'Main Branch', planId: 2, billingCycle: 'TWELVE_MONTHS' as any,joinDate: new Date('2025-07-01'), expiryDate: new Date('2025-07-31'), paidAmount: 1800,  pendingAmount: 0,    status: 'EXPIRED' as any },
    { email: 'deepak@gmail.com',  name: 'Deepak Sharma',  phone: '+91 70011 00011', gender: 'MALE' as const,   address: 'Ghatkopar', branch: 'Branch 2',   planId: 1, billingCycle: 'THREE_MONTHS' as any, joinDate: new Date('2026-02-20'), expiryDate: new Date('2026-05-20'), paidAmount: 3000,  pendingAmount: 0,    status: 'ACTIVE' as any  },
    { email: 'anjali@gmail.com',  name: 'Anjali Tiwari',  phone: '+91 70012 00012', gender: 'FEMALE' as const, address: 'Khar',      branch: 'Branch 3',   planId: 3, billingCycle: 'SIX_MONTHS' as any,   joinDate: new Date('2026-01-20'), expiryDate: new Date('2026-07-20'), paidAmount: 12000, pendingAmount: 0,    status: 'ACTIVE' as any  },
    { email: 'mohit@gmail.com',   name: 'Mohit Gupta',    phone: '+91 70013 00013', gender: 'MALE' as const,   address: 'Santacruz', branch: 'Main Branch', planId: 2, billingCycle: 'ONE_MONTH' as any,    joinDate: new Date('2026-05-20'), expiryDate: new Date('2026-06-20'), paidAmount: 0,     pendingAmount: 1800, status: 'PENDING' as any },
    { email: 'preethi@gmail.com', name: 'Preethi Menon',  phone: '+91 70014 00014', gender: 'FEMALE' as const, address: 'Vile Parle',branch: 'Branch 2',   planId: 1, billingCycle: 'TWELVE_MONTHS' as any,joinDate: new Date('2026-03-05'), expiryDate: new Date('2027-03-05'), paidAmount: 10000, pendingAmount: 0,    status: 'ACTIVE' as any  },
  ];
  for (const m of extraMembers) {
    const existing = await prisma.member.findUnique({ where: { email: m.email } });
    if (!existing) {
      const mem = await prisma.member.create({ data: m });
      if (m.paidAmount > 0) {
        await prisma.payment.create({
          data: { memberId: mem.id, amount: m.paidAmount, method: ['UPI','Cash','Card','NetBanking'][mem.id % 4], status: 'PAID', invoiceNo: 'INV-EX-' + mem.id, paidAt: m.joinDate }
        });
      }
    }
  }
  console.log('✅ Extra Members created');

  // 10. Payrolls — exactly 20 entries (5 staff × 4 months)
  const allStaff = await prisma.staff.findMany();
  const payrollMonths = ['April 2026', 'May 2026', 'June 2026', 'July 2026'];
  for (const s of allStaff) {
    for (const month of payrollMonths) {
      const exists = await prisma.payroll.count({ where: { staffId: s.id, month } });
      if (exists === 0) {
        const isPaid = month !== 'July 2026';
        await prisma.payroll.create({
          data: {
            staffId: s.id,
            month,
            amount: s.salary,
            status: isPaid ? 'Paid' : 'Pending',
            paidAt: isPaid ? new Date() : null,
          },
        });
      }
    }
  }
  console.log('✅ Payrolls created — 20 entries (5 staff × 4 months)');

  // 11. Attendance — exactly 20 records (10 member + 10 staff), 1 per day last 10 days
  const allMembers = await prisma.member.findMany({ take: 10 });
  const today = new Date();
  const attCount = await prisma.attendance.count();
  if (attCount === 0) {
    for (let d = 0; d < 10; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      date.setHours(0, 0, 0, 0);

      // 1 member attendance per day
      const member = allMembers[d % allMembers.length];
      const mCheckIn = new Date(date); mCheckIn.setHours(6 + (d % 3));
      const mCheckOut = new Date(date); mCheckOut.setHours(mCheckIn.getHours() + 1 + (d % 2));
      await prisma.attendance.create({
        data: { memberId: member.id, date, checkIn: mCheckIn, checkOut: mCheckOut, type: 'MEMBER' },
      });

      // 1 staff attendance per day
      const staffMember = allStaff[d % allStaff.length];
      const sCheckIn = new Date(date); sCheckIn.setHours(8);
      const sCheckOut = new Date(date); sCheckOut.setHours(17);
      await prisma.attendance.create({
        data: { staffId: staffMember.id, date, checkIn: sCheckIn, checkOut: sCheckOut, type: 'STAFF' },
      });
    }
  }
  console.log('✅ Attendance created — 20 records (10 member + 10 staff)');

  // 12. Orders + Order Items — exactly 20 orders
  const allProducts = await prisma.product.findMany();
  const orderMethods = ['UPI', 'Cash', 'Card'];
  const existingOrderCount = await prisma.order.count();
  if (existingOrderCount === 0) {
    for (let i = 0; i < 20; i++) {
      const p1 = allProducts[i % allProducts.length];
      const p2 = allProducts[(i + 2) % allProducts.length];
      const qty1 = 1 + (i % 3);
      const qty2 = 1 + (i % 2);
      const total = p1.price * qty1 + p2.price * qty2;
      const orderDate = new Date(today);
      orderDate.setDate(today.getDate() - i);
      await prisma.order.create({
        data: {
          total,
          method: orderMethods[i % 3],
          status: 'Completed',
          createdAt: orderDate,
          items: {
            create: [
              { productId: p1.id, qty: qty1, price: p1.price },
              { productId: p2.id, qty: qty2, price: p2.price },
            ],
          },
        },
      });
    }
  }
  console.log('✅ Orders created — 20 orders');

  // 13. Extra Payments (for finance charts)
  const allMembersForPay = await prisma.member.findMany({ take: 10 });
  const payMethods = ['UPI', 'Cash', 'Card', 'NetBanking'];
  for (let i = 0; i < 15; i++) {
    const mem = allMembersForPay[i % allMembersForPay.length];
    const invoiceNo = `INV-EXTRA-${Date.now()}-${i}`;
    const payDate = new Date(today); payDate.setDate(today.getDate() - i * 2);
    await prisma.payment.create({
      data: { memberId: mem.id, amount: [1200,1800,2500,3000,4500][i % 5], method: payMethods[i % 4], status: 'PAID', invoiceNo, paidAt: payDate }
    });
  }
  console.log('✅ Extra Payments created');

  // 14. Extra Workouts/Exercises
  const extraWorkouts = [
    { name: 'Incline Dumbbell Press', category: 'Chest',     muscleGroup: ['Upper Chest','Triceps'],  sets: 4, reps: '10-12', difficulty: 'INTERMEDIATE' },
    { name: 'Lat Pulldown',           category: 'Back',      muscleGroup: ['Lats','Biceps'],          sets: 4, reps: '10-12', difficulty: 'BEGINNER'     },
    { name: 'Leg Press',              category: 'Legs',      muscleGroup: ['Quads','Glutes'],         sets: 4, reps: '12-15', difficulty: 'BEGINNER'     },
    { name: 'Shoulder Press',         category: 'Shoulders', muscleGroup: ['Deltoids','Triceps'],     sets: 3, reps: '10-12', difficulty: 'INTERMEDIATE' },
    { name: 'Bicep Curl',             category: 'Arms',      muscleGroup: ['Biceps'],                 sets: 3, reps: '12-15', difficulty: 'BEGINNER'     },
    { name: 'Tricep Pushdown',        category: 'Arms',      muscleGroup: ['Triceps'],                sets: 3, reps: '12-15', difficulty: 'BEGINNER'     },
    { name: 'Leg Curl',               category: 'Legs',      muscleGroup: ['Hamstrings'],             sets: 3, reps: '12-15', difficulty: 'BEGINNER'     },
    { name: 'Cable Fly',              category: 'Chest',     muscleGroup: ['Chest'],                  sets: 3, reps: '15-20', difficulty: 'INTERMEDIATE' },
    { name: 'Romanian Deadlift',      category: 'Legs',      muscleGroup: ['Hamstrings','Glutes'],    sets: 4, reps: '8-10',  difficulty: 'ADVANCED'     },
    { name: 'Face Pull',              category: 'Shoulders', muscleGroup: ['Rear Deltoids','Traps'],  sets: 3, reps: '15-20', difficulty: 'BEGINNER'     },
    { name: 'Crunches',               category: 'Core',      muscleGroup: ['Abs'],                    sets: 3, reps: '20-25', difficulty: 'BEGINNER'     },
    { name: 'Mountain Climbers',      category: 'Cardio',    muscleGroup: ['Full Body'],              duration: '30 sec', difficulty: 'INTERMEDIATE'    },
    { name: 'Jump Rope',              category: 'Cardio',    muscleGroup: ['Full Body'],              duration: '10 min', difficulty: 'BEGINNER'        },
    { name: 'Dumbbell Row',           category: 'Back',      muscleGroup: ['Lats','Rhomboids'],       sets: 4, reps: '10-12', difficulty: 'INTERMEDIATE' },
  ];
  for (const w of extraWorkouts) {
    const count = await prisma.workout.count({ where: { name: w.name } });
    if (count === 0) await prisma.workout.create({ data: w });
  }
  console.log('✅ Extra Workouts created');

  // 15. Extra Diet Plans
  const extraDiets = [
    { name: 'Keto Diet',        goal: 'Weight Loss',  calories: 1600, protein: 120, carbs: 30,  fats: 110, meals: ['Eggs + Avocado (Breakfast)', 'Grilled Chicken + Salad (Lunch)', 'Paneer Tikka (Dinner)'] },
    { name: 'Vegan Bulk',       goal: 'Muscle Gain',  calories: 2800, protein: 160, carbs: 380, fats: 70,  meals: ['Oats + Banana + Peanut Butter', 'Tofu + Brown Rice', 'Lentil Soup + Roti'] },
    { name: 'Maintenance Diet', goal: 'Maintenance',  calories: 2200, protein: 140, carbs: 250, fats: 75,  meals: ['Poha + Milk (Breakfast)', 'Dal + Rice + Sabzi (Lunch)', 'Roti + Paneer (Dinner)'] },
    { name: 'Endurance Fuel',   goal: 'Endurance',    calories: 2600, protein: 130, carbs: 350, fats: 65,  meals: ['Banana + Oats Smoothie', 'Pasta + Chicken', 'Sweet Potato + Fish'] },
    { name: 'Fat Loss Express', goal: 'Weight Loss',  calories: 1500, protein: 160, carbs: 100, fats: 50,  meals: ['Greek Yogurt + Berries', 'Grilled Fish + Veggies', 'Protein Shake + Almonds'] },
    { name: 'Lean Bulk',        goal: 'Muscle Gain',  calories: 3200, protein: 220, carbs: 380, fats: 85,  meals: ['6 Eggs + Toast + OJ', 'Rice + Chicken + Broccoli', 'Whey Shake + Banana', 'Paneer + Roti'] },
    { name: 'Flexibility Diet', goal: 'Flexibility',  calories: 2000, protein: 100, carbs: 280, fats: 60,  meals: ['Fruit Bowl + Nuts', 'Quinoa + Veggies', 'Soup + Salad'] },
  ];
  for (const d of extraDiets) {
    const count = await prisma.dietPlan.count({ where: { name: d.name } });
    if (count === 0) await prisma.dietPlan.create({ data: d });
  }
  console.log('✅ Extra Diet Plans created');

  // 16. Settings
  const settingsCount = await prisma.settings.count();
  if (settingsCount === 0) {
    await prisma.settings.create({
      data: { gymName: 'GymSmart Fitness', ownerName: 'Rohit Grandmaster', phone: '+91 83479 77566', email: 'admin@gymsmart.com', city: 'Mumbai', gstNumber: '27AABCG1234A1Z5' }
    });
  }
  console.log('✅ Settings created');

  console.log('\n🎉 Seeding complete!');
}

main().catch(e => { console.error('❌ Seed failed:', e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
