import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Users, BarChart3, Award, Clock, AlertTriangle } from 'lucide-react';

interface WorkloadAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  location?: string;
  month?: number;
  year?: number;
}

interface EmployeeWorkload {
  userId: number;
  name: string;
  totalShifts: number;
  pagiShifts: number;
  siangShifts: number;
  malamShifts: number;
  consecutiveDays: number;
  consecutiveNightShifts: number;
  fairnessScore: number;
  seniorityLevel: number;
  isOverloaded: boolean;
  isUnderloaded: boolean;
}

const WorkloadAnalysisModal: React.FC<WorkloadAnalysisModalProps> = ({
  isOpen,
  onClose,
  location,
  month,
  year
}) => {
  const [workloadData, setWorkloadData] = useState<EmployeeWorkload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('fairnessScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (isOpen) {
      fetchWorkloadAnalysis();
    }
  }, [isOpen, location, month, year]);

  const fetchWorkloadAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      let queryParams = new URLSearchParams();
      if (location) queryParams.append('location', location);
      if (month) queryParams.append('month', month.toString());
      if (year) queryParams.append('year', year.toString());
      
      const response = await fetch(
        `${apiUrl}/employee-preferences/workload-analysis?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setWorkloadData(result.data || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Gagal memuat analisis beban kerja');
      }
    } catch (error) {
      console.error('Error fetching workload analysis:', error);
      setError('Gagal memuat analisis beban kerja');
    } finally {
      setLoading(false);
    }
  };

  const sortedData = [...workloadData].sort((a, b) => {
    let aValue = a[sortBy as keyof EmployeeWorkload];
    let bValue = b[sortBy as keyof EmployeeWorkload];
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = (bValue as string).toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const getWorkloadStatus = (employee: EmployeeWorkload) => {
    if (employee.isOverloaded) {
      return { status: 'Overloaded', color: 'text-red-600 bg-red-50', icon: AlertTriangle };
    } else if (employee.isUnderloaded) {
      return { status: 'Underloaded', color: 'text-yellow-600 bg-yellow-50', icon: TrendingUp };
    } else {
      return { status: 'Balanced', color: 'text-green-600 bg-green-50', icon: BarChart3 };
    }
  };

  const getFairnessColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeniorityBadge = (level: number) => {
    if (level >= 8) return { label: 'Senior', color: 'bg-purple-100 text-purple-800' };
    if (level >= 5) return { label: 'Mid-level', color: 'bg-blue-100 text-blue-800' };
    return { label: 'Junior', color: 'bg-gray-100 text-gray-800' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              <div>
                <h2 className="text-xl font-semibold">Analisis Beban Kerja</h2>
                <p className="text-sm text-gray-600">
                  {location ? `${location} - ` : ''}
                  {month && year ? new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : 'Semua Periode'}
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
            <>
              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Total Pegawai</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">
                    {workloadData.length}
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Balanced</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600 mt-1">
                    {workloadData.filter(e => !e.isOverloaded && !e.isUnderloaded).length}
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Overloaded</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600 mt-1">
                    {workloadData.filter(e => e.isOverloaded).length}
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Underloaded</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600 mt-1">
                    {workloadData.filter(e => e.isUnderloaded).length}
                  </div>
                </div>
              </div>

              {/* Sort Controls */}
              <div className="flex gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Urutkan berdasarkan:
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="fairnessScore">Fairness Score</option>
                    <option value="totalShifts">Total Shift</option>
                    <option value="seniorityLevel">Seniority Level</option>
                    <option value="name">Nama</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Urutan:
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="desc">Tertinggi ke Terendah</option>
                    <option value="asc">Terendah ke Tertinggi</option>
                  </select>
                </div>
              </div>

              {/* Employee Workload Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Pegawai
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                        Seniority
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                        Total Shift
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                        Pagi/Siang/Malam
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                        Berturut-turut
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                        Fairness Score
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((employee) => {
                      const workloadStatus = getWorkloadStatus(employee);
                      const seniorityBadge = getSeniorityBadge(employee.seniorityLevel);
                      const StatusIcon = workloadStatus.icon;

                      return (
                        <tr key={employee.userId} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3">
                            <div className="font-medium text-gray-900">{employee.name}</div>
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${seniorityBadge.color}`}>
                              {seniorityBadge.label}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              Level {employee.seniorityLevel}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">
                            <span className="font-semibold text-lg">{employee.totalShifts}</span>
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">
                            <div className="text-sm">
                              <span className="text-yellow-600">{employee.pagiShifts}</span> / 
                              <span className="text-blue-600 mx-1">{employee.siangShifts}</span> / 
                              <span className="text-purple-600">{employee.malamShifts}</span>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">
                            <div className="text-sm">
                              <div>Hari: {employee.consecutiveDays}</div>
                              <div className="text-purple-600">Malam: {employee.consecutiveNightShifts}</div>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">
                            <div className={`font-semibold text-lg ${getFairnessColor(employee.fairnessScore)}`}>
                              {employee.fairnessScore.toFixed(1)}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${workloadStatus.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {workloadStatus.status}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {workloadData.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  Tidak ada data beban kerja yang tersedia
                </div>
              )}
            </>
          )}

          <div className="flex justify-end mt-6 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkloadAnalysisModal;
