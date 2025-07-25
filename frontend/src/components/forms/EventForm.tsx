import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface EventFormData {
  namaEvent: string;
  jenisKegiatan: string;
  deskripsi?: string;
  tanggalMulai: string;
  tanggalSelesai?: string;
  waktuMulai: string;
  waktuSelesai?: string;
  lokasi: string;
  kapasitas?: number;
  lokasiDetail?: string;
  penanggungJawab: string;
  kontak?: string;
  departemen?: string;
  prioritas: string;
  targetPeserta: string[];
  anggaran?: number;
  status: string;
  catatan?: string;
}

const defaultForm: EventFormData = {
  namaEvent: '',
  jenisKegiatan: '',
  deskripsi: '',
  tanggalMulai: '',
  tanggalSelesai: '',
  waktuMulai: '',
  waktuSelesai: '',
  lokasi: '',
  kapasitas: undefined,
  lokasiDetail: '',
  penanggungJawab: '',
  kontak: '',
  departemen: '',
  prioritas: 'sedang',
  targetPeserta: [],
  anggaran: undefined,
  status: 'draft',
  catatan: '',
};

interface EventFormProps {
  onSuccess?: () => void;
  eventId?: number;
  initialData?: Partial<EventFormData>;
}

const EventForm: React.FC<EventFormProps> = ({ onSuccess, eventId, initialData }) => {
  const [form, setForm] = useState<EventFormData>({ ...defaultForm, ...initialData });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    setForm({ ...defaultForm, ...initialData });
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      const checked = target.checked;
      const currentValues = form.targetPeserta;
      
      if (checked) {
        setForm(prev => ({
          ...prev,
          targetPeserta: [...currentValues, value]
        }));
      } else {
        setForm(prev => ({
          ...prev,
          targetPeserta: currentValues.filter(v => v !== value)
        }));
      }
    } else if (type === 'number') {
      setForm(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleRadio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const payload = {
        nama: form.namaEvent,
        jenisKegiatan: form.jenisKegiatan,
        deskripsi: form.deskripsi || '',
        tanggalMulai: form.tanggalMulai ? new Date(form.tanggalMulai + 'T' + (form.waktuMulai || '00:00') + ':00').toISOString() : null,
        tanggalSelesai: form.tanggalSelesai ? new Date(form.tanggalSelesai + 'T' + (form.waktuSelesai || '00:00') + ':00').toISOString() : null,
        waktuMulai: form.waktuMulai || '',
        waktuSelesai: form.waktuSelesai || null,
        lokasi: form.lokasi,
        kapasitas: form.kapasitas === undefined ? null : form.kapasitas,
        lokasiDetail: form.lokasiDetail || null,
        penanggungJawab: form.penanggungJawab,
        kontak: form.kontak || null,
        departemen: form.departemen || null,
        prioritas: form.prioritas,
        targetPeserta: form.targetPeserta,
        anggaran: form.anggaran === undefined ? null : form.anggaran,
        status: form.status,
        catatan: form.catatan || null,
      };
      
      const response = await fetch(`${apiUrl}/events${eventId ? `/${eventId}` : ''}`, {
        method: eventId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to ${eventId ? 'update' : 'create'} event`);
      }

      setSuccess(true);
      if (onSuccess) onSuccess();
      
      if (!eventId) {
        setForm(defaultForm);
      }
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(defaultForm);
    setSuccess(false);
    setApiError(null);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4 overflow-y-auto" style={{maxHeight: '90vh'}}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {eventId ? 'Edit Event / Kegiatan' : 'Tambah Event / Kegiatan Baru'}
              </h1>
              <p className="text-gray-500 text-sm mt-1">Kelola dan jadwalkan event atau kegiatan rumah sakit</p>
            </div>
          </div>
        </div>

        <form className="p-6 space-y-6" onSubmit={handleSubmit} onReset={handleReset}>
          {success && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <span className="text-green-800 text-sm font-medium">
                Berhasil! Event/kegiatan telah berhasil {eventId ? 'diperbarui' : 'ditambahkan'} ke sistem.
              </span>
            </div>
          )}
          
          {apiError && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <span className="text-red-800 text-sm font-medium">Error: {apiError}</span>
            </div>
          )}

          {/* Event Information Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg mr-3">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              Informasi Event / Kegiatan
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">Nama Event/Kegiatan <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="namaEvent" 
                  value={form.namaEvent} 
                  onChange={handleChange} 
                  required 
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                  placeholder="Contoh: Rapat Evaluasi Bulanan" 
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">Jenis Kegiatan <span className="text-red-500">*</span></label>
                <select 
                  name="jenisKegiatan" 
                  value={form.jenisKegiatan} 
                  onChange={handleChange} 
                  required 
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Pilih jenis kegiatan</option>
                  <option value="rapat">Rapat</option>
                  <option value="pelatihan">Pelatihan</option>
                  <option value="seminar">Seminar</option>
                  <option value="workshop">Workshop</option>
                  <option value="evaluasi">Evaluasi</option>
                  <option value="sosialisasi">Sosialisasi</option>
                  <option value="pemeriksaan">Pemeriksaan Kesehatan</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-medium text-gray-700">Deskripsi</label>
                <textarea 
                  name="deskripsi" 
                  value={form.deskripsi || ''} 
                  onChange={handleChange} 
                  rows={3}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                  placeholder="Deskripsi detail event atau kegiatan" 
                />
              </div>
            </div>
          </div>

          {/* Date and Time Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg mr-3">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              Tanggal dan Waktu
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">Tanggal Mulai <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  name="tanggalMulai" 
                  value={form.tanggalMulai} 
                  onChange={handleChange} 
                  min={today} 
                  required 
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">Tanggal Selesai</label>
                <input 
                  type="date" 
                  name="tanggalSelesai" 
                  value={form.tanggalSelesai || ''} 
                  onChange={handleChange} 
                  min={form.tanggalMulai || today} 
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">Waktu Mulai <span className="text-red-500">*</span></label>
                <input 
                  type="time" 
                  name="waktuMulai" 
                  value={form.waktuMulai} 
                  onChange={handleChange} 
                  required 
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">Waktu Selesai</label>
                <input 
                  type="time" 
                  name="waktuSelesai" 
                  value={form.waktuSelesai || ''} 
                  onChange={handleChange} 
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                />
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg mr-3">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              Lokasi
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">Lokasi <span className="text-red-500">*</span></label>
                <select 
                  name="lokasi" 
                  value={form.lokasi} 
                  onChange={handleChange} 
                  required 
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Pilih lokasi</option>
                  <option value="ruang-rapat-utama">Ruang Rapat Utama</option>
                  <option value="aula-rsud">Aula RSUD</option>
                  <option value="ruang-meeting-1">Ruang Meeting 1</option>
                  <option value="ruang-meeting-2">Ruang Meeting 2</option>
                  <option value="ruang-pelatihan">Ruang Pelatihan</option>
                  <option value="auditorium">Auditorium</option>
                  <option value="ruang-direktur">Ruang Direktur</option>
                  <option value="online">Online/Virtual</option>
                  <option value="eksternal">Lokasi Eksternal</option>
                </select>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">Kapasitas Peserta</label>
                <input 
                  type="number" 
                  name="kapasitas" 
                  value={form.kapasitas || ''} 
                  onChange={handleChange} 
                  min={1} 
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                  placeholder="Jumlah maksimal peserta" 
                />
              </div>
              
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-medium text-gray-700">Detail Lokasi/Alamat</label>
                <input 
                  type="text" 
                  name="lokasiDetail" 
                  value={form.lokasiDetail || ''} 
                  onChange={handleChange} 
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                  placeholder="Alamat lengkap jika lokasi eksternal atau detail ruangan" 
                />
              </div>
            </div>
          </div>

          {/* Responsibility Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg mr-3">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              Penanggung Jawab
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">Penanggung Jawab <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="penanggungJawab" 
                  value={form.penanggungJawab} 
                  onChange={handleChange} 
                  required 
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                  placeholder="Nama penanggung jawab" 
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">Kontak</label>
                <input 
                  type="text" 
                  name="kontak" 
                  value={form.kontak || ''} 
                  onChange={handleChange} 
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                  placeholder="Nomor telepon atau email" 
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">Departemen</label>
                <input 
                  type="text" 
                  name="departemen" 
                  value={form.departemen || ''} 
                  onChange={handleChange} 
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                  placeholder="Departemen/Unit kerja" 
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">Prioritas</label>
                <select 
                  name="prioritas" 
                  value={form.prioritas} 
                  onChange={handleChange} 
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="rendah">Rendah</option>
                  <option value="sedang">Sedang</option>
                  <option value="tinggi">Tinggi</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg mr-3">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              Informasi Tambahan
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">Anggaran</label>
                <input 
                  type="number" 
                  name="anggaran" 
                  value={form.anggaran || ''} 
                  onChange={handleChange} 
                  min={0} 
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                  placeholder="Perkiraan anggaran" 
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">Status</label>
                <select 
                  name="status" 
                  value={form.status} 
                  onChange={handleChange} 
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Aktif</option>
                  <option value="completed">Selesai</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>
              
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-medium text-gray-700">Catatan</label>
                <textarea 
                  name="catatan" 
                  value={form.catatan || ''} 
                  onChange={handleChange} 
                  rows={3}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200" 
                  placeholder="Catatan tambahan untuk event ini" 
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
            <button 
              type="reset" 
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : (eventId ? 'Perbarui Event' : 'Buat Event')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;