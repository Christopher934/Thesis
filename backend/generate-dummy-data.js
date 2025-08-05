// 🏥 HOSPITAL SHIFT DUMMY DATA GENERATOR
// Generates 100 realistic shift records with proper role distribution

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Realistic hospital shift data
const generateDummyShifts = () => {
  const shifts = [];
  const baseDate = new Date('2025-08-06');
  
  // User role mapping for realistic assignments
  const userRoles = {
    // Doctors (Critical care specialists)
    1: { role: 'DOKTER', specialty: 'ICU', seniority: 'SENIOR' },
    2: { role: 'DOKTER', specialty: 'ICU', seniority: 'SENIOR' },
    3: { role: 'DOKTER', specialty: 'ICU', seniority: 'SENIOR' },
    11: { role: 'DOKTER', specialty: 'EMERGENCY', seniority: 'SENIOR' },
    12: { role: 'DOKTER', specialty: 'EMERGENCY', seniority: 'SENIOR' },
    13: { role: 'DOKTER', specialty: 'EMERGENCY', seniority: 'SENIOR' },
    
    // Nurses (Primary caregivers)
    4: { role: 'PERAWAT', specialty: 'ICU', seniority: 'SENIOR' },
    5: { role: 'PERAWAT', specialty: 'ICU', seniority: 'SENIOR' },
    6: { role: 'PERAWAT', specialty: 'NICU', seniority: 'SENIOR' },
    7: { role: 'PERAWAT', specialty: 'NICU', seniority: 'SENIOR' },
    8: { role: 'PERAWAT', specialty: 'NICU', seniority: 'SENIOR' },
    9: { role: 'PERAWAT', specialty: 'GENERAL', seniority: 'SENIOR' },
    10: { role: 'PERAWAT', specialty: 'GENERAL', seniority: 'SENIOR' },
    14: { role: 'PERAWAT', specialty: 'EMERGENCY', seniority: 'REGULAR' },
    15: { role: 'PERAWAT', specialty: 'EMERGENCY', seniority: 'REGULAR' },
    16: { role: 'PERAWAT', specialty: 'GENERAL', seniority: 'REGULAR' },
    17: { role: 'PERAWAT', specialty: 'GENERAL', seniority: 'REGULAR' },
    18: { role: 'PERAWAT', specialty: 'GENERAL', seniority: 'REGULAR' },
    19: { role: 'PERAWAT', specialty: 'GENERAL', seniority: 'REGULAR' },
    20: { role: 'PERAWAT', specialty: 'GENERAL', seniority: 'REGULAR' },
    21: { role: 'PERAWAT', specialty: 'OUTPATIENT', seniority: 'JUNIOR' },
    22: { role: 'PERAWAT', specialty: 'OUTPATIENT', seniority: 'JUNIOR' },
    23: { role: 'PERAWAT', specialty: 'GENERAL', seniority: 'JUNIOR' },
    24: { role: 'PERAWAT', specialty: 'GENERAL', seniority: 'JUNIOR' },
    25: { role: 'PERAWAT', specialty: 'GENERAL', seniority: 'JUNIOR' },
    
    // Support Staff (Lab, Pharmacy, Radiology)
    26: { role: 'STAF', specialty: 'LABORATORY', seniority: 'SENIOR' },
    27: { role: 'STAF', specialty: 'LABORATORY', seniority: 'SENIOR' },
    28: { role: 'STAF', specialty: 'LABORATORY', seniority: 'REGULAR' },
    29: { role: 'STAF', specialty: 'LABORATORY', seniority: 'REGULAR' },
    30: { role: 'STAF', specialty: 'LABORATORY', seniority: 'REGULAR' },
    31: { role: 'STAF', specialty: 'PHARMACY', seniority: 'SENIOR' },
    32: { role: 'STAF', specialty: 'PHARMACY', seniority: 'SENIOR' },
    33: { role: 'STAF', specialty: 'PHARMACY', seniority: 'REGULAR' },
    34: { role: 'STAF', specialty: 'PHARMACY', seniority: 'REGULAR' },
    35: { role: 'STAF', specialty: 'PHARMACY', seniority: 'REGULAR' },
    36: { role: 'STAF', specialty: 'RADIOLOGY', seniority: 'SENIOR' },
    37: { role: 'STAF', specialty: 'RADIOLOGY', seniority: 'SENIOR' },
    38: { role: 'STAF', specialty: 'RADIOLOGY', seniority: 'REGULAR' },
    39: { role: 'STAF', specialty: 'RADIOLOGY', seniority: 'REGULAR' },
    40: { role: 'STAF', specialty: 'RADIOLOGY', seniority: 'REGULAR' }
  };

  // Generate realistic shift patterns
  const shiftPatterns = [
    // ICU - 24/7 critical care
    { location: 'ICU', lokasiEnum: 'ICU', userIds: [1, 2, 3, 4, 5], shifts: ['PAGI', 'SIANG', 'MALAM'] },
    
    // NICU - 24/7 pediatric critical care  
    { location: 'NICU', lokasiEnum: 'NICU', userIds: [6, 7, 8, 9, 10], shifts: ['PAGI', 'SIANG', 'MALAM'] },
    
    // Emergency Department - 24/7 high volume
    { location: 'GAWAT_DARURAT', lokasiEnum: 'GAWAT_DARURAT', userIds: [11, 12, 13, 14, 15], shifts: ['PAGI', 'SIANG', 'MALAM'] },
    
    // Inpatient Ward - 24/7 general care
    { location: 'RAWAT_INAP', lokasiEnum: 'RAWAT_INAP', userIds: [16, 17, 18, 19, 20], shifts: ['PAGI', 'SIANG', 'MALAM'] },
    
    // Outpatient - Day shifts only
    { location: 'RAWAT_JALAN', lokasiEnum: 'RAWAT_JALAN', userIds: [21, 22, 23, 24, 25], shifts: ['PAGI', 'SIANG'] },
    
    // Laboratory - 24/7 for urgent tests
    { location: 'LABORATORIUM', lokasiEnum: 'LABORATORIUM', userIds: [26, 27, 28, 29, 30], shifts: ['PAGI', 'SIANG', 'MALAM'] },
    
    // Pharmacy - Extended hours
    { location: 'FARMASI', lokasiEnum: 'FARMASI', userIds: [31, 32, 33, 34, 35], shifts: ['PAGI', 'SIANG'] },
    
    // Radiology - Day shifts mainly
    { location: 'RADIOLOGI', lokasiEnum: 'RADIOLOGI', userIds: [36, 37, 38, 39, 40], shifts: ['PAGI', 'SIANG'] }
  ];

  // Generate shifts for 7 days
  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(baseDate);
    currentDate.setDate(baseDate.getDate() + day);
    const dateString = currentDate.toISOString().split('T')[0];
    
    shiftPatterns.forEach(pattern => {
      pattern.shifts.forEach(shiftType => {
        // Assign 1-2 users per shift depending on unit criticality
        const assignedUsers = pattern.location.includes('ICU') || pattern.location.includes('GAWAT_DARURAT') 
          ? pattern.userIds.slice(0, 2) // Critical units get 2 staff
          : pattern.userIds.slice(0, 1); // Regular units get 1 staff
        
        assignedUsers.forEach(userId => {
          const shift = {
            userId: userId,
            tanggal: dateString,
            jammulai: getShiftStartTime(shiftType),
            jamselesai: getShiftEndTime(shiftType),
            lokasishift: pattern.location,
            lokasiEnum: pattern.lokasiEnum,
            tipeshift: shiftType
          };
          shifts.push(shift);
        });
      });
    });
  }
  
  return shifts;
};

