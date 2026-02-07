import { useState } from 'react';
import api from '../api';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

export default function Signup() {
    const [searchParams] = useSearchParams();
    const roleParam = searchParams.get("role") || "employee";
    
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/signup?role=${roleParam}`, { username, password });
            alert('Account created! Please login.');
            navigate('/login');
        } catch (err) {
            alert('Error: Username might be taken.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-xl shadow-md w-96">
                <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">Sign Up</h2>
                <p className="text-center text-sm text-gray-500 mb-6 capitalize">Role: {roleParam}</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Choose Username" required className="w-full border p-2 rounded" onChange={e => setUsername(e.target.value)} />
                    <input type="password" placeholder="Password" required className="w-full border p-2 rounded" onChange={e => setPassword(e.target.value)} />
                    <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded font-bold hover:bg-indigo-700">Create Account</button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-600"><Link to="/login" className="text-indigo-600 font-bold">Back to Login</Link></p>
            </div>
        </div>
    );
}