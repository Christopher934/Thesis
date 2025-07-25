'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Clock, User, FileText, AlertCircle } from 'lucide-react';

// Helper function to format time from DateTime string to HH:mm format
const formatTime = (timeString: string): string => {
  if (!timeString) return '';
  
  try {
    const date = new Date(timeString);
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
};

// Types for form props
type CommonFormProps = {
  type: 'create' | 'update';
  data?: any;
  onClose: () => void;
  onCreate: (newData: any) => void;
  onUpdate?: (updatedData: any) => void;
};

// User interface
interface User {
  id: number;
  employeeId: string;
  username: string;
  namaDepan: string;
  namaBelakang: string;
  role: string;
}

// Shift interface
interface Shift {
  id: number;
  tanggal: string;
  jammulai: string;
  jamselesai: string;
  lokasishift: string;
  userId: number;
  idpegawai: string;
  nama?: string;
}

// Validation schema
const schema = z.object({
  toUserId: z.number().min(1, 'Partner tukar shift harus dipilih'),
  shiftId: z.number().min(1, 'Shift harus dipilih'),
  alasan: z.string().min(10, 'Alasan minimal 10 karakter'),
});

type FormInputs = z.infer<typeof schema>;

// Helper function to format RSUD location names
const formatLokasiShift = (lokasi: string): string => {
  if (!lokasi) return '-';
  
  // Define mapping for RSUD department names
  const lokasiMapping: { [key: string]: string } = {
    'GEDUNG_ADMINISTRASI': 'Gedung Administrasi',
    'RAWAT_JALAN': 'Rawat Jalan',
    'RAWAT_INAP': 'Rawat Inap',
    'GAWAT_DARURAT': 'Gawat Darurat',
    'LABORATORIUM': 'Laboratorium',
    'FARMASI': 'Farmasi',
    'RADIOLOGI': 'Radiologi',
    'GIZI': 'Gizi',
    'KEAMANAN': 'Keamanan',
    'LAUNDRY': 'Laundry',
    'CLEANING_SERVICE': 'Cleaning Service',
    'SUPIR': 'Supir',
    'ICU': 'ICU',
    'NICU': 'NICU',
  };
  
  return lokasiMapping[lokasi] || lokasi.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

function TukarShiftForm({
  type,
  data,
  onClose,
  onCreate,
  onUpdate,
}: CommonFormProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserShifts, setCurrentUserShifts] = useState<Shift[]>([]);
  const [selectedTargetUser, setSelectedTargetUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormInputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      toUserId: 0,
      shiftId: 0,
      alasan: data?.alasan || '',
    },
  });

  const watchedToUserId = watch('toUserId');

  // Load users and current user data on component mount
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Tidak ada token autentikasi');

        // Get current user info
        const currentUserStr = localStorage.getItem('user');
        const currentRole = localStorage.getItem('role');
        let parsedUserId = 0;
        let parsedUser: User | null = null;
        if (currentUserStr) {
          parsedUser = JSON.parse(currentUserStr);
          parsedUserId = parsedUser?.id || 0;
          setCurrentUser(parsedUser); // <-- fix: set currentUser state
        }

        // Fetch all users for partner selection
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        try {
          const usersResponse = await fetch(`${apiUrl}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            // Filter users with same role as current user
            // FIX: Gunakan id dari localStorage user dan pastikan tipe data number
            const filteredUsers = usersData.filter((user: User) => 
              user.role.toLowerCase() === currentRole?.toLowerCase() && 
              String(user.id) !== String(parsedUserId)
            );
            setUsers(filteredUsers);
          } else {
            throw new Error(`Failed to fetch users: ${usersResponse.status}`);
          }
        } catch (error) {
          console.error('Failed to fetch users from API:', error);
          setErrorMessage('Gagal Memuat Daftar Pengguna');
        }

        // Fetch current user's shifts
        await fetchUserShifts(parsedUserId, parsedUser);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setErrorMessage('Gagal Memuat Data Awal');
      }
    };
    fetchInitialData();
  }, [setValue]);

  // Fetch user when target user changes (just for display)
  useEffect(() => {
    if (watchedToUserId > 0) {
      const selectedUser = users.find(u => u.id === watchedToUserId);
      setSelectedTargetUser(selectedUser || null);
    } else {
      setSelectedTargetUser(null);
    }
  }, [watchedToUserId, users]);

  // Fetch shifts for current user
  const fetchUserShifts = async (userId: number, userObj?: User | null) => {
    if (typeof window === 'undefined') return;
    try {
      const token = localStorage.getItem('token');
      if (!token || userId === 0) return;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      try {
        const response = await fetch(`${apiUrl}/shifts?userId=${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const shifts = await response.json();
          const futureShifts = shifts.filter((shift: Shift) => {
            const shiftDate = new Date(shift.tanggal);
            const today = new Date();
            return shiftDate >= today;
          });
          // Only show shifts owned by current user
          const userToUse = userObj || currentUser;
          if (futureShifts && userToUse) {
            setCurrentUserShifts(futureShifts.filter((shift: Shift) => shift.userId === userToUse.id));
          } else {
            setCurrentUserShifts(futureShifts);
          }
        } else {
          throw new Error(`Failed to fetch shifts: ${response.status}`);
        }
      } catch (error) {
        console.error('Failed to fetch shifts from API:', error);
        setCurrentUserShifts([]);
      }
    } catch (error) {
      console.error('Error fetching user shifts:', error);
    }
  };

  // Handle form submission
  const onSubmit = handleSubmit(async (formData) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      // Only run on client side
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token tidak ditemukan');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const endpoint = type === 'create' ? '/shift-swap-requests' : `/shift-swap-requests/${data?.id}`;
      const method = type === 'create' ? 'POST' : 'PUT';

      // Prepare request data
      const requestData = {
        toUserId: formData.toUserId,
        shiftId: formData.shiftId,
        alasan: formData.alasan,
        requiresUnitHead: false, // Will be determined by backend based on shift location
      };
      console.log('Submitting shift swap request:', requestData);

      try {
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error:', errorText);
          throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Success from API:', result);
        setSuccessMessage('Pengajuan tukar shift berhasil!');

        // Call the appropriate callback
        if (type === 'create') {
          console.log('Calling onCreate callback');
          onCreate(result);
        } else if (type === 'update' && onUpdate) {
          console.log('Calling onUpdate callback');
          onUpdate(result);
        }

        // Reset form and close modal
        if (type === 'create') {
          reset();
        }
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 1200);
      } catch (apiError: any) {
        console.error('API request failed:', apiError);
        setErrorMessage(apiError.message || 'Gagal mengirim permintaan ke server');
      }

    } catch (error: any) {
      console.error('Error:', error);
      setErrorMessage(error.message || 'Terjadi Kesalahan Saat Menyimpan Data');
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="w-full max-w-full mx-auto px-4">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {type === 'create' ? 'Ajukan Tukar Shift' : 'Edit Pengajuan Tukar Shift'}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Silakan lengkapi formulir berikut untuk mengajukan pertukaran shift
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-red-800 text-sm">{errorMessage}</span>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center">
                <User className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-green-800 text-sm">{successMessage}</span>
              </div>
            </div>
          )}

          {/* Partner Selection */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg mr-3">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              Partner Tukar Shift
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Pilih Partner Tukar Shift *
              </label>
              <div className="relative">
                <select
                  {...register('toUserId', { valueAsNumber: true })}
                  className={`w-full px-2 sm:px-3 py-2 sm:py-2.5 md:py-3 border rounded-lg bg-white text-gray-900 text-xs sm:text-sm md:text-base font-medium shadow-sm transition-all duration-200 appearance-none cursor-pointer
                    ${errors.toUserId 
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
                      : 'border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }
                    focus:outline-none`}
                >
                  <option value={0} className="text-gray-500">Pilih partner tukar shift...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id} className="text-gray-900">
                      {user.employeeId} - {user.namaDepan} {user.namaBelakang} ({user.role})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.toUserId && (
                <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-start bg-red-50 p-2 rounded">
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                  <span>{errors.toUserId.message}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Shift Selection */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg mr-3">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            Pilih Shift untuk Ditukar
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {/* Current User Shift */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Shift Anda yang Ingin Ditukar *
              </label>
              <div className="relative">
                <select
                  {...register('shiftId', { valueAsNumber: true })}
                  className={`w-full px-3 py-2.5 sm:py-3 border rounded-lg bg-white text-gray-900 text-sm sm:text-base font-medium shadow-sm transition-all duration-200 appearance-none cursor-pointer
                    ${errors.shiftId 
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
                      : 'border-gray-300 hover:border-yellow-400 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100'
                    }
                    focus:outline-none`}
                >
                  <option value={0} className="text-gray-500">Pilih shift Anda...</option>
                  {currentUserShifts.map(shift => (
                    <option key={shift.id} value={shift.id} className="text-gray-900">
                      {shift.tanggal} | {formatTime(shift.jammulai)}-{formatTime(shift.jamselesai)} | {formatLokasiShift(shift.lokasishift)}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.shiftId && (
                <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-start bg-red-50 p-2 rounded">
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                  <span>{errors.shiftId.message}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Reason and Notes */}
        <div className="bg-gray-50 p-2 sm:p-3 md:p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4 flex items-center">
            <div className="p-1 sm:p-1.5 md:p-2 bg-gray-600 rounded-md mr-2 sm:mr-3 flex-shrink-0">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" />
            </div>
            <span className="truncate">Alasan dan Catatan</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Alasan Tukar Shift *
              </label>
              <textarea
                {...register('alasan')}
                rows={4}
                className={`w-full px-3 py-2.5 sm:py-3 border rounded-lg bg-white text-gray-900 text-sm sm:text-base font-medium shadow-sm transition-all duration-200 resize-none
                  ${errors.alasan 
                    ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
                    : 'border-gray-300 hover:border-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-100'
                  }
                  focus:outline-none`}
                placeholder="Jelaskan alasan mengapa Anda perlu menukar shift (minimal 10 karakter)"
              />
              {errors.alasan && (
                <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-start bg-red-50 p-2 rounded">
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                  <span>{errors.alasan.message}</span>
                </p>
              )}
            </div>
          </div>
        </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-3 px-4 sm:px-6 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 ${
                isSubmitting
                  ? 'bg-blue-400 text-white cursor-not-allowed opacity-60'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-md hover:shadow-lg'
              }`}
            >
              {isSubmitting ? 'Menyimpan...' : type === 'create' ? 'Kirim Pengajuan' : 'Update Pengajuan'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-500 text-white py-3 px-4 sm:px-6 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200 font-semibold text-sm sm:text-base transition-all duration-200 disabled:opacity-60 shadow-md hover:shadow-lg"
            >
              Batal
            </button>
          </div>

          {/* Info Footer */}
          <div className="mt-3 sm:mt-4 md:mt-6 p-2 sm:p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
              <strong>Catatan:</strong> Pengajuan tukar shift harus disetujui oleh partner tukar shift dan supervisor. 
              Untuk unit kritikal (ICU/IGD), diperlukan persetujuan tambahan dari kepala unit.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TukarShiftForm;