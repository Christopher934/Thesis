import { IsOptional, IsArray, IsNumber, IsEnum, Min, Max } from 'class-validator';

export enum ShiftPreference {
  PAGI = 'PAGI',
  SIANG = 'SIANG', 
  MALAM = 'MALAM',
  NO_PREFERENCE = 'NO_PREFERENCE'
}

export enum LocationPreference {
  ICU = 'ICU',
  NICU = 'NICU',
  GAWAT_DARURAT = 'GAWAT_DARURAT',
  RAWAT_INAP = 'RAWAT_INAP',
  RAWAT_JALAN = 'RAWAT_JALAN',
  LABORATORIUM = 'LABORATORIUM',
  FARMASI = 'FARMASI',
  RADIOLOGI = 'RADIOLOGI',
  NO_PREFERENCE = 'NO_PREFERENCE'
}

export class UpdateEmployeePreferencesDto {
  @IsOptional()
  @IsEnum(ShiftPreference)
  preferredShiftType?: ShiftPreference;

  @IsOptional()
  @IsArray()
  @IsEnum(LocationPreference, { each: true })
  preferredLocations?: LocationPreference[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  maxShiftsPerMonth?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(7)
  maxConsecutiveDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3)
  maxNightShiftsConsecutive?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  seniorityLevel?: number; // 0 = Junior, 10 = Most Senior

  @IsOptional()
  unavailableDates?: string[]; // Array of dates in YYYY-MM-DD format
}
