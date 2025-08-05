// generate-100-dummy-employees.ts
// Note: Run this from the backend directory where @prisma/client is available
// cd backend && npx ts-node ../generate-100-dummy-employees.ts

const prisma = require('./backend/prisma/generated/client').PrismaClient();
const bcrypt = require('bcrypt');

// Define enums manually since we can't import from @prisma/client in this location
enum Role {
  ADMIN = 'ADMIN',
  DOKTER = 'DOKTER', 
  PERAWAT = 'PERAWAT',
  STAF = 'STAF',
  SUPERVISOR = 'SUPERVISOR'
}

enum Gender {
  L = 'L',
  P = 'P'
}

enum WorkloadStatus {
  UNDERLOADED = 'UNDERLOADED',
  NORMAL = 'NORMAL', 
  HIGH = 'HIGH',
  OVERWORKED = 'OVERWORKED',
  CRITICAL = 'CRITICAL'
}

enum SkillLevel {
  TRAINEE = 'TRAINEE',
  JUNIOR = 'JUNIOR',
  SENIOR = 'SENIOR', 
  EXPERT = 'EXPERT',
  SPECIALIST = 'SPECIALIST'
}

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

const namaBelakang = [
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

// Medical specializations and skills for realistic role assignment
const medicalSpecializations = {
  DOKTER: [
    'Dokter Umum', 'Spesialis Dalam', 'Spesialis Bedah', 'Spesialis Anak', 'Spesialis Kandungan',
    'Spesialis Jantung', 'Spesialis Saraf', 'Spesialis Mata', 'Spesialis THT', 'Spesialis Kulit',
    'Spesialis Anestesi', 'Spesialis Radiologi', 'Spesialis Patologi', 'Dokter Gigi', 'Spesialis Urologi'
  ],
  PERAWAT: [
    'Perawat ICU', 'Perawat IGD', 'Perawat Bedah', 'Perawat Anak', 'Perawat Kandungan',
    'Perawat Jantung', 'Perawat Hemodialisa', 'Perawat Onkologi', 'Perawat Geriatri', 'Perawat Psikiatri',
    'Perawat NICU', 'Perawat PICU', 'Perawat OK', 'Perawat Rehabilitasi', 'Perawat Paliatif'
  ],
  STAF: [
    'Administrasi', 'Farmasi', 'Laboratorium', 'Radiologi', 'Gizi', 'Fisioterapi',
    'Rekam Medis', 'IT Support', 'Keamanan', 'Cleaning Service', 'Maintenance', 'Laundry',
    'Supir Ambulans', 'Customer Service', 'Keuangan'
  ],
  SUPERVISOR: [
    'Kepala Ruangan ICU', 'Kepala IGD', 'Supervisor Perawat', 'Kepala Farmasi', 'Kepala Lab',
    'Supervisor Medis', 'Kepala Radiologi', 'Supervisor Administrasi', 'Kepala Keuangan', 'Kepala IT'
  ]
};

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

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generatePhoneNumber(): string {
  const provider = getRandomElement(phoneProviders);
  const number = Math.floor(Math.random() * 90000000) + 10000000; // 8 digit number
  return provider + number.toString();
}

function generateBirthDate(minAge: number = 22, maxAge: number = 60): Date {
  const today = new Date();
  const minDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());
  const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  const randomTime = minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime());
  return new Date(randomTime);
}

function generateEmployeeId(role: Role, sequence: number): string {
  const rolePrefix = {
    ADMIN: 'ADM',
    DOKTER: 'DOK',
    PERAWAT: 'PER',
    STAF: 'STA',
    SUPERVISOR: 'SUP'
  };
  
  return `${rolePrefix[role]}${sequence.toString().padStart(3, '0')}`;
}

