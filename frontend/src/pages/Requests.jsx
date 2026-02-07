import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Check, X, Coffee, Calendar, Monitor, ShoppingCart } from 'lucide-react';

export default function Requests() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [requests, setRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('software');
    const [details, setDetails] = useState({});

    const fetchRequests = () => api.get('/requests').then(res => setRequests(res.data));
    useEffect(() => { fetchRequests(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await api.post('/requests', { type: activeTab, details });
        alert("Request Sent!");
        setDetails({});
        fetchRequests();
    };

    const handleDecision = async (id, action) => {
        const note = action === 'reject' ? prompt("Reason for rejection?") : null;
        await api.put(`/requests/${id}/${action}?note=${note || ''}`);
        fetchRequests();
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">{isAdmin ? "Admin Approval Queue" : "My Office Requests"}</h1>
            
            {!isAdmin && (
                <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
                    <div className="flex gap-4 mb-6 border-b pb-2">
                        {['software', 'leave', 'food', 'grocery'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-2 px-2 capitalize font-medium ${activeTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}>{tab}</button>
                        ))}
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        {activeTab === 'software' && (
                            <>
                                <input placeholder="Tool Name (e.g. Figma)" className="border p-2 rounded" onChange={e => setDetails({...details, name: e.target.value})} required />
                                <input type="number" placeholder="Cost ($)" className="border p-2 rounded" onChange={e => setDetails({...details, cost: e.target.value})} required />
                            </>
                        )}
                        {activeTab === 'leave' && (
                            <>
                                <input type="date" className="border p-2 rounded" onChange={e => setDetails({...details, start: e.target.value})} required />
                                <input type="date" className="border p-2 rounded" onChange={e => setDetails({...details, end: e.target.value})} required />
                                <input placeholder="Reason" className="border p-2 rounded" onChange={e => setDetails({...details, reason: e.target.value})} />
                            </>
                        )}
                        {(activeTab === 'food' || activeTab === 'grocery') && (
                            <>
                                <input placeholder="Items" className="border p-2 rounded" onChange={e => setDetails({...details, items: e.target.value})} required />
                                <input type="number" placeholder="Total Cost ($)" className="border p-2 rounded" onChange={e => setDetails({...details, cost: e.target.value})} required />
                            </>
                        )}
                        <button className="bg-indigo-600 text-white p-2 rounded font-bold">Submit Request</button>
                    </form>
                </div>
            )}

            <div className="grid gap-4">
                {requests.map((req) => (
                    <div key={req.id} className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${req.type === 'leave' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                {req.type === 'software' && <Monitor size={20} />}
                                {req.type === 'leave' && <Calendar size={20} />}
                                {req.type === 'food' && <Coffee size={20} />}
                                {req.type === 'grocery' && <ShoppingCart size={20} />}
                            </div>
                            <div>
                                <h3 className="font-bold capitalize">{req.type} Request</h3>
                                <p className="text-sm text-gray-500">
                                    {req.type === 'software' && `${req.details.name} - $${req.details.cost}`}
                                    {req.type === 'leave' && `${req.details.start} to ${req.details.end}`}
                                    {(req.type === 'food' || req.type === 'grocery') && `${req.details.items} - $${req.details.cost}`}
                                </p>
                                {req.admin_note && <p className="text-xs text-red-500 mt-1">Note: {req.admin_note}</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${req.status === 'Approved' ? 'bg-green-100 text-green-700' : req.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{req.status}</span>
                            {isAdmin && req.status === 'Pending' && (
                                <div className="flex gap-2">
                                    <button onClick={() => handleDecision(req.id, 'approve')} className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100"><Check size={18}/></button>
                                    <button onClick={() => handleDecision(req.id, 'reject')} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"><X size={18}/></button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}