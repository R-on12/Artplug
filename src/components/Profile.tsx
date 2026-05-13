import React from 'react';
import { motion } from 'motion/react';
import { User, Mail, Shield, Calendar } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface ProfileProps {
  user: FirebaseUser;
}

export default function Profile({ user }: ProfileProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto px-6 py-20 md:py-32"
    >
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        {/* Header/Cover Area */}
        <div className="h-32 bg-gray-50 border-b border-gray-100" />
        
        <div className="px-8 md:px-12 pb-12 -mt-16">
          <div className="flex flex-col md:flex-row items-end gap-6 mb-10">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&size=128`} 
              className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg object-cover"
              alt={user.displayName || 'User'}
            />
            <div className="flex-1 pb-2">
              <h1 className="text-4xl font-display font-black tracking-tight text-slate-900">
                {user.displayName || 'Artist Profile'}
              </h1>
              <p className="text-gray-400 font-medium uppercase tracking-[0.2em] text-xs mt-1">
                Verified Collector
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="group border-2 border-gray-50 p-6 rounded-2xl hover:border-brand-blue/10 transition-colors">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-blue-50 text-brand-blue rounded-xl">
                    <User size={20} />
                  </div>
                  <h3 className="font-bold text-slate-900 uppercase tracking-widest text-[10px]">Display Name</h3>
                </div>
                <p className="text-lg font-medium text-slate-600">{user.displayName || 'Not set'}</p>
              </div>

              <div className="group border-2 border-gray-50 p-6 rounded-2xl hover:border-brand-blue/10 transition-colors">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-blue-50 text-brand-blue rounded-xl">
                    <Mail size={20} />
                  </div>
                  <h3 className="font-bold text-slate-900 uppercase tracking-widest text-[10px]">Email Address</h3>
                </div>
                <p className="text-lg font-medium text-slate-600">{user.email}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="group border-2 border-gray-50 p-6 rounded-2xl hover:border-brand-blue/10 transition-colors">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-blue-50 text-brand-blue rounded-xl">
                    <Shield size={20} />
                  </div>
                  <h3 className="font-bold text-slate-900 uppercase tracking-widest text-[10px]">Account Security</h3>
                </div>
                <p className="text-lg font-medium text-slate-600">
                  {user.emailVerified ? 'Email Verified' : 'Verification Pending'}
                </p>
              </div>

              <div className="group border-2 border-gray-50 p-6 rounded-2xl hover:border-brand-blue/10 transition-colors">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-blue-50 text-brand-blue rounded-xl">
                    <Calendar size={20} />
                  </div>
                  <h3 className="font-bold text-slate-900 uppercase tracking-widest text-[10px]">Last Login</h3>
                </div>
                <p className="text-lg font-medium text-slate-600">
                  {user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-12 border-t border-gray-50">
            <button 
              className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition shadow-lg shadow-slate-200 active:scale-95"
              onClick={() => window.alert('Profile editing is coming soon.')}
            >
              Update Information
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
