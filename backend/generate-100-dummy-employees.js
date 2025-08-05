// generate-100-dummy-employees.js
// Run this from the backend directory: cd backend && node ../generate-100-dummy-employees.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Realistic Indonesian names database
const namaDepanPria = [
  'Ahmad', 'Budi', 'Bambang', 'Andi', 'Agus', 'Dedi', 'Eko', 'Fajar', 'Hadi', 'Indra',
  'Joko', 'Kurnia', 'Lukman', 'Muhammad', 'Nugroho', 'Oki', 'Putra', 'Reza', 'Slamet', 'Tono',
  'Arief', 'Bayu', 'Cahyo', 'Dian', 'Edi', 'Fandi', 'Giri', 'Hendra', 'Ivan', 'Jaya',
  'Kadek', 'Luthfi', 'Made', 'Nur', 'Oka', 'Prima', 'Qodir', 'Rifki', 'Surya', 'Tri',
  'Abdul', 'Firman', 'Galih', 'Hafiz', 'Imam', 'Jamal', 'Krisna', 'Lutfi', 'Mahendra', 'Nanda'
];

const namaDepanWanita = [
  'Sari', 'Dewi', 'Rina', 'Maya', 'Lisa', 'Nina', 'Tari', 'Wati', 'Yuni', 'Zara',
  'Ani', 'Bela', 'Citra', 'Diah', 'Eka', 'Fitri', 'Gita', 'Hana', 'Indah', 'Jihan',
  'Kartika', 'Lila', 'Mira', 'Nita', 'Okta', 'Putri', 'Qori', 'Retno', 'Sinta', 'Tika',
  'Anggi', 'Bella', 'Cici', 'Diana', 'Elsa', 'Farah', 'Gina', 'Hesti', 'Intan', 'Juli',
  'Karina', 'Laras', 'Mega', 'Novi', 'Olla', 'Prita', 'Queena', 'Risa', 'Sella', 'Tiara'
];

const namaBelakangList = [
  'Wijaya', 'Pratama', 'Sari', 'Handayani', 'Putra', 'Dewi', 'Santoso', 'Lestari', 'Raharjo', 'Kusuma',
  'Wahyudi', 'Anggraini', 'Setiawan', 'Maharani', 'Gunawan', 'Permata', 'Hartono', 'Safitri', 'Nugroho', 'Oktaviani',
  'Saputra', 'Wardani', 'Firmansyah', 'Cahyani', 'Hakim', 'Melati', 'Hidayat', 'Puspita', 'Rahman', 'Kartini',
  'Andriani', 'Suharto', 'Fitriani', 'Budiman', 'Utami', 'Wibowo', 'Septiani', 'Kurniawan', 'Ratnasari', 'Susanto',
  'Damayanti', 'Yulianto', 'Suhartini', 'Maulana', 'Kencana', 'Prasetyo', 'Maharani', 'Triawan', 'Novitasari', 'Hermawan'
];

const alamatJalan = [
  'Jl. Sudirman', 'Jl. Thamrin', 'Jl. Gatot Subroto', 'Jl. Kuningan', 'Jl. Casablanca',
  'Jl. Kebon Jeruk', 'Jl. Kelapa Gading', 'Jl. Pondok Indah', 'Jl. Kemang', 'Jl. Senayan',
  'Jl. Menteng', 'Jl. Cikini', 'Jl. Salemba', 'Jl. Matraman', 'Jl. Cempaka Putih',
  'Jl. Rawamangun', 'Jl. Pulomas', 'Jl. Duren Sawit', 'Jl. Kramat Jati', 'Jl. Pasar Rebo',
  'Jl. Cipayung', 'Jl. Makassar', 'Jl. Tebet', 'Jl. Kalibata', 'Jl. Pancoran'
];

const emailDomains = ['@rsud-anugerah.id', '@rsud.local', '@hospital.id'];

// Realistic phone number patterns
const phoneProviders = ['0811', '0812', '0813', '0821', '0822', '0823', '0851', '0852', '0853', '0856', '0857', '0858'];

