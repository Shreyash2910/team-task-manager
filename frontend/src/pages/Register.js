import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const navigate = useNavigate();

    // Tumhari Nayi Railway Backend Link
    const BACKEND_URL = 'https://team-task-manager-production-e916.up.railway.app';

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            // Localhost ko hata kar Railway URL se replace kar diya hai
            await axios.post(`${BACKEND_URL}/api/auth/register`, formData);
            alert('Registration Successful! Ab login karein.');
            navigate('/'); // Login page par bhej dega
        } catch (err) {
            alert(err.response?.data?.message || 'Registration fail ho gaya!');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
            <form onSubmit={handleRegister} className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
                <h2 className="text-3xl font-black mb-6 text-center text-slate-800">Create Account</h2>

                <input
                    type="text"
                    placeholder="Full Name"
                    required
                    className="w-full p-3 mb-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <input
                    type="email"
                    placeholder="Email Address"
                    required
                    className="w-full p-3 mb-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <input
                    type="password"
                    placeholder="Password"
                    required
                    className="w-full p-3 mb-6 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />

                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                    Sign Up
                </button>

                <p className="mt-6 text-center text-slate-600">
                    Already have an account? <Link to="/" className="text-blue-600 font-bold hover:underline">Login</Link>
                </p>
            </form>
        </div>
    );
};

export default Register;