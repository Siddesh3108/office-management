import { useEffect, useState } from 'react';
import api from '../api';
import ChatBot from '../components/Chatbot';
import { BarChart, Bar, Line, ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, UploadCloud } from 'lucide-react'; // Make sure to install lucide-react

export default function Dashboard() {
  const [subs, setSubs] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    try {
        const res = await api.get('/subscriptions');
        const dataWithForecast = res.data.map(sub => ({
            ...sub,
            forecast: sub.cost * 1.1 
        }));
        setSubs(dataWithForecast);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  // NEW: File Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
        alert("Please upload a PDF file.");
        return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
        await api.post('/upload-invoice', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert("Invoice uploaded! AI is processing it. Data will refresh shortly.");
        
        // Simple polling to refresh data after 5 seconds
        setTimeout(() => {
            fetchData();
            setUploading(false);
        }, 5000);
        
    } catch (err) {
        console.error(err);
        alert("Upload failed.");
        setUploading(false);
    }
  };

  const handleExport = async () => {
    const response = await api.get('/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'license_report.csv');
    document.body.appendChild(link);
    link.click();
  };

  const totalSpend = subs.reduce((acc, curr) => acc + curr.cost, 0);

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Command Center</h1>
        <div className="flex gap-3">
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
                <Download size={18} /> Export CSV
            </button>
            
            {/* NEW UPLOAD BUTTON */}
            <div className="relative">
                <input 
                    type="file" 
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                />
                <button 
                    className={`flex items-center gap-2 px-6 py-2 rounded text-white font-bold shadow-sm transition
                        ${uploading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                    <UploadCloud size={20} />
                    {uploading ? "Analyzing..." : "Upload Invoice (PDF)"}
                </button>
            </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 font-medium">Monthly Burn Rate</h3>
            <p className="text-4xl font-bold text-gray-900 mt-2">${totalSpend.toFixed(2)}</p>
            <span className="text-xs text-red-500 font-semibold">↑ 12% vs last month</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 font-medium">Active Licenses</h3>
            <p className="text-4xl font-bold text-blue-600 mt-2">{subs.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 font-medium">Forecasted Spend</h3>
            <p className="text-4xl font-bold text-purple-600 mt-2">${(totalSpend * 1.1).toFixed(2)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
        <h3 className="text-lg font-bold mb-6 text-gray-800">Spend Velocity & Forecast</h3>
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={subs}>
                <XAxis dataKey="name" tick={{fill: '#6b7280'}} />
                <YAxis tick={{fill: '#6b7280'}} />
                <Tooltip 
                    contentStyle={{backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', border: 'none'}} 
                    itemStyle={{color: '#e5e7eb'}}
                />
                <Legend />
                <Bar dataKey="cost" name="Current Spend" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                <Line type="monotone" dataKey="forecast" name="AI Forecast" stroke="#ec4899" strokeWidth={3} dot={{r: 4}} />
            </ComposedChart>
        </ResponsiveContainer>
      </div>

      <ChatBot />
    </div>
  );
}