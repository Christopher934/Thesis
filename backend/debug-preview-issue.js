// debug-preview-issue.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugPreviewIssue() {
  try {
    console.log('🔍 Debugging Preview Issue...');
    
    // Check users data
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        employeeId: true,
        namaDepan: true,
        namaBelakang: true,
        role: true,
        status: true
      },
      take: 5
    });
    
    console.log('\n👥 Sample Active Users:');
    users.forEach(user => {
      console.log(`   ${user.employeeId} - ${user.namaDepan} ${user.namaBelakang} (${user.role})`);
    });
    
    // Check total active users
    const totalActiveUsers = await prisma.user.count({
      where: { status: 'ACTIVE' }
    });
    console.log(`\n📊 Total Active Users: ${totalActiveUsers}`);
    
    // Check recent shifts
    const recentShifts = await prisma.shift.count({
      where: {
        tanggal: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      }
    });
    console.log(`📅 Recent Shifts (±30 days): ${recentShifts}`);
    
    // Test the query that the service uses
    try {
      const availableUsers = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        include: {
          shifts: {
            where: {
              tanggal: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              }
            }
          }
        },
        take: 3
      });
      
      console.log(`\n✅ getAvailableUsersWithWorkload query successful: ${availableUsers.length} users`);
      availableUsers.forEach(user => {
        console.log(`   ${user.namaDepan} ${user.namaBelakang}: ${user.shifts.length} shifts`);
      });
      
    } catch (error) {
      console.error(`❌ getAvailableUsersWithWorkload query failed:`, error.message);
    }
    
    console.log('\n✅ Debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPreviewIssue();
