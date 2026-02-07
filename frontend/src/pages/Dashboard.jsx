import { useEffect, useState } from 'react';
import api from '../api';
import ChatBot from '../components/ChatBot';
import { BarChart, Bar, Line, ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download } from 'lucide-react';

export default function Dashboard() {
  const [subs, setSubs] = useState([]);
  const [scanning, setScanning] = useState(false);

  const fetchData = async () => {
    try {
        const res = await api.get('/subscriptions');
        // Add Mock Forecast Logic for Visualization
        const dataWithForecast = res.data.map(sub => ({
            ...sub,
            forecast: sub.cost * 1.1 // Predict 10% increase next month
        }));
        setSubs(dataWithForecast);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleScan = async () => {
    setScanning(true);
    await api.post('/scan');
    setTimeout(() => {
        fetchData();
        setScanning(false);
        alert("Deep Scan Complete! New apps detected.");
    }, 4000);
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
            <button 
                onClick={handleScan} 
                disabled={scanning}
                className={`px-6 py-2 rounded text-white font-bold shadow-sm ${scanning ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
                {scanning ? "AI Scanning..." : "Auto-Scan Ecosystem"}
            </button>
        </div>
      </div>

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
            <h3 className="text-gray-500 font-medium">Forecasted Spend (Next Month)</h3>
            <p className="text-4xl font-bold text-purple-600 mt-2">${(totalSpend * 1.1).toFixed(2)}</p>
        </div>
      </div>

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

      <ChatBot /> {/* Floating AI Widget */}
    </div>
  );
}