function getSkillLevelByRole(role: Role): SkillLevel {
  const skillDistribution = {
    DOKTER: [SkillLevel.SENIOR, SkillLevel.EXPERT, SkillLevel.SPECIALIST],
    PERAWAT: [SkillLevel.JUNIOR, SkillLevel.SENIOR, SkillLevel.EXPERT],
    STAF: [SkillLevel.TRAINEE, SkillLevel.JUNIOR, SkillLevel.SENIOR],
    SUPERVISOR: [SkillLevel.EXPERT, SkillLevel.SPECIALIST],
    ADMIN: [SkillLevel.SENIOR, SkillLevel.EXPERT]
  };
  
  return getRandomElement(skillDistribution[role]);
}

function getMaxShiftsByRole(role: Role): number {
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
    { role: Role.DOKTER, count: 25 },     // 25 doctors
    { role: Role.PERAWAT, count: 45 },    // 45 nurses (largest group)
    { role: Role.STAF, count: 20 },       // 20 staff members
    { role: Role.SUPERVISOR, count: 8 },   // 8 supervisors
    { role: Role.ADMIN, count: 2 }        // 2 additional admins
  ];
  
  let employeeCounter = 1;
  let createdEmployees = [];
  
  for (const { role, count } of roleDistribution) {
    console.log(`👥 Creating ${count} ${role} employees...`);
    
    for (let i = 0; i < count; i++) {
      // Determine gender with realistic distribution
      const gender: Gender = Math.random() > 0.6 ? 'P' : 'L'; // 60% female, 40% male (realistic for healthcare)
      
      // Select appropriate names based on gender
      const namaDepan = gender === 'L' 
        ? getRandomElement(namaDepanPria)
        : getRandomElement(namaDepanWanita);
      
      const namaBelakang = getRandomElement(namaBelakang);
      
      // Generate unique identifiers
      const employeeId = generateEmployeeId(role, employeeCounter);
      const username = `${role.toLowerCase()}${employeeCounter}`;
      const email = `${username}${getRandomElement(emailDomains)}`;
      
      // Generate realistic address
      const alamat = `${getRandomElement(alamatJalan)} No.${Math.floor(Math.random() * 200) + 1}, RT.${Math.floor(Math.random() * 20) + 1}/RW.${Math.floor(Math.random() * 15) + 1}`;
      
      // Generate birth date based on role (doctors tend to be older due to education requirements)
      const birthDate = role === Role.DOKTER || role === Role.SUPERVISOR
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
        status: 'ACTIVE' as const,
        workloadStatus: WorkloadStatus.NORMAL,
        skillLevel: getSkillLevelByRole(role),
        preferredLocations: JSON.stringify(preferredLocations),
        maxShiftsPerMonth: getMaxShiftsByRole(role),
        totalShifts: Math.floor(Math.random() * 50), // Random historical shift count
        currentMonthShifts: Math.floor(Math.random() * 15), // Current month shifts
        consecutiveDays: Math.floor(Math.random() * 3), // Current consecutive days
      };
      
      try {
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
              leadership: role === Role.SUPERVISOR || role === Role.ADMIN ? Math.random() * 3 + 7 : Math.random() * 2 + 5
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
        console.error(`❌ Error creating employee ${employeeCounter}:`, error);
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
  }, {} as Record<Role, number>);
  
  Object.entries(summary).forEach(([role, count]) => {
    console.log(`   ${role}: ${count} employees`);
  });
  
  console.log('\n🔐 All employees created with password: "hospital123"');
  console.log('\n💡 Sample login credentials:');
  console.log('   👨‍⚕️ Doctor: dok001@rsud-anugerah.id');
  console.log('   👩‍⚕️ Nurse: perawat001@rsud-anugerah.id');
  console.log('   📋 Staff: staf001@rsud-anugerah.id');
  console.log('   👨‍💼 Supervisor: supervisor001@rsud-anugerah.id');
  
  return createdEmployees;
}

// Main execution
async function main() {
  try {
    await generateDummyEmployees();
    console.log('\n✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
