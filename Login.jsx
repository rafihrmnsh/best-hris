import React, { useState } from "react";
import { User, Lock, LogIn, Loader2 } from "lucide-react";
import logoImage from "./img/logo.png";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate network delay for smoother feel
    await new Promise((resolve) => setTimeout(resolve, 800));

    onLogin(username, password, (errMessage) => {
      setError(errMessage);
      setIsLoading(false);
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 animate-slide-up">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src={logoImage} 
              alt="Logo" 
              className="h-16 object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/150?text=Logo";
              }} 
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Selamat Datang</h1>
          <p className="text-slate-500">Silakan login untuk melanjutkan</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className={`h-5 w-5 ${isLoading ? 'text-slate-300' : 'text-slate-400'}`} />
              </div>
              <input
                type="text"
                disabled={isLoading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-50 disabled:text-slate-400"
                placeholder="Masukkan username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className={`h-5 w-5 ${isLoading ? 'text-slate-300' : 'text-slate-400'}`} />
              </div>
              <input
                type="password"
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-50 disabled:text-slate-400"
                placeholder="Masukkan password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 font-bold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2
              ${isLoading 
                ? "bg-blue-400 cursor-not-allowed text-slate-100" 
                : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl hover:-translate-y-0.5"
              }`}
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Login
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} PT Bakti Energi Sejahtera
          </p>
        </div>
      </div>
    </div>
  );
}