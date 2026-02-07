import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        try {
            // FIX: Don't call api.post here! 
            // Just pass credentials to AuthContext.
            await login(username, password);
            navigate('/dashboard');
        } catch (err) {
            console.error("Login component caught error:", err);
            setError('Invalid credentials. Please try again.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-xl shadow-md w-96">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Sign In</h2>
                {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="text" placeholder="Username" required
                        className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input 
                        type="password" placeholder="Password" required
                        className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition">
                        Login
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-600">
                    New? <Link to="/" className="text-indigo-600 font-semibold">Create Account</Link>
                </p>
            </div>
        </div>
    );
}