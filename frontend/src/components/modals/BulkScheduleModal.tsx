'use client';

import React, { useState } from 'react';
import { Calendar, X, ArrowRight, ArrowLeft, CheckCircle, Clock, Users, MapPin, Eye, Loader2 } from 'lucide-react';

interface BulkScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BulkScheduleConfig {
  scheduleType: 'weekly' | 'monthly';
  startDate: string;
  locations: string[];
  staffPattern: {
    [location: string]: {
      PAGI?: { DOKTER?: number; PERAWAT?: number; STAFF?: number };
      SIANG?: { DOKTER?: number; PERAWAT?: number; STAFF?: number };
      MALAM?: { DOKTER?: number; PERAWAT?: number; STAFF?: number };
    };
  };
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

const BulkScheduleModal: React.FC<BulkScheduleModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState<'config' | 'preview' | 'done'>('config');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<BulkScheduleConfig>({
    scheduleType: 'weekly',
    startDate: '',
    locations: [],
    staffPattern: {},
    priority: 'NORMAL'
  });
  const [previewData, setPreviewData] = useState<any>(null);
  const [editablePreview, setEditablePreview] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const availableLocations = ['ICU', 'IGD', 'FARMASI', 'LABORATORIUM', 'RADIOLOGI', 'BEDAH'];

  const handleConfigSubmit = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token tidak ditemukan');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      // Convert config to format expected by preview-optimal-shifts API
      const startDate = new Date(config.startDate);
      const endDate = new Date(config.startDate);
      if (config.scheduleType === 'weekly') {
        endDate.setDate(startDate.getDate() + 7);
      } else {
        endDate.setMonth(startDate.getMonth() + 1);
      }

