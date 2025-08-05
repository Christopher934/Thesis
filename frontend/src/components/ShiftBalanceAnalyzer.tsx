// Enhanced Shift Balance Analysis Component
// This component addresses the key issues: variety, rotation, fairness, and distribution

import React, { useState, useEffect } from 'react';
import { AlertTriangle, BarChart3, Calendar, MapPin, Users, TrendingUp, Clock } from 'lucide-react';

interface ShiftBalanceAnalysis {
  userBalanceReport: {
    userId: number;
    userName: string;
    role: string;
    shiftVariety: {
      PAGI: number;
      SIANG: number;
      MALAM: number;
      varietyScore: number; // 0-100, higher = better variety
    };
    locationRotation: {
      locations: string[];
      rotationScore: number; // 0-100, higher = better rotation
    };
    consecutiveDays: number;
    burnoutRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    fairnessScore: number; // 0-100, higher = more fair distribution
  }[];
  systemWideMetrics: {
    averageVarietyScore: number;
    averageRotationScore: number;
    averageFairnessScore: number;
    highBurnoutUsers: number;
    imbalancedDistribution: string[];
  };
  recommendations: {
    type: 'VARIETY' | 'ROTATION' | 'BURNOUT' | 'FAIRNESS';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    message: string;
    affectedUsers: number[];
    suggestedActions: string[];
  }[];
}

interface ShiftBalanceProps {
  isOpen: boolean;
  onClose: () => void;
  onImplementRecommendation: (recommendation: any) => void;
}

export const ShiftBalanceAnalyzer: React.FC<ShiftBalanceProps> = ({
  isOpen,
  onClose,
  onImplementRecommendation
}) => {
  const [analysisData, setAnalysisData] = useState<ShiftBalanceAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [filterByRole, setFilterByRole] = useState<string>('ALL');

  const analyzeShiftBalance = async () => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token tidak ditemukan');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/admin/shift-optimization/analyze-balance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeframe: selectedTimeframe,
          roleFilter: filterByRole !== 'ALL' ? filterByRole : null,
          analysisType: 'comprehensive' // Include variety, rotation, fairness analysis
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal menganalisis keseimbangan shift');
      }

      const result = await response.json();
      setAnalysisData(result);
      
    } catch (error: any) {
      console.error('Balance analysis error:', error);
      // Show error notification
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      analyzeShiftBalance();
    }
  }, [isOpen, selectedTimeframe, filterByRole]);

  const getBurnoutColor = (risk: string) => {
    switch (risk) {
      case 'HIGH': return 'text-red-600 bg-red-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'LOW': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'MEDIUM': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-blue-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Analisis Keseimbangan Shift</h2>
              <p className="opacity-90">Mengatasi masalah variasi, rotasi, dan distribusi shift</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>
          
          {/* Controls */}
          <div className="flex gap-4 mt-4">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className="px-3 py-2 rounded-lg text-gray-800 bg-white"
            >
              <option value="week">Seminggu Terakhir</option>
              <option value="month">Sebulan Terakhir</option>
              <option value="quarter">3 Bulan Terakhir</option>
            </select>
            
            <select
              value={filterByRole}
              onChange={(e) => setFilterByRole(e.target.value)}
              className="px-3 py-2 rounded-lg text-gray-800 bg-white"
            >
              <option value="ALL">Semua Role</option>
              <option value="DOKTER">Dokter</option>
              <option value="PERAWAT">Perawat</option>
              <option value="STAFF">Staff</option>
            </select>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-4 text-gray-600">Menganalisis keseimbangan shift...</span>
            </div>
          ) : analysisData ? (
            <div className="space-y-8">
              {/* System-wide Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                  <div className="flex items-center">
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm text-gray-600">Skor Variasi Rata-rata</p>
                      <p className={`text-2xl font-bold ${getScoreColor(analysisData.systemWideMetrics.averageVarietyScore)}`}>
                        {analysisData.systemWideMetrics.averageVarietyScore}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                  <div className="flex items-center">
                    <MapPin className="w-8 h-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm text-gray-600">Skor Rotasi Rata-rata</p>
                      <p className={`text-2xl font-bold ${getScoreColor(analysisData.systemWideMetrics.averageRotationScore)}`}>
                        {analysisData.systemWideMetrics.averageRotationScore}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm text-gray-600">Skor Keadilan Rata-rata</p>
                      <p className={`text-2xl font-bold ${getScoreColor(analysisData.systemWideMetrics.averageFairnessScore)}`}>
                        {analysisData.systemWideMetrics.averageFairnessScore}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                    <div className="ml-3">
                      <p className="text-sm text-gray-600">Risiko Burnout Tinggi</p>
                      <p className="text-2xl font-bold text-red-600">
                        {analysisData.systemWideMetrics.highBurnoutUsers}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual User Analysis */}
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Users className="w-6 h-6 mr-2" />
                  Analisis Per Pegawai
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left">Pegawai</th>
                        <th className="px-4 py-3 text-center">Variasi Shift</th>
                        <th className="px-4 py-3 text-center">Rotasi Lokasi</th>
                        <th className="px-4 py-3 text-center">Hari Berturut</th>
                        <th className="px-4 py-3 text-center">Risiko Burnout</th>
                        <th className="px-4 py-3 text-center">Skor Keadilan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisData.userBalanceReport.map((user, index) => (
                        <tr key={user.userId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{user.userName}</p>
                              <p className="text-sm text-gray-500">{user.role}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="space-y-1">
                              <p className={`font-bold ${getScoreColor(user.shiftVariety.varietyScore)}`}>
                                {user.shiftVariety.varietyScore}%
                              </p>
                              <div className="text-xs text-gray-600">
                                <span className="bg-yellow-100 px-1 rounded">P:{user.shiftVariety.PAGI}</span>
                                <span className="bg-orange-100 px-1 rounded ml-1">S:{user.shiftVariety.SIANG}</span>
                                <span className="bg-blue-100 px-1 rounded ml-1">M:{user.shiftVariety.MALAM}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <p className={`font-bold ${getScoreColor(user.locationRotation.rotationScore)}`}>
                              {user.locationRotation.rotationScore}%
                            </p>
                            <p className="text-xs text-gray-600">
                              {user.locationRotation.locations.length} lokasi
                            </p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-sm ${
                              user.consecutiveDays > 5 ? 'bg-red-100 text-red-800' :
                              user.consecutiveDays > 3 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {user.consecutiveDays} hari
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-sm font-medium ${getBurnoutColor(user.burnoutRisk)}`}>
                              {user.burnoutRisk}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold ${getScoreColor(user.fairnessScore)}`}>
                              {user.fairnessScore}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Clock className="w-6 h-6 mr-2" />
                  Rekomendasi Perbaikan
                </h3>
                
                <div className="space-y-4">
                  {analysisData.recommendations.map((rec, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            {getSeverityIcon(rec.severity)}
                            <span className="ml-2 font-semibold text-gray-800">{rec.type}</span>
                            <span className={`ml-2 px-2 py-1 rounded text-xs ${
                              rec.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                              rec.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {rec.severity}
                            </span>
                          </div>
                          
                          <p className="text-gray-700 mb-3">{rec.message}</p>
                          
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-600 mb-1">Tindakan yang Disarankan:</p>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {rec.suggestedActions.map((action, actionIndex) => (
                                <li key={actionIndex} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{action}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <p className="text-sm text-gray-600">
                            Mempengaruhi {rec.affectedUsers.length} pegawai
                          </p>
                        </div>
                        
                        <button
                          onClick={() => onImplementRecommendation(rec)}
                          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Terapkan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Tidak ada data analisis tersedia</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
