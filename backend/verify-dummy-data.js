// verify-dummy-data.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyData() {
  try {
    console.log('🔍 Verifying dummy employee data...\n');
    
    // Count users by role
    const userCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      },
      orderBy: {
        _count: {
          role: 'desc'
        }
      }
    });
    
    console.log('📊 Employee Count by Role:');
    let totalEmployees = 0;
    userCounts.forEach(({ role, _count }) => {
      console.log(`   ${role}: ${_count.role} employees`);
      totalEmployees += _count.role;
    });
    
    console.log(`\n👥 Total Employees: ${totalEmployees}`);
    
    // Get some sample employees
    const sampleEmployees = await prisma.user.findMany({
      take: 5,
      select: {
        employeeId: true,
        namaDepan: true,
        namaBelakang: true,
        role: true,
        email: true,
        skillLevel: true,
        maxShiftsPerMonth: true
      },
      orderBy: {
        role: 'asc'
      }
    });
    
    console.log('\n🎯 Sample Employees:');
    sampleEmployees.forEach(emp => {
      console.log(`   ${emp.employeeId} - ${emp.namaDepan} ${emp.namaBelakang} (${emp.role}) - ${emp.email}`);
      console.log(`     Skill: ${emp.skillLevel}, Max Shifts: ${emp.maxShiftsPerMonth}/month`);
    });
    
    // Check UserShiftStats
    const statsCount = await prisma.userShiftStats.count();
    console.log(`\n📈 UserShiftStats Records: ${statsCount}`);
    
    // Gender distribution
    const genderDistribution = await prisma.user.groupBy({
      by: ['jenisKelamin'],
      _count: {
        jenisKelamin: true
      }
    });
    
    console.log('\n👥 Gender Distribution:');
    genderDistribution.forEach(({ jenisKelamin, _count }) => {
      const gender = jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan';
      const percentage = ((_count.jenisKelamin / totalEmployees) * 100).toFixed(1);
      console.log(`   ${gender}: ${_count.jenisKelamin} (${percentage}%)`);
    });
    
    console.log('\n✅ Data verification completed!');
    console.log('\n🚀 Ready to test shift optimization with realistic data!');
    
  } catch (error) {
    console.error('❌ Error verifying data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();