      const requestBody = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        schedulingType: config.scheduleType,
        locations: config.locations,
        priority: config.priority,
        staffPattern: config.staffPattern
      };

      // Use the preview-optimal-shifts API for consistent preview
      const response = await fetch(`${apiUrl}/admin/shift-optimization/preview-optimal-shifts`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
        // Initialize editable preview with the data
        setEditablePreview(data.preview || []);
        setCurrentStep('preview');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate preview');
      }
    } catch (error: any) {
      alert('Error generating preview: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalConfirmation = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token tidak ditemukan');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      if (!editablePreview || editablePreview.length === 0) {
        throw new Error('Tidak ada data preview untuk dikonfirmasi');
      }

      // Convert editable preview data to assignments format
      const assignments = editablePreview.map((assignment: any) => ({
        userId: assignment.userId,
        date: assignment.date,
        location: assignment.location,
        shiftType: assignment.shiftType,
        priority: assignment.priority || config.priority,
        score: assignment.score
      }));

      // Use the confirm-shifts API for creating schedules
      const response = await fetch(`${apiUrl}/admin/shift-optimization/confirm-shifts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignments,
          metadata: {
            source: 'bulk-scheduling-workflow',
            originalConfig: config,
            editedAssignments: editablePreview.length,
            timestamp: new Date().toISOString()
          }
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        // Update preview data with creation results
        setPreviewData({
          ...previewData,
          creationResult: result,
          totalShifts: result.summary?.totalCreated || assignments.length
        });
        setCurrentStep('done');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create schedules');
      }
    } catch (error: any) {
      alert('Error creating schedules: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationToggle = (location: string) => {
    const newLocations = config.locations.includes(location)
      ? config.locations.filter(l => l !== location)
      : [...config.locations, location];
    
    setConfig({ ...config, locations: newLocations });
  };

  const updateStaffPattern = (location: string, shift: string, role: string, count: number) => {
    const newPattern = { ...config.staffPattern };
    if (!newPattern[location]) newPattern[location] = {};
    if (!newPattern[location][shift]) newPattern[location][shift] = {};
    newPattern[location][shift][role] = count;
    
    setConfig({ ...config, staffPattern: newPattern });
  };

  // Functions for editing preview data
  const handleEditAssignment = (index: number, field: string, value: any) => {
    const updatedPreview = [...editablePreview];
    updatedPreview[index] = {
      ...updatedPreview[index],
      [field]: value
    };
    setEditablePreview(updatedPreview);
  };

  const handleDeleteAssignment = (index: number) => {
    const updatedPreview = editablePreview.filter((_, i) => i !== index);
    setEditablePreview(updatedPreview);
  };

  const handleAddAssignment = () => {
    const newAssignment = {
      userId: '',
      userName: '',
      userRole: 'PERAWAT',
      date: config.startDate,
      location: config.locations[0] || '',
      shiftType: 'PAGI',
      score: 100.0
    };
    setEditablePreview([...editablePreview, newAssignment]);
    setEditingIndex(editablePreview.length);
  };

  const recalculateStats = () => {
    const totalRequested = editablePreview.length;
    const totalAssigned = editablePreview.filter(a => a.userId).length;
    const fulfillmentRate = totalRequested > 0 ? (totalAssigned / totalRequested) * 100 : 100;
    
    return {
      totalRequested,
      totalAssigned,
      fulfillmentRate,
      conflicts: []
    };
  };

  const renderConfigurationStep = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <Calendar className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Step 1: Konfigurasi Bulk Scheduling
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              Atur periode, lokasi, dan pola staff untuk jadwal yang akan dibuat
            </p>
          </div>
        </div>
      </div>

      {/* Schedule Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Jenis Jadwal
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="scheduleType"
              value="weekly"
              checked={config.scheduleType === 'weekly'}
              onChange={(e) => setConfig({...config, scheduleType: e.target.value as 'weekly' | 'monthly'})}
              className="mr-2"
            />
            📅 Mingguan (7 hari)
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="scheduleType"
              value="monthly"
              checked={config.scheduleType === 'monthly'}
              onChange={(e) => setConfig({...config, scheduleType: e.target.value as 'weekly' | 'monthly'})}
              className="mr-2"
            />
            📆 Bulanan (30 hari)
          </label>
        </div>
      </div>

      {/* Start Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📅 Tanggal Mulai
        </label>
        <input
          type="date"
          value={config.startDate}
          onChange={(e) => setConfig({...config, startDate: e.target.value})}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Locations */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          🏥 Pilih Lokasi
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {availableLocations.map(location => (
            <label key={location} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={config.locations.includes(location)}
                onChange={() => handleLocationToggle(location)}
                className="mr-3"
              />
              <span className="text-sm font-medium">{location}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Staff Pattern (simplified) */}
      {config.locations.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            👥 Pola Staff per Shift
          </label>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-3">
              Gunakan pola default atau akan dikonfigurasi otomatis berdasarkan ketersediaan staff
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-yellow-100 p-3 rounded">
                <div className="font-medium text-yellow-800">🌅 PAGI</div>
                <div className="text-sm text-yellow-600">06:00 - 14:00</div>
              </div>
              <div className="bg-orange-100 p-3 rounded">
                <div className="font-medium text-orange-800">☀️ SIANG</div>
                <div className="text-sm text-orange-600">14:00 - 22:00</div>
              </div>
              <div className="bg-blue-100 p-3 rounded">
                <div className="font-medium text-blue-800">🌙 MALAM</div>
                <div className="text-sm text-blue-600">22:00 - 06:00</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ⚡ Prioritas
        </label>
        <select
          value={config.priority}
          onChange={(e) => setConfig({...config, priority: e.target.value as any})}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="LOW">🟢 Low - Normal scheduling</option>
          <option value="NORMAL">🔵 Normal - Standard priority</option>
          <option value="HIGH">🟡 High - Priority scheduling</option>
          <option value="URGENT">🔴 Urgent - Immediate processing</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-4 border-t">
        <button
          onClick={onClose}
          className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Batal
        </button>
        <button
          onClick={handleConfigSubmit}
          disabled={isLoading || !config.startDate || config.locations.length === 0}
          className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" />
              Generating Preview...
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Buat Preview
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    const currentStats = recalculateStats();
    
    return (
      <div className="space-y-6">
        <div className="bg-purple-50 border-l-4 border-purple-400 p-4">
          <div className="flex">
            <Eye className="h-5 w-5 text-purple-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-purple-800">
                Step 2: Preview & Edit Jadwal
              </h3>
              <p className="mt-1 text-sm text-purple-700">
                Tinjau, edit, dan sesuaikan jadwal sebelum membuat secara permanent
              </p>
            </div>
          </div>
        </div>

        {/* Live Preview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">
              {currentStats.totalRequested}
            </div>
            <div className="text-sm text-blue-800">Total Jadwal</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              {currentStats.totalAssigned}
            </div>
            <div className="text-sm text-green-800">Terisi</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {currentStats.conflicts.length}
            </div>
            <div className="text-sm text-yellow-800">Konflik</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">
              {currentStats.fulfillmentRate.toFixed(1)}%
            </div>
            <div className="text-sm text-purple-800">Pemenuhan</div>
          </div>
        </div>

        {/* Editable Assignments Table */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-800">📋 Jadwal yang Akan Dibuat (Dapat Diedit)</h4>
            <button
              onClick={handleAddAssignment}
              className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
            >
              <Users className="w-4 h-4" />
              Tambah Assignment
            </button>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">EMPLOYEE</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ROLE</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">DATE</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">LOCATION</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SHIFT</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SCORE</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {editablePreview.map((assignment: any, index: number) => (
                  <tr key={index} className={editingIndex === index ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-2">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          value={assignment.userName || ''}
                          onChange={(e) => handleEditAssignment(index, 'userName', e.target.value)}
                          className="w-full p-1 border rounded text-sm"
                          placeholder="Nama Employee"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{assignment.userName || 'TBD'}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editingIndex === index ? (
                        <select
                          value={assignment.userRole || 'PERAWAT'}
                          onChange={(e) => handleEditAssignment(index, 'userRole', e.target.value)}
                          className="w-full p-1 border rounded text-sm"
                        >
                          <option value="PERAWAT">PERAWAT</option>
                          <option value="DOKTER">DOKTER</option>
                          <option value="STAFF">STAFF</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          assignment.userRole === 'PERAWAT' ? 'bg-blue-100 text-blue-800' :
                          assignment.userRole === 'DOKTER' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {assignment.userRole}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editingIndex === index ? (
                        <input
                          type="date"
                          value={assignment.date || ''}
                          onChange={(e) => handleEditAssignment(index, 'date', e.target.value)}
                          className="w-full p-1 border rounded text-sm"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{assignment.date}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editingIndex === index ? (
                        <select
                          value={assignment.location || ''}
                          onChange={(e) => handleEditAssignment(index, 'location', e.target.value)}
                          className="w-full p-1 border rounded text-sm"
                        >
                          {availableLocations.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-gray-900">{assignment.location}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editingIndex === index ? (
                        <select
                          value={assignment.shiftType || 'PAGI'}
                          onChange={(e) => handleEditAssignment(index, 'shiftType', e.target.value)}
                          className="w-full p-1 border rounded text-sm"
                        >
                          <option value="PAGI">PAGI</option>
                          <option value="SIANG">SIANG</option>
                          <option value="MALAM">MALAM</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          assignment.shiftType === 'PAGI' ? 'bg-yellow-100 text-yellow-800' :
                          assignment.shiftType === 'SIANG' ? 'bg-orange-100 text-orange-800' :
                          assignment.shiftType === 'MALAM' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {assignment.shiftType}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-sm text-gray-900">{assignment.score?.toFixed(2) || '100.00'}</span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        {editingIndex === index ? (
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                          >
                            ✓
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingIndex(index)}
                            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                          >
                            ✏️
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAssignment(index)}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Recommendations */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">💡 Tips Editing:</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>✏️ Klik tombol edit untuk mengubah assignment individual</li>
            <li>🗑️ Hapus assignment yang tidak diperlukan</li>
            <li>➕ Tambah assignment baru jika diperlukan</li>
            <li>📊 Statistik akan update otomatis saat Anda edit</li>
            <li>✅ Pastikan semua field terisi sebelum konfirmasi</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <button
            onClick={() => setCurrentStep('config')}
            className="flex items-center gap-2 px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Konfigurasi
          </button>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              onClick={handleFinalConfirmation}
              disabled={isLoading || editablePreview.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Konfirmasi & Buat Jadwal ({editablePreview.length} assignments)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDoneStep = () => (
    <div className="space-y-6 text-center">
      <div className="bg-green-50 border-l-4 border-green-400 p-4">
        <div className="flex">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              ✅ Jadwal Berhasil Dibuat!
            </h3>
            <p className="mt-1 text-sm text-green-700">
              Bulk scheduling telah selesai diproses
            </p>
          </div>
        </div>
      </div>

      <div className="py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Bulk Scheduling Selesai!
        </h3>
        <p className="text-gray-600 mb-6">
          Jadwal untuk {config.locations.length} lokasi telah berhasil dibuat.<br/>
          Anda dapat melihat hasilnya di halaman manajemen jadwal.
        </p>
        
        <div className="bg-blue-50 p-4 rounded-lg inline-block">
          <p className="text-sm text-blue-800">
            📊 Total jadwal dibuat: <span className="font-bold">{editablePreview.length}</span><br/>
            📍 Lokasi: <span className="font-bold">{config.locations.join(', ')}</span><br/>
            📅 Periode: <span className="font-bold">{config.startDate} ({config.scheduleType})</span><br/>
            ⚡ Tingkat Pemenuhan: <span className="font-bold">{recalculateStats().fulfillmentRate.toFixed(1)}%</span><br/>
            🔍 Konflik: <span className="font-bold">{recalculateStats().conflicts.length}</span><br/>
            ✏️ Editing: <span className="font-bold">Jadwal telah disesuaikan sesuai preferensi admin</span>
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => {
            setCurrentStep('config');
            setConfig({
              scheduleType: 'weekly',
              startDate: '',
              locations: [],
              staffPattern: {},
              priority: 'NORMAL'
            });
            setPreviewData(null);
            setEditablePreview([]);
            setEditingIndex(null);
          }}
          className="px-6 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
        >
          Buat Jadwal Lain
        </button>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Selesai
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[10002]">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">
              📅 Bulk Scheduling
              {currentStep === 'config' && ' - Konfigurasi'}
              {currentStep === 'preview' && ' - Preview'}
              {currentStep === 'done' && ' - Selesai'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${currentStep === 'config' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'config' ? 'bg-blue-100 border-2 border-blue-600' : 'bg-green-100'
              }`}>
                {currentStep === 'config' ? '1' : '✓'}
              </div>
              <span className="text-sm font-medium">Konfigurasi</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-300 mx-4">
              <div className={`h-full transition-all ${currentStep !== 'config' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            </div>
            <div className={`flex items-center gap-2 ${
              currentStep === 'config' ? 'text-gray-400' : 
              currentStep === 'preview' ? 'text-blue-600' : 'text-green-600'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'config' ? 'bg-gray-100' :
                currentStep === 'preview' ? 'bg-blue-100 border-2 border-blue-600' : 'bg-green-100'
              }`}>
                {currentStep === 'config' ? '2' : currentStep === 'preview' ? '2' : '✓'}
              </div>
              <span className="text-sm font-medium">Preview</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-300 mx-4">
              <div className={`h-full transition-all ${currentStep === 'done' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            </div>
            <div className={`flex items-center gap-2 ${currentStep === 'done' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'done' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {currentStep === 'done' ? '✓' : '3'}
              </div>
              <span className="text-sm font-medium">Selesai</span>
            </div>
          </div>
        </div>

        {/* Content */}
        {currentStep === 'config' && renderConfigurationStep()}
        {currentStep === 'preview' && renderPreviewStep()}
        {currentStep === 'done' && renderDoneStep()}
      </div>
    </div>
  );
};

export default BulkScheduleModal;
