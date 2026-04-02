import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background font-sans text-text">
        <header className="bg-primary text-white p-4 shadow-md sticky top-0 z-50">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold font-heading tracking-tight">ZeroWaste</h1>
            <nav className="space-x-4">
              <a href="/login" className="hover:text-primary-light transition">Login</a>
              <a href="/register" className="bg-white text-primary px-4 py-2 rounded-full font-medium hover:bg-primary-light transition">Get Started</a>
            </nav>
          </div>
        </header>
        
        <main className="container mx-auto p-4 sm:p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
