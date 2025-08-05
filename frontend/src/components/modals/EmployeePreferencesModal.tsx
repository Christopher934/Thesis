import React, { useState, useEffect } from 'react';
import { CheckCircle, X, Users, Calendar, Clock, BarChart3, Settings, Star } from 'lucide-react';

interface EmployeePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: any) => void;
  currentUser?: any;
  isAdmin?: boolean;
  targetUserId?: number;
}

const EmployeePreferencesModal: React.FC<EmployeePreferencesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentUser,
  isAdmin = false,
  targetUserId
}) => {
  const [preferences, setPreferences] = useState({
    preferredShiftType: 'NO_PREFERENCE',
    preferredLocations: [] as string[],
    maxShiftsPerMonth: 20,
    maxConsecutiveDays: 5,
    maxNightShiftsConsecutive: 2,
    seniorityLevel: 0,
    unavailableDates: [] as string[]
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shiftTypeOptions = [
    { value: 'NO_PREFERENCE', label: 'Tidak Ada Preferensi' },
    { value: 'PAGI', label: 'Lebih Suka Shift Pagi (06:00 - 14:00)' },
    { value: 'SIANG', label: 'Lebih Suka Shift Siang (14:00 - 22:00)' },
    { value: 'MALAM', label: 'Lebih Suka Shift Malam (22:00 - 06:00)' }
  ];

  const locationOptions = [
    { value: 'ICU', label: 'ICU' },
    { value: 'NICU', label: 'NICU' },
    { value: 'GAWAT_DARURAT', label: 'Unit Gawat Darurat' },
    { value: 'RAWAT_INAP', label: 'Rawat Inap' },
    { value: 'RAWAT_JALAN', label: 'Rawat Jalan' },
    { value: 'LABORATORIUM', label: 'Laboratorium' },
    { value: 'FARMASI', label: 'Farmasi' },
    { value: 'RADIOLOGI', label: 'Radiologi' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchPreferences();
    }
  }, [isOpen, targetUserId]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const endpoint = isAdmin && targetUserId 
        ? `/employee-preferences/user/${targetUserId}`
        : '/employee-preferences/my-preferences';
      
      const response = await fetch(`${apiUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setPreferences(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setError('Gagal memuat preferensi pegawai');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const endpoint = isAdmin && targetUserId 
        ? `/employee-preferences/user/${targetUserId}`
        : '/employee-preferences/my-preferences';
      
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        const result = await response.json();
        onSave(result.data);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Gagal menyimpan preferensi');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setError('Gagal menyimpan preferensi pegawai');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationToggle = (location: string) => {
    setPreferences(prev => ({
      ...prev,
      preferredLocations: prev.preferredLocations.includes(location)
        ? prev.preferredLocations.filter(l => l !== location)
        : [...prev.preferredLocations, location]
    }));
  };

  const addUnavailableDate = (date: string) => {
    if (date && !preferences.unavailableDates.includes(date)) {
      setPreferences(prev => ({
        ...prev,
        unavailableDates: [...prev.unavailableDates, date]
      }));
    }
  };

  const removeUnavailableDate = (date: string) => {
    setPreferences(prev => ({
      ...prev,
      unavailableDates: prev.unavailableDates.filter(d => d !== date)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-semibold">
                {isAdmin ? 'Kelola Preferensi Pegawai' : 'Preferensi Kerja Saya'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Shift Type Preference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Preferensi Waktu Kerja
                </label>
                <div className="space-y-2">
                  {shiftTypeOptions.map(option => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="shiftType"
                        value={option.value}
                        checked={preferences.preferredShiftType === option.value}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          preferredShiftType: e.target.value
                        }))}
                        className="mr-3"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Preferred Locations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Users className="w-4 h-4 inline mr-2" />
                  Lokasi Kerja Disukai (Pilih beberapa)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {locationOptions.map(option => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.preferredLocations.includes(option.value)}
                        onChange={() => handleLocationToggle(option.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Workload Limits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BarChart3 className="w-4 h-4 inline mr-2" />
                    Max Shift per Bulan
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={preferences.maxShiftsPerMonth}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      maxShiftsPerMonth: parseInt(e.target.value) || 20
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Max Hari Berturut-turut
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={preferences.maxConsecutiveDays}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      maxConsecutiveDays: parseInt(e.target.value) || 5
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Max Shift Malam Berturut-turut
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3"
                    value={preferences.maxNightShiftsConsecutive}
                    onChange={(e) => setPreferences(prev => ({
                      ...prev,
                      maxNightShiftsConsecutive: parseInt(e.target.value) || 2
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Seniority Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Star className="w-4 h-4 inline mr-2" />
                  Level Senioritas (0 = Junior, 10 = Senior)
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={preferences.seniorityLevel}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    seniorityLevel: parseInt(e.target.value)
                  }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Junior (0)</span>
                  <span>Current: {preferences.seniorityLevel}</span>
                  <span>Senior (10)</span>
                </div>
              </div>

              {/* Unavailable Dates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Tanggal Tidak Tersedia
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      if (e.target.value) {
                        addUnavailableDate(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {preferences.unavailableDates.map(date => (
                    <span
                      key={date}
                      className="inline-flex items-center px-3 py-1 bg-red-50 text-red-700 text-sm rounded-full"
                    >
                      {new Date(date).toLocaleDateString('id-ID')}
                      <button
                        onClick={() => removeUnavailableDate(date)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {loading ? 'Menyimpan...' : 'Simpan Preferensi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeePreferencesModal;
