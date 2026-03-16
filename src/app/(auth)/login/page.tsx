import React from 'react';
import { ShieldCheck, User, Lock, LogIn, Shield, FileText } from 'lucide-react';
import Link from 'next/link';

export default function AdminLogin() {
  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="relative flex h-auto w-full flex-col bg-slate-50 dark:bg-slate-900 overflow-x-hidden">
          
          <div className="flex items-center p-6 pb-2 justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-primary w-8 h-8" />
              <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                Admin Portal
              </h2>
            </div>
            <div className="px-3 py-1 bg-primary/10 rounded-full">
              <span className="text-primary text-xs font-bold uppercase tracking-wider">v2.4.0</span>
            </div>
          </div>

          <div className="px-6 py-4">
            <div 
              className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden bg-primary/5 rounded-xl min-h-[160px] border border-primary/10" 
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCcR1j7X37a239zGAVXoQrOX-COgrmeo-Ial0ay46z4eL9CuXQb44KilNwvTMFCBAmTkBDAXdACl7Qt05Hc66TmTjVTcpU4QlvH6_h6LR3uDD3Sru3l0EERWmjUG4ibmj4svSo5iZ3q_qFeRA7RZmuOjt1cRXfXvThrNrVOCYHJWeHbT3StDU_uvrDCBUMGEFRgajS8HEmOn3kZu_upQWsO5HS2cy5YCb-4b_fhxtp2jwNggt-MELHfWjPtIOMd1V_PZZHIIPrf8MA")' }}
            >
            </div>
          </div>

          <div className="px-6">
            <h2 className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold leading-tight pb-2 pt-4">
              Welcome Back
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-normal pb-6">
              Log in to manage your enterprise resource planning environment.
            </p>

            <form className="space-y-4">
              <div className="flex flex-col">
                <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold leading-normal pb-2 px-1">
                  Email or Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    className="form-input flex w-full rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 h-14 placeholder:text-slate-400 pl-12 pr-4 text-base font-normal leading-normal transition-all" 
                    placeholder="admin@enterprise.com" 
                    type="text"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-center pb-2 px-1">
                  <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
                    Password
                  </label>
                  <Link href="#" className="text-primary text-xs font-bold hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    className="form-input flex w-full rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 h-14 placeholder:text-slate-400 pl-12 pr-4 text-base font-normal leading-normal transition-all" 
                    placeholder="••••••••••••" 
                    type="password"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group" 
                  type="submit"
                >
                  <span>Log In as Admin</span>
                  <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>

            <div className="mt-8 py-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <Shield className="text-green-500 w-4 h-4" />
                <p className="text-xs">Secure login session with Multi-Factor Authentication (MFA)</p>
              </div>
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mt-3">
                <FileText className="text-primary w-4 h-4" />
                <p className="text-xs">Continuous activity monitoring and real-time security audit logs enabled</p>
              </div>
            </div>

            <div className="py-6 text-center">
              <p className="text-slate-400 dark:text-slate-500 text-xs">
                By logging in, you agree to our <Link href="#" className="underline">System Policy</Link> and <Link href="#" className="underline">Security Protocols</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
