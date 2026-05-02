import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Tumhari Nayi Railway Backend Link
    const BACKEND_URL = 'https://team-task-manager-production-e916.up.railway.app';

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Backend API Call (Localhost ko Railway URL se replace kiya)
            const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password });

            // 2. LocalStorage mein data save karna
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role);
            localStorage.setItem('userName', res.data.userName);

            // 3. Dashboard par bhej dena
            navigate('/dashboard');
        } catch (err) {
            console.error("Login Error:", err);
            alert(err.response?.data?.message || 'Login fail! Email ya Password galat ho sakta hai.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0b0f1a] font-sans">
            <div className="bg-[#131926] p-10 rounded-[2rem] border border-slate-800 shadow-2xl w-full max-w-md">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                        TEAM TASK MANAGER
                    </h2>
                    <p className="text-slate-500 mt-2 text-sm font-medium tracking-wide">
                        Enter your credentials to access the console
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                        <input
                            type="email"
                            placeholder="name@company.com"
                            className="w-full bg-slate-800/50 p-4 mt-2 rounded-xl border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full bg-slate-800/50 p-4 mt-2 rounded-xl border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        disabled={loading}
                        className={`w-full py-4 mt-4 rounded-xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-lg 
                        ${loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20 text-white'}`}
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>

                    <div className="pt-6 text-center border-t border-slate-800/50 mt-6">
                        <p className="text-slate-500 text-sm">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                                Create Entry
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;