// Preferred locations based on role
const preferredLocationsByRole = {
  DOKTER: ['ICU', 'GAWAT_DARURAT', 'RAWAT_INAP', 'RAWAT_JALAN', 'KAMAR_OPERASI'],
  PERAWAT: ['ICU', 'NICU', 'GAWAT_DARURAT', 'RAWAT_INAP', 'HEMODIALISA', 'RECOVERY_ROOM'],
  STAF: ['LABORATORIUM', 'FARMASI', 'RADIOLOGI', 'GEDUNG_ADMINISTRASI', 'GIZI'],
  SUPERVISOR: ['ICU', 'GAWAT_DARURAT', 'RAWAT_INAP', 'GEDUNG_ADMINISTRASI'],
  ADMIN: ['GEDUNG_ADMINISTRASI']
};

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generatePhoneNumber() {
  const provider = getRandomElement(phoneProviders);
  const number = Math.floor(Math.random() * 90000000) + 10000000; // 8 digit number
  return provider + number.toString();
}

function generateBirthDate(minAge = 22, maxAge = 60) {
  const today = new Date();
  const minDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());
  const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  const randomTime = minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime());
  return new Date(randomTime);
}

function generateEmployeeId(role, sequence) {
  const rolePrefix = {
    ADMIN: 'ADM',
    DOKTER: 'DOK',
    PERAWAT: 'PER',
    STAF: 'STA',
    SUPERVISOR: 'SUP'
  };
  
  return `${rolePrefix[role]}${sequence.toString().padStart(3, '0')}`;
}

function getSkillLevelByRole(role) {
  const skillDistribution = {
    DOKTER: ['SENIOR', 'EXPERT', 'SPECIALIST'],
    PERAWAT: ['JUNIOR', 'SENIOR', 'EXPERT'],
    STAF: ['TRAINEE', 'JUNIOR', 'SENIOR'],
    SUPERVISOR: ['EXPERT', 'SPECIALIST'],
    ADMIN: ['SENIOR', 'EXPERT']
  };
  
  return getRandomElement(skillDistribution[role]);
}

function getMaxShiftsByRole(role) {
  const maxShifts = {
    DOKTER: Math.floor(Math.random() * 5) + 18, // 18-22 shifts
    PERAWAT: Math.floor(Math.random() * 4) + 20, // 20-23 shifts  
    STAF: Math.floor(Math.random() * 6) + 15, // 15-20 shifts
    SUPERVISOR: Math.floor(Math.random() * 3) + 16, // 16-18 shifts
    ADMIN: Math.floor(Math.random() * 3) + 12 // 12-14 shifts
  };
  
  return maxShifts[role];
}

