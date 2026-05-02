import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard'; // <--- 1. Dashboard component ko import kiya

// Protected Route Logic
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes (Dashboard) */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                {/* 2. Purana wala div hata kar naya Dashboard component yahan daal diya */}
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Fallback - Kisi bhi galat path par Login par bhej dega */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;