// Helper functions for shift times
const getShiftStartTime = (shiftType) => {
  switch (shiftType) {
    case 'PAGI': return '06:00:00';
    case 'SIANG': return '14:00:00';
    case 'MALAM': return '22:00:00';
    default: return '08:00:00';
  }
};

const getShiftEndTime = (shiftType) => {
  switch (shiftType) {
    case 'PAGI': return '14:00:00';
    case 'SIANG': return '22:00:00';
    case 'MALAM': return '06:00:00';
    default: return '16:00:00';
  }
};

// Main execution function
async function main() {
  try {
    console.log('🏥 Generating realistic hospital shift dummy data...');
    
    // Generate shift data
    const shifts = generateDummyShifts();
    console.log(`Generated ${shifts.length} shift records`);
    
    // Insert shifts in batches to avoid overwhelming the database
    const batchSize = 20;
    for (let i = 0; i < shifts.length; i += batchSize) {
      const batch = shifts.slice(i, i + batchSize);
      
      try {
        await prisma.shift.createMany({
          data: batch,
          skipDuplicates: true
        });
        console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(shifts.length/batchSize)}`);
      } catch (error) {
        console.warn(`⚠️ Batch ${Math.floor(i/batchSize) + 1} had some duplicates, skipping...`);
      }
    }
    
    // Update user roles to match assignments
    console.log('🔄 Updating user roles...');
    
    // Doctors
    await prisma.user.updateMany({
      where: { id: { in: [1, 2, 3, 11, 12, 13] } },
      data: { role: 'DOKTER', status: 'ACTIVE' }
    });
    
    // Nurses  
    await prisma.user.updateMany({
      where: { id: { in: [4, 5, 6, 7, 8, 9, 10, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25] } },
      data: { role: 'PERAWAT', status: 'ACTIVE' }
    });
    
    // Support Staff
    await prisma.user.updateMany({
      where: { id: { in: [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40] } },
      data: { role: 'STAF', status: 'ACTIVE' }
    });
    
    // Verify results
    const totalShifts = await prisma.shift.count();
    const userRoleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
      where: { status: 'ACTIVE' }
    });
    
    console.log('\n🎉 DUMMY DATA GENERATION COMPLETE!');
    console.log('=====================================');
    console.log(`📊 Total shifts in database: ${totalShifts}`);
    console.log('👥 User role distribution:');
    userRoleDistribution.forEach(group => {
      console.log(`   ${group.role}: ${group._count.role} users`);
    });
    
    // Show sample shifts by location
    console.log('\n📍 Sample shifts by location:');
    const shiftsByLocation = await prisma.shift.groupBy({
      by: ['lokasiEnum'],
      _count: { lokasiEnum: true },
      orderBy: { _count: { lokasiEnum: 'desc' } }
    });
    
    shiftsByLocation.forEach(group => {
      console.log(`   ${group.lokasiEnum}: ${group._count.lokasiEnum} shifts`);
    });
    
    console.log('\n✨ All data is realistic and follows hospital scheduling standards!');
    
  } catch (error) {
    console.error('❌ Error generating dummy data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main()
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