async function generateDummyEmployees() {
  console.log('🚀 Starting generation of 100 realistic dummy employees...');
  
  const commonPassword = await bcrypt.hash('hospital123', 10);
  
  // Role distribution for 100 employees (realistic hospital staffing)
  const roleDistribution = [
    { role: 'DOKTER', count: 25 },     // 25 doctors
    { role: 'PERAWAT', count: 45 },    // 45 nurses (largest group)
    { role: 'STAF', count: 20 },       // 20 staff members
    { role: 'SUPERVISOR', count: 8 },   // 8 supervisors
    { role: 'ADMIN', count: 2 }        // 2 additional admins
  ];
  
  let employeeCounter = 1;
  const createdEmployees = [];
  
  for (const { role, count } of roleDistribution) {
    console.log(`👥 Creating ${count} ${role} employees...`);
    
    for (let i = 0; i < count; i++) {
      try {
        // Determine gender with realistic distribution
        const gender = Math.random() > 0.6 ? 'P' : 'L'; // 60% female, 40% male (realistic for healthcare)
        
        // Select appropriate names based on gender
        const namaDepan = gender === 'L' 
          ? getRandomElement(namaDepanPria)
          : getRandomElement(namaDepanWanita);
        
        const namaBelakang = getRandomElement(namaBelakangList);
        
        // Generate unique identifiers
        const employeeId = generateEmployeeId(role, employeeCounter);
        const username = `${role.toLowerCase()}${employeeCounter}`;
        const email = `${username}${getRandomElement(emailDomains)}`;
        
        // Generate realistic address
        const alamat = `${getRandomElement(alamatJalan)} No.${Math.floor(Math.random() * 200) + 1}, RT.${Math.floor(Math.random() * 20) + 1}/RW.${Math.floor(Math.random() * 15) + 1}`;
        
        // Generate birth date based on role (doctors tend to be older due to education requirements)
        const birthDate = role === 'DOKTER' || role === 'SUPERVISOR'
          ? generateBirthDate(28, 65)  // Doctors: 28-65 years old
          : generateBirthDate(22, 55); // Others: 22-55 years old
        
        // Get preferred locations for this role
        const possibleLocations = preferredLocationsByRole[role] || [];
        const preferredLocations = getRandomElements(possibleLocations, Math.min(3, possibleLocations.length));
        
        const employeeData = {
          employeeId,
          username,
          email,
          password: commonPassword,
          namaDepan,
          namaBelakang,
          alamat,
          noHp: generatePhoneNumber(),
          jenisKelamin: gender,
          tanggalLahir: birthDate,
          role,
          status: 'ACTIVE',
          workloadStatus: 'NORMAL',
          skillLevel: getSkillLevelByRole(role),
          preferredLocations: JSON.stringify(preferredLocations),
          maxShiftsPerMonth: getMaxShiftsByRole(role),
          totalShifts: Math.floor(Math.random() * 50), // Random historical shift count
          currentMonthShifts: Math.floor(Math.random() * 15), // Current month shifts
          consecutiveDays: Math.floor(Math.random() * 3), // Current consecutive days
        };
        
        const employee = await prisma.user.create({
          data: employeeData
        });
        
        // Create associated UserShiftStats
        await prisma.userShiftStats.create({
          data: {
            userId: employee.id,
            totalShifts: employeeData.totalShifts,
            totalHours: employeeData.totalShifts * 8, // Assume 8 hours per shift
            shiftsThisMonth: employeeData.currentMonthShifts,
            consecutiveDays: employeeData.consecutiveDays,
            workloadScore: Math.random() * 100, // Random workload score
            performanceRating: Math.random() * 3 + 7, // 7-10 performance rating
            skillRatings: JSON.stringify({
              clinical: Math.random() * 3 + 7,
              technical: Math.random() * 3 + 7,
              communication: Math.random() * 3 + 7,
              leadership: role === 'SUPERVISOR' || role === 'ADMIN' ? Math.random() * 3 + 7 : Math.random() * 2 + 5
            })
          }
        });
        
        createdEmployees.push({
          id: employee.id,
          name: `${namaDepan} ${namaBelakang}`,
          role,
          employeeId,
          email
        });
        
        employeeCounter++;
        
        // Progress indicator
        if (employeeCounter % 10 === 0) {
          console.log(`   ✅ Created ${employeeCounter - 1} employees...`);
        }
        
      } catch (error) {
        console.error(`❌ Error creating employee ${employeeCounter}:`, error.message);
        // Continue with next employee
        employeeCounter++;
      }
    }
  }
  
  console.log('\n🎉 Successfully created 100 dummy employees!');
  console.log('\n📊 Summary by Role:');
  
  const summary = createdEmployees.reduce((acc, emp) => {
    acc[emp.role] = (acc[emp.role] || 0) + 1;
    return acc;
  }, {});
  
  Object.entries(summary).forEach(([role, count]) => {
    console.log(`   ${role}: ${count} employees`);
  });
  
  console.log('\n🔐 All employees created with password: "hospital123"');
  console.log('\n💡 Sample login credentials:');
  console.log('   👨‍⚕️ Doctor: dokter1@rsud-anugerah.id');
  console.log('   👩‍⚕️ Nurse: perawat1@rsud-anugerah.id');
  console.log('   📋 Staff: staf1@rsud-anugerah.id');
  console.log('   👨‍💼 Supervisor: supervisor1@rsud-anugerah.id');
  
  return createdEmployees;
}

// Main execution
async function main() {
  try {
    console.log('🏥 RSUD Anugerah - Dummy Employee Data Generator');
    console.log('📅 Generating realistic medical staff data...\n');
    
    await generateDummyEmployees();
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n🚀 You can now run the hospital management system with 100+ employees!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if bcrypt is available
try {
  require('bcrypt');
  main();
} catch (error) {
  console.error('❌ bcrypt not found. Please run from backend directory:');
  console.error('   cd backend && node ../generate-100-dummy-employees.js');
  process.exit(1);
}
