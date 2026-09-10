import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Users,
  Folder,
  TrendingUp,
  Leaf,
  GraduationCap,
  Crown,
  User,
  ArrowRight,
} from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    activeMembers: null,
    completedProjects: null,
    communityDriven: null,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const res = await authAPI.getPublicStats();
        if (isMounted && res?.data) {
          setStats({
            activeMembers: res.data.activeMembers ?? 0,
            completedProjects: res.data.completedProjects ?? 0,
            communityDriven: res.data.communityDriven ?? 0,
            loading: false,
          });
        }
      } catch (err) {
        if (isMounted) {
          setStats((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const formatStat = (val) => {
    if (val === null || val === undefined) return stats.loading ? '...' : '—';
    if (typeof val === 'number') {
      if (val >= 50) return `${val}+`;
      return `${val}`;
    }
    return val;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 flex flex-col justify-between px-4 py-4 sm:px-6 sm:py-5 lg:px-10 lg:py-5 relative overflow-x-hidden selection:bg-[#246648]/20 selection:text-[#246648]">
      {/* Subtle organic background blur accent */}
      <div className="absolute -top-32 left-1/4 w-96 h-96 bg-[#eaf4ee]/70 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-[#eef7f2]/50 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Navigation / Brand Bar */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between py-1">
        {/* Verve Brand */}
        <div className="flex items-center gap-3">
          <img
            src="/verve-logo.png"
            alt="Verve Logo"
            className="h-10 w-auto object-contain select-none"
          />
          <div>
            <span className="font-bold text-2xl tracking-tight text-[#101623] block leading-none">
              Verve
            </span>
            <span className="text-[9px] font-bold tracking-[0.24em] text-[#909db1] uppercase block mt-1">
              CLUB MANAGEMENT
            </span>
          </div>
        </div>

        {/* Top Right Tagline */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-serif italic">
          <span className="w-5 h-[1.5px] bg-[#246648]" />
          <span>Same People. Greater Impact.</span>
        </div>
      </header>

      {/* Main Content: Hero on Left + Login Card on Right */}
      <main className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center my-auto py-3 lg:py-2">
        
        {/* LEFT COLUMN: Editorial Hero Section (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          
          {/* Badge & Headline */}
          <div className="mb-4 lg:mb-5">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.22em] text-[#246648] uppercase block mb-2">
              STUDENT CLUBS. REAL IMPACT.
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.85rem] font-serif font-medium text-slate-900 tracking-tight leading-[1.15]">
              Manage today, <br />
              <span className="text-[#246648]">build tomorrow.</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mt-2.5 leading-relaxed font-sans">
              Verve helps student clubs manage projects, teams and tasks — all in one place.
            </p>
          </div>

          {/* Highlights & Campus Image Section */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
            
            {/* Features (Left inside Hero) */}
            <div className="sm:col-span-6 flex flex-col gap-3">
              {/* Feature 1 */}
              <div className="flex items-start gap-3 p-1.5 rounded-xl transition-colors hover:bg-white/60">
                <div className="w-9 h-9 rounded-xl bg-[#eaf4ee] text-[#246648] flex items-center justify-center shrink-0 mt-0.5 border border-[#246648]/10">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-800">
                    Bring People Together
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Organize members, teams and projects
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-3 p-1.5 rounded-xl transition-colors hover:bg-white/60">
                <div className="w-9 h-9 rounded-xl bg-[#eaf4ee] text-[#246648] flex items-center justify-center shrink-0 mt-0.5 border border-[#246648]/10">
                  <Folder className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-800">
                    Turn Ideas Into Action
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Plan, track and achieve more
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-3 p-1.5 rounded-xl transition-colors hover:bg-white/60">
                <div className="w-9 h-9 rounded-xl bg-[#eaf4ee] text-[#246648] flex items-center justify-center shrink-0 mt-0.5 border border-[#246648]/10">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-800">
                    Create a Bigger Impact
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Build a stronger, more connected community
                  </p>
                </div>
              </div>

              {/* Quote block */}
              <div className="mt-1 pt-2 pl-1.5">
                <div className="w-8 h-[2px] bg-[#246648] mb-2" />
                <p className="font-serif italic text-slate-700 text-xs sm:text-sm leading-relaxed">
                  “A student club platform for a brighter tomorrow.”
                </p>
              </div>
            </div>

            {/* Rounded Campus Building & Floating Badges (Right inside Hero) */}
            <div className="sm:col-span-6 relative flex justify-center items-center py-4">
              
              {/* Decorative botanical branch SVG */}
              <svg
                className="w-24 h-24 text-[#246648]/25 absolute -top-7 left-10 pointer-events-none hidden sm:block"
                viewBox="0 0 100 100"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10,90 Q40,60 50,15" />
                <path d="M35,68 Q20,55 30,48 Q40,55 35,68" fill="currentColor" fillOpacity="0.12" />
                <path d="M42,50 Q60,40 50,32 Q40,38 42,50" fill="currentColor" fillOpacity="0.12" />
                <path d="M47,30 Q30,22 40,15 Q50,22 47,30" fill="currentColor" fillOpacity="0.12" />
                <path d="M50,15 Q65,10 60,3 Q50,10 50,15" fill="currentColor" fillOpacity="0.12" />
              </svg>

              {/* Soft organic sage background blob behind building */}
              <div className="absolute -inset-2 bg-[#dceee2]/70 rounded-[44px] rotate-1 scale-105 pointer-events-none" />

              {/* Campus Building Image Frame */}
              <div className="relative w-full max-w-[250px] h-[310px] sm:h-[330px] rounded-t-[84px] rounded-b-[32px] overflow-hidden shadow-xl border-2 border-white bg-slate-100 z-0">
                <img
                  src="/club_pavilion_hero.jpg"
                  alt="Verve Student Club Community Pavilion"
                  className="w-full h-full object-cover object-center"
                />
              </div>

              {/* Floating Badge 1: Top Right */}
              <div className="absolute -top-1 -right-2 sm:-right-4 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-lg shadow-slate-900/5 border border-slate-100/90 flex items-center gap-2.5 z-10">
                <div className="w-7 h-7 rounded-xl bg-[#eaf4ee] text-[#246648] flex items-center justify-center shrink-0">
                  <Leaf className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-800 leading-tight">
                    Student Communities
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    Stronger Together
                  </div>
                  <div className="w-4 h-[1.5px] bg-[#246648] mt-1" />
                </div>
              </div>

              {/* Floating Badge 2: Bottom Left */}
              <div className="absolute -bottom-1 -left-2 sm:-left-4 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-lg shadow-slate-900/5 border border-slate-100/90 flex items-center gap-2.5 z-10">
                <div className="w-7 h-7 rounded-xl bg-[#eaf4ee] text-[#246648] flex items-center justify-center shrink-0">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-800 leading-tight">
                    Clubs Today
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    Leaders Tomorrow
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sign In Card (lg:col-span-5) */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="bg-white rounded-[26px] border border-slate-100/90 shadow-xl shadow-slate-900/[0.04] p-6 sm:p-8 w-full max-w-[420px]">
            
            {/* Card Header */}
            <div className="mb-5">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#246648] uppercase block">
                WELCOME BACK
              </span>
              <h2 className="text-2xl sm:text-[1.75rem] font-serif font-medium text-slate-900 tracking-tight mt-1">
                Sign in to Verve
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Access your club management workspace
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@verve.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200/80 focus:border-[#246648] focus:outline-none focus:ring-2 focus:ring-[#246648]/10 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200/80 focus:border-[#246648] focus:outline-none focus:ring-2 focus:ring-[#246648]/10 transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Options Row: Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#246648] focus:ring-[#246648]/20 focus:ring-offset-0"
                  />
                  <span className="text-xs text-slate-600 font-normal">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password reset link will be sent to registered email.')}
                  className="text-xs font-medium text-[#246648] hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In Button */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#246648] hover:bg-[#1c5339] active:bg-[#16432e] text-white text-xs sm:text-sm font-semibold shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider: OR QUICK TEST CREDENTIALS */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <span className="relative px-3 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-400">
                OR QUICK TEST CREDENTIALS
              </span>
            </div>

            {/* Quick Test Role Buttons */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                id="admin-demo-btn"
                type="button"
                onClick={() => setDemoCredentials('admin@verve.com', 'AdminPassword123!')}
                className="py-3 px-2 bg-slate-50/60 hover:bg-[#eaf4ee]/60 hover:border-[#246648]/40 hover:text-[#246648] border border-slate-200/70 rounded-2xl text-slate-700 font-medium transition-all duration-150 flex flex-col items-center justify-center gap-1.5 text-xs group"
              >
                <Crown className="w-4 h-4 text-[#246648] group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-[11px]">Admin</span>
              </button>
              <button
                id="lead-demo-btn"
                type="button"
                onClick={() => setDemoCredentials('lead@verve.com', 'LeadPassword123!')}
                className="py-3 px-2 bg-slate-50/60 hover:bg-[#eaf4ee]/60 hover:border-[#246648]/40 hover:text-[#246648] border border-slate-200/70 rounded-2xl text-slate-700 font-medium transition-all duration-150 flex flex-col items-center justify-center gap-1.5 text-xs group"
              >
                <Users className="w-4 h-4 text-[#246648] group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-[11px]">Lead</span>
              </button>
              <button
                id="member-demo-btn"
                type="button"
                onClick={() => setDemoCredentials('member@verve.com', 'MemberPassword123!')}
                className="py-3 px-2 bg-slate-50/60 hover:bg-[#eaf4ee]/60 hover:border-[#246648]/40 hover:text-[#246648] border border-slate-200/70 rounded-2xl text-slate-700 font-medium transition-all duration-150 flex flex-col items-center justify-center gap-1.5 text-xs group"
              >
                <User className="w-4 h-4 text-[#246648] group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-[11px]">Member</span>
              </button>
            </div>

            {/* Footer security note inside card */}
            <div className="mt-6 pt-3 border-t border-slate-50 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Club Management System &bull; Secure Role-Based Access</span>
            </div>

          </div>
        </div>

      </main>

      {/* Bottom Statistics Bar */}
      <footer className="max-w-7xl w-full mx-auto pt-4 sm:pt-6 pb-2 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Stats */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-8 justify-center sm:justify-start">
          {/* Stat 1 */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#eaf4ee] text-[#246648] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 leading-none">
                {formatStat(stats.activeMembers)}
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                Active Members
              </div>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#eaf4ee] text-[#246648] flex items-center justify-center shrink-0">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 leading-none">
                {formatStat(stats.completedProjects)}
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                Projects Completed
              </div>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#eaf4ee] text-[#246648] flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 leading-none">
                {stats.communityDriven !== null ? `${stats.communityDriven}%` : stats.loading ? '...' : '—'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                Community Driven
              </div>
            </div>
          </div>
        </div>

        {/* Right footer accent */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-serif italic">
          <span>More than a club.</span>
          <span className="w-5 h-[1.5px] bg-[#246648]" />
        </div>

      </footer>
    </div>
  );
};

export default Login;
