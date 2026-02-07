import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
                <div className="p-12 md:w-1/2 bg-indigo-600 text-white flex flex-col justify-center">
                    <h1 className="text-5xl font-bold mb-4">OfficeWatch</h1>
                    <p className="text-indigo-100 text-lg">The all-in-one platform for modern workplaces. Manage licenses, leaves, and expenses.</p>
                </div>
                <div className="p-12 md:w-1/2 flex flex-col justify-center items-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-8">Who are you?</h2>
                    <div className="w-full space-y-4">
                        <Link to="/signup?role=admin" className="block w-full border-2 border-gray-100 p-4 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition">
                            <h3 className="font-bold text-gray-700">Organization Admin</h3>
                            <p className="text-sm text-gray-500">Manage budget, approve requests.</p>
                        </Link>
                        <Link to="/signup?role=employee" className="block w-full border-2 border-gray-100 p-4 rounded-xl hover:border-green-600 hover:bg-green-50 transition">
                            <h3 className="font-bold text-gray-700">Team Member</h3>
                            <p className="text-sm text-gray-500">Request leaves, tools, and perks.</p>
                        </Link>
                        <p className="text-center text-sm text-gray-400 mt-4">Already have an account? <Link to="/login" className="text-indigo-600 font-bold">Login</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}