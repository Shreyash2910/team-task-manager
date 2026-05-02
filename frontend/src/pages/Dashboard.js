import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const Dashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDeploying, setIsDeploying] = useState(false);
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        project: 'General',
        assignedTo: '',
        dueDate: '',
        priority: 'Medium'
    });

    const rawRole = localStorage.getItem('role') || 'member';
    const userRole = rawRole.toUpperCase().trim();
    const userName = localStorage.getItem('userName') || 'User';
    const token = localStorage.getItem('token');

    const fetchData = useCallback(async () => {
        if (!token) return setLoading(false);
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            setLoading(true);
            const [resTasks, resAct] = await Promise.all([
                axios.get('http://localhost:5000/api/tasks/all', config),
                axios.get('http://localhost:5000/api/tasks/activities/all', config)
            ]);
            setTasks(resTasks.data);
            setActivities(resAct.data);
            if (userRole === 'ADMIN') {
                const resUsers = await axios.get('http://localhost:5000/api/auth/users', config);
                setUsers(resUsers.data);
            }
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }, [userRole, token]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleClearLogs = async () => {
        if (!window.confirm("Purge all logs?")) return;
        try {
            await axios.delete('http://localhost:5000/api/tasks/activities/clear', { headers: { Authorization: `Bearer ${token}` } });
            setActivities([]);
            toast.warn("Logs Purged");
        } catch (err) { toast.error("Failed to clear"); }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!formData.assignedTo) return toast.error("Select an agent first!");
        setIsDeploying(true);
        try {
            await axios.post('http://localhost:5000/api/tasks/add', formData, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("🚀 Mission Deployed!");
            setFormData({ ...formData, title: '', assignedTo: '' });
            fetchData();
        } catch (err) { toast.error("Deployment Failed"); }
        finally { setIsDeploying(false); }
    };

    const handleStatusChange = async (id, currentStatus) => {
        let nextStatus = currentStatus === 'Todo' ? 'In-Progress' : 'Done';
        try {
            await axios.put(`http://localhost:5000/api/tasks/${id}`, { status: nextStatus }, { headers: { Authorization: `Bearer ${token}` } });
            fetchData();
        } catch (err) { toast.error("Update failed"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Abort Mission?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/tasks/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchData();
        } catch (err) { toast.error("Delete failed"); }
    };

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

    const barData = ['High', 'Medium', 'Low'].map(p => ({
        priority: p,
        count: tasks.filter(t => t.priority === p).length
    }));

    const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'Done').length,
        overdue: tasks.filter(t => t.status !== 'Done' && t.dueDate && new Date(t.dueDate) < new Date()).length
    };

    if (loading) return (
        <div className="min-h-screen bg-[#05070a] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#05070a] text-slate-300 font-sans pb-24">
            <ToastContainer theme="dark" position="bottom-right" />

            <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
                {/* Header */}
                <nav className="flex justify-between items-center py-8 mb-4 border-b border-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight uppercase italic leading-none">Nexus<span className="text-blue-500">Task</span></h2>
                            <p className="text-[8px] text-slate-500 font-bold tracking-[0.3em] uppercase mt-1">System Command Center</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-white uppercase italic">@{userName}</p>
                            <p className="text-[10px] text-blue-500 font-black uppercase">{userRole}</p>
                        </div>
                        <button onClick={() => { localStorage.clear(); window.location.href = "/"; }} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-red-500 transition-all">🔌</button>
                    </div>
                </nav>

                {/* Stats Summary Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Missions', val: stats.total, color: 'text-white' },
                        { label: 'Successful', val: stats.completed, color: 'text-emerald-500' },
                        { label: 'Critical', val: stats.overdue, color: 'text-red-500' },
                        { label: 'Active Agents', val: users.length, color: 'text-blue-500' }
                    ].map((item, idx) => (
                        <div key={idx} className="bg-[#0d1117] border border-slate-800 p-4 rounded-2xl">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                            <p className={`text-xl font-black ${item.color}`}>{item.val}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-[#0d1117] border border-slate-800 p-6 rounded-[2rem]">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Operational Pulse</h3>
                            <div className="h-[180px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {pieData.map((entry, index) => <Cell key={index} fill={entry.color} stroke="none" />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: '#0d1117', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-[#0d1117] border border-slate-800 p-6 rounded-[2rem]">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Priority Analysis</h3>
                            <div className="h-[150px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="priority" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} />
                                        <YAxis width={20} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} />
                                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                            {barData.map((entry, index) => (
                                                <Cell key={index} fill={entry.priority === 'High' ? '#ef4444' : '#3b82f6'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* TASK FLUX - WEEKLY HEATMAP */}
                        <div className="bg-[#0d1117] border border-slate-800 p-6 rounded-[2rem]">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">7-Day Mission Flux</h3>
                            <div className="flex justify-between items-end gap-2 h-20">
                                {[...Array(7)].map((_, i) => {
                                    const date = new Date();
                                    date.setDate(date.getDate() + i);
                                    const dateStr = date.toISOString().split('T')[0];

                                    const dayTasks = tasks.filter(t => t.dueDate && t.dueDate.split('T')[0] === dateStr);
                                    const intensity = dayTasks.length;

                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                            <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-blue-600 text-[8px] font-bold px-2 py-1 rounded-md z-10 whitespace-nowrap shadow-lg">
                                                {intensity} Missions Due
                                            </div>
                                            <div
                                                className={`w-full rounded-t-lg transition-all duration-500 ${intensity === 0 ? 'bg-slate-800/30 h-2' :
                                                        intensity < 3 ? 'bg-blue-500/40 h-8 shadow-[0_0_15px_rgba(59,130,246,0.1)]' :
                                                            'bg-blue-500 h-16 shadow-[0_0_20px_rgba(59,130,246,0.4)] animate-pulse'
                                                    }`}
                                            ></div>
                                            <span className="text-[8px] font-black text-slate-600 uppercase">
                                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {userRole === 'ADMIN' && (
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[2rem] shadow-xl">
                                <h3 className="text-white font-black text-sm mb-4 uppercase tracking-widest">Deploy Mission</h3>
                                <form onSubmit={handleAddTask} className="space-y-3">
                                    <input type="text" placeholder="Mission Name" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-white/10 border border-white/20 p-3 rounded-xl text-xs text-white outline-none placeholder:text-blue-100" required />
                                    <div className="grid grid-cols-2 gap-3">
                                        <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="bg-white/10 border border-white/20 p-3 rounded-xl text-[10px] text-white outline-none">
                                            <option value="High" className="text-black">High Priority</option>
                                            <option value="Medium" className="text-black">Medium</option>
                                            <option value="Low" className="text-black">Low</option>
                                        </select>
                                        <input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="bg-white/10 border border-white/20 p-3 rounded-xl text-[10px] text-white outline-none" required />
                                    </div>
                                    <select value={formData.assignedTo} onChange={e => setFormData({ ...formData, assignedTo: e.target.value })} className="w-full bg-white/10 border border-white/20 p-3 rounded-xl text-[10px] text-white outline-none" required>
                                        <option value="" className="text-black">Assign Agent...</option>
                                        {users.map(u => <option key={u._id} value={u._id} className="text-black">{u.name}</option>)}
                                    </select>
                                    <button type="submit" disabled={isDeploying} className="w-full bg-white text-blue-700 font-black py-3 rounded-xl text-[10px] uppercase hover:bg-blue-50 transition-all shadow-lg">
                                        {isDeploying ? "DEPLOYING..." : "EXECUTE MISSION"}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    placeholder="Search operations..."
                                    className="w-full bg-[#0d1117] border border-slate-800 p-4 pl-10 rounded-2xl text-xs outline-none focus:border-blue-500/50"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <span className="absolute left-4 top-4 opacity-30">🔍</span>
                            </div>
                            <div className="flex bg-[#0d1117] p-1.5 rounded-2xl border border-slate-800 shrink-0">
                                {['All', 'Todo', 'In-Progress', 'Done'].map(f => (
                                    <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${filter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}>{f}</button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {filteredTasks.length > 0 ? filteredTasks.map(task => (
                                <div key={task._id} className="bg-[#0d1117] border border-slate-800 p-5 rounded-[1.5rem] flex items-center gap-5 hover:border-blue-500/40 transition-all group">
                                    <div className={`w-1.5 h-10 rounded-full ${task.status === 'Done' ? 'bg-emerald-500' : (task.priority === 'High' ? 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-blue-500')}`}></div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className={`text-sm font-bold uppercase tracking-tight ${task.status === 'Done' ? 'text-slate-500 line-through' : 'text-white'}`}>{task.title}</h4>
                                            {task.priority === 'High' && <span className="text-[7px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20 font-black">CRITICAL</span>}
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 flex items-center gap-2">
                                            <span>👤 @{task.assignedTo?.name || 'Agent'}</span>
                                            <span className="opacity-20">•</span>
                                            <span className={task.status === 'Done' ? 'text-emerald-500' : 'text-blue-500'}>{task.status}</span>
                                            {task.dueDate && (
                                                <>
                                                    <span className="opacity-20">•</span>
                                                    <span className="text-slate-600">📅 {new Date(task.dueDate).toLocaleDateString()}</span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {task.status !== 'Done' && (
                                            <button onClick={() => handleStatusChange(task._id, task.status)} className="px-4 py-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl text-[9px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all">
                                                {task.status === 'Todo' ? 'Start' : 'Done'}
                                            </button>
                                        )}
                                        {userRole === 'ADMIN' && (
                                            <button onClick={() => handleDelete(task._id)} className="p-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">🗑️</button>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-[2rem]">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No active operations found</p>
                                </div>
                            )}
                        </div>

                        {/* PERFORMANCE LEADERBOARD */}
                        <div className="bg-[#0d1117] border border-slate-800 rounded-[2rem] p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Top Performing Operatives</h3>
                                <span className="text-[8px] bg-blue-500/10 text-blue-500 px-2 py-1 rounded font-black border border-blue-500/20">MONTHLY_RANK</span>
                            </div>

                            <div className="space-y-4">
                                {users.length > 0 ? users.map((user) => {
                                    const completedCount = tasks.filter(t => t.assignedTo?._id === user._id && t.status === 'Done').length;
                                    return { name: user.name, count: completedCount };
                                })
                                    .sort((a, b) => b.count - a.count)
                                    .slice(0, 3)
                                    .map((agent, index) => (
                                        <div key={index} className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${index === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                                                index === 1 ? 'bg-slate-400/20 text-slate-400 border border-slate-400/30' :
                                                    'bg-orange-700/20 text-orange-700 border border-orange-700/30'
                                                }`}>
                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-[11px] font-bold text-white uppercase italic">Agent {agent.name}</p>
                                                    <p className="text-[10px] font-mono text-blue-500 font-bold">{agent.count} Missions</p>
                                                </div>
                                                <div className="w-full bg-slate-900 h-1 mt-2 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${index === 0 ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]' : 'bg-blue-500'}`}
                                                        style={{ width: `${(agent.count / (tasks.length || 1)) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    )) : <p className="text-[10px] text-slate-600 text-center italic">Awaiting field data...</p>}
                            </div>
                        </div>

                        {/* Logs */}
                        <div className="bg-[#0d1117] border border-slate-800 rounded-[2rem] p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Live Signal Feed
                                </h3>
                                {userRole === 'ADMIN' && <button onClick={handleClearLogs} className="text-[9px] font-black text-red-500/50 hover:text-red-500">Purge</button>}
                            </div>
                            <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                {activities.slice().reverse().map((act, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-xl border border-slate-800/50">
                                        <div className="text-[10px]"><span className="text-white font-bold">@{act.userName}</span> <span className="text-slate-500">{act.action}</span> <span className="text-blue-500 font-bold">{act.taskTitle}</span></div>
                                        <span className="text-[8px] font-mono text-slate-600">{new Date(act.createdAt).toLocaleTimeString()}</span>
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