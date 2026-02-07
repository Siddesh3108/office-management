import { useEffect, useState } from 'react';
import api from '../api';
import { Plus, Trash2, Edit2, Calendar, Tag, DollarSign, X } from 'lucide-react';

export default function Inventory() {
    const [subs, setSubs] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null); // Tracks if we are editing or creating
    
    // Form State
    const [formData, setFormData] = useState({ 
        name: '', 
        cost: '', 
        category: 'SaaS', 
        renewal_date: new Date().toISOString().split('T')[0] 
    });

    // Load Data
    const fetchData = () => {
        api.get('/subscriptions').then(res => setSubs(res.data));
    };

    useEffect(() => { fetchData(); }, []);

    // HANDLE SUBMIT (Create OR Update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { ...formData, cost: parseFloat(formData.cost) };

        try {
            if (editingId) {
                // UPDATE (PUT)
                await api.put(`/subscriptions/${editingId}`, payload);
                alert("Subscription updated!");
            } else {
                // CREATE (POST)
                await api.post('/subscriptions', payload);
            }
            
            // Cleanup
            setIsFormOpen(false);
            setEditingId(null);
            setFormData({ name: '', cost: '', category: 'SaaS', renewal_date: new Date().toISOString().split('T')[0] });
            fetchData(); // Refresh list
        } catch (error) {
            console.error(error);
            alert("Operation failed.");
        }
    };

    // HANDLE DELETE
    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this subscription?")) {
            try {
                await api.delete(`/subscriptions/${id}`);
                fetchData(); // Refresh list immediately
            } catch (error) {
                alert("Failed to delete.");
            }
        }
    };

    // HANDLE EDIT CLICK (Pre-fill form)
    const handleEdit = (sub) => {
        setFormData({
            name: sub.name,
            cost: sub.cost,
            category: sub.category,
            renewal_date: sub.renewal_date ? sub.renewal_date.split('T')[0] : ''
        });
        setEditingId(sub.id);
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Software Inventory</h1>
                <button 
                    onClick={() => {
                        setIsFormOpen(!isFormOpen);
                        setEditingId(null);
                        setFormData({ name: '', cost: '', category: 'SaaS', renewal_date: new Date().toISOString().split('T')[0] });
                    }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                >
                    {isFormOpen ? <X size={18} /> : <Plus size={18} />} 
                    {isFormOpen ? "Close Form" : "Add Subscription"}
                </button>
            </div>

            {/* FORM SECTION */}
            {isFormOpen && (
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-indigo-100 mb-8 animate-fade-in-down">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700 text-lg">
                            {editingId ? "Edit Subscription" : "New Subscription"}
                        </h3>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tool Name</label>
                            <input required placeholder="e.g. Photoshop" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Cost</label>
                            <div className="relative">
                                <DollarSign size={14} className="absolute left-3 top-3 text-gray-400" />
                                <input required type="number" placeholder="0.00" className="w-full border p-2 pl-8 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                                    value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Category</label>
                            <select className="w-full border p-2 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                <option>SaaS</option>
                                <option>Cloud</option>
                                <option>DevTools</option>
                                <option>Design</option>
                                <option>Communication</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Renewal</label>
                            <input type="date" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                                value={formData.renewal_date} onChange={e => setFormData({...formData, renewal_date: e.target.value})} />
                        </div>
                        <button type="submit" className={`text-white p-2.5 rounded-lg font-bold shadow-md transition ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}>
                            {editingId ? "Update" : "Save"}
                        </button>
                    </form>
                </div>
            )}

            {/* DATA TABLE */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-5 font-semibold text-gray-600 text-sm uppercase">Name</th>
                            <th className="p-5 font-semibold text-gray-600 text-sm uppercase">Cost</th>
                            <th className="p-5 font-semibold text-gray-600 text-sm uppercase">Category</th>
                            <th className="p-5 font-semibold text-gray-600 text-sm uppercase">Renewal</th>
                            <th className="p-5 font-semibold text-gray-600 text-sm uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {subs.map((sub) => (
                            <tr key={sub.id} className="hover:bg-gray-50 transition duration-150 group">
                                <td className="p-5 font-medium text-gray-900">{sub.name}</td>
                                <td className="p-5 font-mono text-gray-600 font-bold">${sub.cost.toFixed(2)}</td>
                                <td className="p-5">
                                    <span className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full font-bold border border-indigo-100">
                                        {sub.category}
                                    </span>
                                </td>
                                <td className="p-5 text-gray-500 text-sm flex items-center gap-2">
                                    <Calendar size={14} />
                                    {new Date(sub.renewal_date).toLocaleDateString()}
                                </td>
                                <td className="p-5 text-right flex justify-end gap-3 opacity-100">
                                    <button onClick={() => handleEdit(sub)} className="text-gray-400 hover:text-orange-500 transition" title="Edit">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(sub.id)} className="text-gray-400 hover:text-red-600 transition" title="Delete">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {subs.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-12 text-center text-gray-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <Tag size={24} />
                                        <p>No items found. Add one above!</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}