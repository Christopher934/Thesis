'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
    Calendar, 
    Clock, 
    MapPin, 
    Users, 
    Plus, 
    Search,
    Filter,
    Eye,
    Edit,
    Trash2
} from 'lucide-react';

// Types
interface User {
    id: string;
    namaDepan: string;
    namaBelakang: string;
    email: string;
    role: string;
    employeeId: string;
}

interface Shift {
    id: string;
    userId: string;
    tanggal: string;
    jamMulai: string;
    jamSelesai: string;
    lokasi: string;
    tipeShift: string;
    status: string;
    user?: User;
}

interface ShiftFormData {
    userId: string;
    tanggal: string;
    jamMulai: string;
    jamSelesai: string;
    lokasi: string;
    tipeShift: string;
}

const ManagemenJadwalPage: React.FC = () => {
    // States
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    
    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [filterShift, setFilterShift] = useState('');
    const [filterDate, setFilterDate] = useState('');
    
    // Form data
    const [formData, setFormData] = useState<ShiftFormData>({
        userId: '',
        tanggal: '',
        jamMulai: '',
        jamSelesai: '',
        lokasi: '',
        tipeShift: ''
    });

    // Constants
    const LOCATIONS = ['ICU', 'IGD', 'Rawat Inap', 'Rawat Jalan', 'Laboratorium', 'Radiologi', 'Farmasi'];
    const SHIFT_TYPES = [
        { value: 'PAGI', label: 'Pagi (07:00-15:00)' },
        { value: 'SIANG', label: 'Siang (15:00-23:00)' },
        { value: 'MALAM', label: 'Malam (23:00-07:00)' }
    ];

    // Load data
    useEffect(() => {
        loadShifts();
        loadUsers();
    }, []);

    const loadShifts = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/shifts');
            const data = await response.json();
            
            if (data.success) {
                setShifts(data.data || []);
            } else {
                toast.error('Gagal memuat data jadwal');
            }
        } catch (error) {
            console.error('Error loading shifts:', error);
            toast.error('Terjadi kesalahan saat memuat data');
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const response = await fetch('/api/users');
            const data = await response.json();
            
            if (data.success) {
                setUsers(data.data || []);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const url = editingShift ? `/api/shifts/${editingShift.id}` : '/api/shifts';
            const method = editingShift ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(editingShift ? 'Jadwal berhasil diupdate' : 'Jadwal berhasil ditambahkan');
                setShowModal(false);
                setEditingShift(null);
                resetForm();
                loadShifts();
            } else {
                toast.error(data.error || 'Gagal menyimpan jadwal');
            }
        } catch (error) {
            console.error('Error saving shift:', error);
            toast.error('Terjadi kesalahan saat menyimpan');
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            userId: '',
            tanggal: '',
            jamMulai: '',
            jamSelesai: '',
            lokasi: '',
            tipeShift: ''
        });
    };

    // Handle edit
    const handleEdit = (shift: Shift) => {
        setEditingShift(shift);
        setFormData({
            userId: shift.userId,
            tanggal: shift.tanggal,
            jamMulai: shift.jamMulai,
            jamSelesai: shift.jamSelesai,
            lokasi: shift.lokasi,
            tipeShift: shift.tipeShift
        });
        setShowModal(true);
    };

    // Handle delete
    const handleDelete = async (shiftId: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
            return;
        }

        try {
            const response = await fetch(`/api/shifts/${shiftId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Jadwal berhasil dihapus');
                loadShifts();
            } else {
                toast.error('Gagal menghapus jadwal');
            }
        } catch (error) {
            console.error('Error deleting shift:', error);
            toast.error('Terjadi kesalahan saat menghapus');
        }
    };

    // Filter shifts
    const filteredShifts = shifts.filter(shift => {
        const matchesSearch = searchTerm === '' || 
            shift.user?.namaDepan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shift.user?.namaBelakang?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesLocation = filterLocation === '' || shift.lokasi === filterLocation;
        const matchesShift = filterShift === '' || shift.tipeShift === filterShift;
        const matchesDate = filterDate === '' || shift.tanggal === filterDate;
        
        return matchesSearch && matchesLocation && matchesShift && matchesDate;
    });

    // Format date
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('id-ID');
        } catch {
            return dateString;
        }
    };

    // Get user name
    const getUserName = (userId: string) => {
        const user = users.find(u => u.id === userId);
        return user ? `${user.namaDepan} ${user.namaBelakang}` : 'Unknown User';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Manajemen Jadwal</h1>
                            <p className="text-gray-600 mt-1">Kelola jadwal shift pegawai rumah sakit</p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowBulkModal(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                            >
                                <Calendar className="w-4 h-4" />
                                <span>Bulk Scheduling</span>
                            </button>
                            <button
                                onClick={() => {
                                    setEditingShift(null);
                                    resetForm();
                                    setShowModal(true);
                                }}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Tambah Jadwal</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white shadow-sm border-b">
                <div className="px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Search className="w-4 h-4 inline mr-1" />
                                Cari Pegawai
                            </label>
                            <input
                                type="text"
                                placeholder="Nama pegawai..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                Lokasi
                            </label>
                            <select
                                value={filterLocation}
                                onChange={(e) => setFilterLocation(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Semua Lokasi</option>
                                {LOCATIONS.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Shift
                            </label>
                            <select
                                value={filterShift}
                                onChange={(e) => setFilterShift(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Semua Shift</option>
                                {SHIFT_TYPES.map(shift => (
                                    <option key={shift.value} value={shift.value}>{shift.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Tanggal
                            </label>
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                <div className="bg-white rounded-lg shadow-sm">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-600 mt-4">Memuat data jadwal...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Pegawai
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tanggal
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Waktu
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Lokasi
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Shift
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredShifts.map((shift) => (
                                        <tr key={shift.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                            <Users className="w-5 h-5 text-gray-500" />
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {getUserName(shift.userId)}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {shift.user?.employeeId || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(shift.tanggal)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {shift.jamMulai} - {shift.jamSelesai}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {shift.lokasi}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    shift.tipeShift === 'PAGI' ? 'bg-yellow-100 text-yellow-800' :
                                                    shift.tipeShift === 'SIANG' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-purple-100 text-purple-800'
                                                }`}>
                                                    {shift.tipeShift}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    {shift.status || 'Aktif'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(shift)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(shift.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredShifts.length === 0 && (
                                <div className="text-center py-12">
                                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">Tidak ada jadwal yang ditemukan</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">
                            {editingShift ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
                        </h3>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pegawai
                                    </label>
                                    <select
                                        value={formData.userId}
                                        onChange={(e) => setFormData({...formData, userId: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">Pilih Pegawai</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.namaDepan} {user.namaBelakang}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tanggal
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.tanggal}
                                        onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Jam Mulai
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.jamMulai}
                                            onChange={(e) => setFormData({...formData, jamMulai: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Jam Selesai
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.jamSelesai}
                                            onChange={(e) => setFormData({...formData, jamSelesai: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Lokasi
                                    </label>
                                    <select
                                        value={formData.lokasi}
                                        onChange={(e) => setFormData({...formData, lokasi: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">Pilih Lokasi</option>
                                        {LOCATIONS.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tipe Shift
                                    </label>
                                    <select
                                        value={formData.tipeShift}
                                        onChange={(e) => setFormData({...formData, tipeShift: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">Pilih Tipe Shift</option>
                                        {SHIFT_TYPES.map(shift => (
                                            <option key={shift.value} value={shift.value}>{shift.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingShift(null);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {editingShift ? 'Update' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Schedule Modal Placeholder */}
            {showBulkModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
                        <h3 className="text-lg font-semibold mb-4">Bulk Scheduling</h3>
                        <div className="text-center py-8">
                            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Fitur Bulk Scheduling akan segera tersedia</p>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowBulkModal(false)}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagemenJadwalPage;
