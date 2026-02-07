import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { logout } = useAuth();
    const location = useLocation();

    // Helper to style the active link
    const isActive = (path) => location.pathname === path ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white";

    return (
        <nav className="w-64 bg-gray-900 text-white flex flex-col justify-between p-6">
            <div>
                <h1 className="text-2xl font-bold mb-10 tracking-wider">LICENSE<span className="text-indigo-400">WATCH</span></h1>
                <div className="space-y-2">
                    <Link to="/dashboard" className={`block px-4 py-2 rounded transition ${isActive('/dashboard')}`}>
                        Dashboard
                    </Link>
                    <Link to="/inventory" className={`block px-4 py-2 rounded transition ${isActive('/inventory')}`}>
                        Inventory
                    </Link>
                    {/* FIXED LINK BELOW */}
                    <Link to="/requests" className={`block px-4 py-2 rounded transition ${isActive('/requests')}`}>
                        Requests
                    </Link>
                </div>
            </div>
            <button onClick={logout} className="text-left px-4 py-2 text-red-400 hover:text-red-300 font-medium">
                Sign Out
            </button>
        </nav>
    );
}