import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, TrendingUp, Users, Calendar, Clock, BarChart3 } from 'lucide-react';

interface ShiftRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (requirements: any) => void;
  location: string;
  month: number;
  year: number;
}

const ShiftRequirementsModal: React.FC<ShiftRequirementsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  location,
  month,
  year
}) => {
  const [requirements, setRequirements] = useState({
    location: location,
    month: month,
    year: year,
    pagiQuota: 3,
    siangQuota: 3,
    malamQuota: 2,
    minSeniorStaff: 1,
    maxJuniorRatio: 0.5,
    priorityScore: 1.0,
    specialRequirements: ''
  });

  const [existingRequirements, setExistingRequirements] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchExistingRequirements();
    }
  }, [isOpen, location, month, year]);

  const fetchExistingRequirements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(
        `${apiUrl}/employee-preferences/shift-requirements?location=${location}&month=${month}&year=${year}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setExistingRequirements(result.data);
          setRequirements({
            ...requirements,
            ...result.data
          });
        }
      }
    } catch (error) {
      console.error('Error fetching requirements:', error);
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
      
      const response = await fetch(`${apiUrl}/employee-preferences/shift-requirements`, {
        method: existingRequirements ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requirements),
      });

      if (response.ok) {
        const result = await response.json();
        onSave(result.data);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Gagal menyimpan persyaratan shift');
      }
    } catch (error) {
      console.error('Error saving requirements:', error);
      setError('Gagal menyimpan persyaratan shift');
    } finally {
      setLoading(false);
    }
  };

  const getTotalQuota = () => {
    return requirements.pagiQuota + requirements.siangQuota + requirements.malamQuota;
  };

  const getMaxJuniorStaff = () => {
    return Math.floor(getTotalQuota() * requirements.maxJuniorRatio);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              <div>
                <h2 className="text-xl font-semibold">Persyaratan Shift</h2>
                <p className="text-sm text-gray-600">
                  {location} - {new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quota Per Shift */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Kuota Pegawai per Shift
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Shift Pagi (06:00-14:00)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={requirements.pagiQuota}
                      onChange={(e) => setRequirements(prev => ({
                        ...prev,
                        pagiQuota: parseInt(e.target.value) || 1
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Shift Siang (14:00-22:00)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={requirements.siangQuota}
                      onChange={(e) => setRequirements(prev => ({
                        ...prev,
                        siangQuota: parseInt(e.target.value) || 1
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Shift Malam (22:00-06:00)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={requirements.malamQuota}
                      onChange={(e) => setRequirements(prev => ({
                        ...prev,
                        malamQuota: parseInt(e.target.value) || 1
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700">
                    <BarChart3 className="w-4 h-4" />
                    <span className="font-medium">Total Quota: {getTotalQuota()} pegawai per hari</span>
                  </div>
                </div>
              </div>

              {/* Staff Requirements */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Persyaratan Kualifikasi Staff
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Staff Senior per Shift
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={getTotalQuota()}
                      value={requirements.minSeniorStaff}
                      onChange={(e) => setRequirements(prev => ({
                        ...prev,
                        minSeniorStaff: parseInt(e.target.value) || 0
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maksimal Rasio Staff Junior (0.0 - 1.0)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={requirements.maxJuniorRatio}
                      onChange={(e) => setRequirements(prev => ({
                        ...prev,
                        maxJuniorRatio: parseFloat(e.target.value) || 0.5
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <div className="text-green-700 text-sm">
                    <strong>Maksimal Staff Junior: {getMaxJuniorStaff()} pegawai</strong>
                    <br />
                    Berdasarkan rasio {(requirements.maxJuniorRatio * 100).toFixed(0)}% dari total {getTotalQuota()} pegawai
                  </div>
                </div>
              </div>

              {/* Priority and Special Requirements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Skor Prioritas (1.0 = Normal, 2.0 = Tinggi)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={requirements.priorityScore}
                    onChange={(e) => setRequirements(prev => ({
                      ...prev,
                      priorityScore: parseFloat(e.target.value) || 1.0
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Persyaratan Khusus (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={requirements.specialRequirements}
                  onChange={(e) => setRequirements(prev => ({
                    ...prev,
                    specialRequirements: e.target.value
                  }))}
                  placeholder="Contoh: Memerlukan pegawai dengan sertifikasi khusus, pengalaman minimal 2 tahun, dll."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
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
              {loading ? 'Menyimpan...' : 'Simpan Persyaratan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftRequirementsModal;
