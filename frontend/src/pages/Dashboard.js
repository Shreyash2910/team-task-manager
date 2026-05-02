import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

// --- RAILWAY CONFIGURATION ---
// Ek hi baar URL define karo, har function mein likhne ki zaroorat nahi
const API_BASE_URL = 'https://team-task-manager-production-e916.up.railway.app/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Ye interceptor automatic token add karega har request mein
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

const Dashboard = () => {
    // --- STATES ---
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDeploying, setIsDeploying] = useState(false);
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        title: '', project: 'General', assignedTo: '', dueDate: '', priority: 'Medium'
    });

    const userRole = (localStorage.getItem('role') || 'member').toUpperCase().trim();
    const userName = localStorage.getItem('userName') || 'User';

    // --- DATA FETCHING ---
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [resTasks, resAct] = await Promise.all([
                api.get('/tasks/all'),
                api.get('/tasks/activities/all')
            ]);
            setTasks(resTasks.data);
            setActivities(resAct.data);

            if (userRole === 'ADMIN') {
                const resUsers = await api.get('/auth/users');
                setUsers(resUsers.data);
            }
        } catch (err) {
            console.error("Sync Error:", err);
            toast.error("Cloud Connection Failed");
        } finally {
            setLoading(false);
        }
    }, [userRole]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- OPERATIONS ---
    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!formData.assignedTo) return toast.error("Please assign an agent!");
        setIsDeploying(true);
        try {
            await api.post('/tasks/add', formData);
            toast.success("🚀 Mission Deployed Successfully!");
            setFormData({ title: '', project: 'General', assignedTo: '', dueDate: '', priority: 'Medium' });
            fetchData();
        } catch (err) {
            toast.error("Deployment Failed");
        } finally {
            setIsDeploying(false);
        }
    };

    const handleStatusChange = async (id, currentStatus) => {
        let nextStatus = currentStatus === 'Todo' ? 'In-Progress' : 'Done';
        try {
            await api.put(`/tasks/${id}`, { status: nextStatus });
            fetchData();
            toast.info(`Task moved to ${nextStatus}`);
        } catch (err) {
            toast.error("Update failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this mission?")) return;
        try {
            await api.delete(`/tasks/${id}`);
            fetchData();
            toast.warn("Mission Aborted");
        } catch (err) {
            toast.error("Delete failed");
        }
    };

    const handleClearLogs = async () => {
        if (!window.confirm("Purge all logs?")) return;
        try {
            await api.delete('/tasks/activities/clear');
            setActivities([]);
            toast.success("Logs Cleared");
        } catch (err) { toast.error("Failed to clear"); }
    };

    // --- ANALYTICS & FILTERS ---
    const stats = useMemo(() => ({
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'Done').length,
        pending: tasks.filter(t => t.status !== 'Done').length,
        overdue: tasks.filter(t => t.status !== 'Done' && t.dueDate && new Date(t.dueDate) < new Date()).length,
        agents: users.length
    }), [tasks, users]);

    const filteredTasks = tasks.filter(t => {
        const statusMatch = filter === 'All' ? true : t.status === filter;
        const searchMatch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
        return statusMatch && searchMatch;
    });

    const pieData = [
        { name: 'Todo', value: tasks.filter(t => t.status === 'Todo').length, color: '#6366f1' },
        { name: 'In-Progress', value: tasks.filter(t => t.status === 'In-Progress').length, color: '#eab308' },
        { name: 'Done', value: tasks.filter(t => t.status === 'Done').length, color: '#10b981' },
    ].filter(d => d.value > 0);

    // --- LOADING STATE ---
    if (loading) return (
        <div className="min-h-screen bg-[#05070a] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
                <p className="text-blue-500 font-black animate-pulse uppercase tracking-tighter">Syncing Nexus...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#05070a] text-slate-300 font-sans pb-24 px-4 md:px-8">
            <ToastContainer theme="dark" position="bottom-right" />

            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <header className="flex justify-between items-center py-8 mb-6 border-b border-slate-800/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.3)] text-xl">🚀</div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tighter italic uppercase">Nexus<span className="text-blue-500">Task</span></h1>
                            <p className="text-[9px] text-slate-500 font-bold tracking-[0.4em] uppercase">Control Panel v3.0</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-black text-white italic tracking-wide">@{userName}</p>
                            <span className="text-[9px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded border border-blue-500/20 font-black uppercase">{userRole}</span>
                        </div>
                        <button onClick={() => { localStorage.clear(); window.location.href = "/"; }} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:border-red-500/50 text-xl transition-all">🔌</button>
                    </div>
                </header>

                {/* Top Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    {[
                        { label: 'Total Missions', val: stats.total, color: 'text-white' },
                        { label: 'Successful', val: stats.completed, color: 'text-emerald-500' },
                        { label: 'Critical/Overdue', val: stats.overdue, color: 'text-red-500' },
                        { label: 'Active Agents', val: stats.agents, color: 'text-blue-500' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-[#0d1117] border border-slate-800 p-5 rounded-3xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-all"></div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className={`text-2xl font-black ${stat.color}`}>{stat.val}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT: Analytics & Form */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Chart */}
                        <div className="bg-[#0d1117] border border-slate-800 p-6 rounded-[2.5rem]">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Efficiency Pulse</h3>
                            <div className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value">
                                            {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: '#0d1117', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Admin Add Task Form */}
                        {userRole === 'ADMIN' && (
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-500/10">
                                <h3 className="text-white font-black text-lg mb-6 tracking-tighter uppercase italic">Deploy New Mission</h3>
                                <form onSubmit={handleAddTask} className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Operation Name"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl text-sm text-white outline-none placeholder:text-blue-100 focus:bg-white/20 transition-all"
                                        required
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="bg-white/10 border border-white/20 p-4 rounded-2xl text-xs text-white outline-none">
                                            <option value="High" className="text-black">High Priority</option>
                                            <option value="Medium" className="text-black">Medium</option>
                                            <option value="Low" className="text-black">Low</option>
                                        </select>
                                        <input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="bg-white/10 border border-white/20 p-4 rounded-2xl text-xs text-white outline-none" required />
                                    </div>
                                    <select value={formData.assignedTo} onChange={e => setFormData({ ...formData, assignedTo: e.target.value })} className="w-full bg-white/10 border border-white/20 p-4 rounded-2xl text-xs text-white outline-none" required>
                                        <option value="" className="text-black">Select Agent...</option>
                                        {users.map(u => <option key={u._id} value={u._id} className="text-black">{u.name}</option>)}
                                    </select>
                                    <button type="submit" disabled={isDeploying} className="w-full bg-white text-blue-700 font-black py-4 rounded-2xl text-xs uppercase hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-900/20">
                                        {isDeploying ? "INITIALIZING..." : "EXECUTE MISSION"}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Task List & Feed */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Search & Filters */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <input type="text" placeholder="Search mission by title..." className="w-full bg-[#0d1117] border border-slate-800 p-4 pl-12 rounded-2xl text-xs outline-none focus:border-blue-500/50" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                <span className="absolute left-4 top-4 opacity-30 text-lg">🔍</span>
                            </div>
                            <div className="flex bg-[#0d1117] p-1.5 rounded-2xl border border-slate-800 gap-1 overflow-x-auto">
                                {['All', 'Todo', 'In-Progress', 'Done'].map(f => (
                                    <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${filter === f ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{f}</button>
                                ))}
                            </div>
                        </div>

                        {/* Task Cards Container */}
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredTasks.length > 0 ? filteredTasks.map(task => (
                                <div key={task._id} className="bg-[#0d1117] border border-slate-800 p-6 rounded-[2rem] flex items-center gap-6 hover:border-blue-500/40 hover:bg-[#121820] transition-all group">
                                    {/* Priority Indicator */}
                                    <div className={`w-2 h-12 rounded-full ${task.status === 'Done' ? 'bg-emerald-500/20' : (task.priority === 'High' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse' : 'bg-blue-600')}`}></div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className={`text-base font-bold tracking-tight uppercase ${task.status === 'Done' ? 'text-slate-600 line-through' : 'text-white'}`}>{task.title}</h4>
                                            {task.priority === 'High' && <span className="text-[8px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20 font-black">CRITICAL</span>}
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase">
                                            <span className="flex items-center gap-1.5">👤 @{task.assignedTo?.name || 'Unknown'}</span>
                                            <span className="opacity-20">|</span>
                                            <span className={task.status === 'Done' ? 'text-emerald-500' : 'text-blue-500'}>⚡ {task.status}</span>
                                            {task.dueDate && (
                                                <>
                                                    <span className="opacity-20">|</span>
                                                    <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        {task.status !== 'Done' && (
                                            <button onClick={() => handleStatusChange(task._id, task.status)} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10">
                                                {task.status === 'Todo' ? 'Initialize' : 'Finish'}
                                            </button>
                                        )}
                                        {userRole === 'ADMIN' && (
                                            <button onClick={() => handleDelete(task._id)} className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">🗑️</button>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-20 bg-[#0d1117] border border-dashed border-slate-800 rounded-[3rem]">
                                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest italic">No active operations in current sector</p>
                                </div>
                            )}
                        </div>

                        {/* Logs Section */}
                        <div className="bg-[#0d1117] border border-slate-800 rounded-[2.5rem] p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span> Live Signal Feed
                                </h3>
                                {userRole === 'ADMIN' && <button onClick={handleClearLogs} className="text-[9px] font-black text-red-500/50 uppercase hover:text-red-500 transition-all">Clear Purge</button>}
                            </div>
                            <div className="space-y-3 max-h-[150px] overflow-y-auto custom-scrollbar">
                                {activities.slice(-10).reverse().map((act, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-slate-900/30 rounded-xl border border-slate-800/50 text-[10px]">
                                        <p className="text-slate-400 font-bold uppercase"><span className="text-white">@{act.userName}</span> {act.action}</p>
                                        <span className="text-slate-600 font-mono tracking-tighter">{new Date(act.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;