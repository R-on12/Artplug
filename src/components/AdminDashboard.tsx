import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  where,
  updateDoc, 
  deleteDoc,
  doc,
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { CURRENCY_RATES, formatPrice } from '../lib/currency';
import { 
  Users, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye,
  ExternalLink,
  TrendingUp,
  Trash2,
  DollarSign,
  BadgeCheck,
  Search,
  Loader2,
  Settings
} from 'lucide-react';
import { setDoc } from 'firebase/firestore';

interface Application {
  id: string;
  artistName: string;
  portfolioLink: string;
  creativeMedium: string;
  status: 'pending' | 'approved' | 'rejected';
  userId: string;
  createdAt: any;
}

interface Sale {
  id: string;
  title: string;
  artist: string;
  price: string;
  buyerEmail: string;
  createdAt: any;
}

export default function AdminDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('USD');
  const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false);
  const [artists, setArtists] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingApps: 0,
    totalRevenue: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Applications
      const appSnapshot = await getDocs(query(collection(db, 'applications'), orderBy('createdAt', 'desc')));
      const appData = appSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Application));
      setApplications(appData);

      // Fetch Recent Sales
      const salesSnapshot = await getDocs(query(collection(db, 'sales'), orderBy('createdAt', 'desc'), limit(10)));
      const salesData = salesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Sale));
      setSales(salesData);

      // Fetch Artists (Users with role 'artist')
      const artistQuery = query(collection(db, 'users'), where('role', '==', 'artist'));
      const artistSnapshot = await getDocs(artistQuery);
      setArtists(artistSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch Platform Settings
      const settingsSnapshot = await getDocs(collection(db, 'settings'));
      const currencySetting = settingsSnapshot.docs.find(d => d.id === 'platform')?.data()?.currency;
      if (currencySetting) setCurrency(currencySetting);

      // Calculate Stats
      const revenue = salesData.reduce((acc, sale) => acc + parseFloat(sale.price.replace(',', '')), 0);
      setStats({
        totalSales: salesData.length,
        pendingApps: appData.filter(a => a.status === 'pending').length,
        totalRevenue: revenue
      });

    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'admin_data');
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    setIsUpdatingCurrency(true);
    try {
      await setDoc(doc(db, 'settings', 'platform'), {
        currency: newCurrency
      }, { merge: true });
      setCurrency(newCurrency);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/platform');
    } finally {
      setIsUpdatingCurrency(false);
    }
  };

  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    setIsVerifying(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        isVerified: !currentStatus
      });
      setArtists(prev => prev.map(a => a.id === userId ? { ...a, isVerified: !currentStatus } : a));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setIsVerifying(userId);
      setIsVerifying(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (appId: string, newStatus: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'applications', appId), {
        status: newStatus
      });
      
      setApplications(prevApps => {
        const nextApps = prevApps.map(a => a.id === appId ? { ...a, status: newStatus } : a);
        
        // Update stats based on the updated list
        setStats(prevStats => ({
          ...prevStats,
          pendingApps: nextApps.filter(a => a.status === 'pending').length
        }));
        
        return nextApps;
      });
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `applications/${appId}`);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteApplication = async (appId: string) => {
    if (!window.confirm('Are you sure you want to permanently remove this artist application?')) return;
    
    setDeletingId(appId);
    try {
      await deleteDoc(doc(db, 'applications', appId));
      
      // Update applications and stats using the new state
      setApplications(prevApps => {
        const updatedApps = prevApps.filter(a => a.id !== appId);
        
        // Update stats based on the NEW list of applications
        setStats(prevStats => ({
          ...prevStats,
          pendingApps: updatedApps.filter(a => a.status === 'pending').length
        }));
        
        return updatedApps;
      });
    } catch (error) {
       console.error('Delete failed:', error);
       alert('Failed to delete application. You may not have administrative permissions or the record no longer exists.');
       handleFirestoreError(error, OperationType.DELETE, `applications/${appId}`);
    } finally {
      setDeletingId(null);
    }
  };

  const formatPriceLocal = (priceStr: string) => {
    return formatPrice(priceStr, currency);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">Admin Control Center<span className="text-brand-blue">.</span></h1>
          <p className="text-gray-400 mt-2">Monitoring platform activity and Curating the next generation of artists.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          {isUpdatingCurrency ? (
            <Loader2 size={16} className="ml-2 text-brand-blue animate-spin" />
          ) : (
            <DollarSign size={16} className="ml-2 text-gray-400" />
          )}
          <select 
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            disabled={isUpdatingCurrency}
            className="bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest text-slate-900 pr-8 cursor-pointer disabled:opacity-50"
          >
            {Object.keys(CURRENCY_RATES).map(code => (
              <option key={code} value={code}>{code} - {CURRENCY_RATES[code].name}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-brand-blue rounded-2xl">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Estimated Revenue</p>
          <h2 className="text-3xl font-display font-black text-slate-900 mt-1">{formatPriceLocal(stats.totalRevenue.toString())}</h2>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Clock size={24} />
            </div>
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Pending Applications</p>
          <h2 className="text-3xl font-display font-black text-slate-900 mt-1">{stats.pendingApps}</h2>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
              <ShoppingBag size={24} />
            </div>
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Recent Sales</p>
          <h2 className="text-3xl font-display font-black text-slate-900 mt-1">{stats.totalSales}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Applications List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Users size={20} className="text-brand-blue" />
              Artist Pipeline
            </h3>
          </div>
          <div className="space-y-4">
            {applications.length === 0 ? (
              <p className="text-gray-400 italic">No applications found.</p>
            ) : (
              applications.map(app => (
                <div key={app.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-slate-900">{app.artistName}</h4>
                      <p className="text-xs text-gray-400 mt-1">{app.creativeMedium}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                        app.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                        app.status === 'approved' ? 'bg-green-50 text-green-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {app.status}
                      </span>
                      <button 
                        onClick={() => handleDeleteApplication(app.id)}
                        disabled={deletingId === app.id}
                        className="text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-700 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete Artist Record"
                      >
                        {deletingId === app.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-red-500"></div>
                        ) : (
                          <Trash2 size={12} />
                        )}
                        {deletingId === app.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-50">
                    <a 
                      href={app.portfolioLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs font-bold text-brand-blue hover:underline"
                    >
                      <ExternalLink size={14} /> Portfolio
                    </a>
                    {app.status === 'pending' && (
                      <div className="flex items-center gap-2 ml-auto">
                        <button 
                          onClick={() => handleUpdateStatus(app.id, 'rejected')}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <XCircle size={20} />
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(app.id, 'approved')}
                          className="p-2 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <CheckCircle2 size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Sales List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ShoppingBag size={20} className="text-brand-blue" />
              Live Marketplace
            </h3>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Artwork</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Buyer</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-400 italic">No sales recorded yet.</td>
                  </tr>
                ) : (
                  sales.map(sale => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 text-sm">{sale.title}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">by {sale.artist}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-600">{sale.buyerEmail}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-slate-900 text-sm">{formatPriceLocal(sale.price)}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Artist Management */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <BadgeCheck size={20} className="text-brand-blue" />
            Curated Artist Management
          </h3>
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-2xl text-xs outline-none focus:border-brand-blue transition-all w-64 md:w-80 shadow-sm"
            />
          </div>
        </div>
        
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
            {artists
              .filter(a => 
                a.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                a.email?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(artist => (
                <div key={artist.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center text-center group">
                  <div className="w-12 h-12 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-lg mb-3">
                    {artist.displayName?.[0] || 'A'}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1">
                    {artist.displayName}
                    {artist.isVerified && <BadgeCheck size={14} className="text-brand-blue fill-brand-blue/10" />}
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">{artist.email}</p>
                  
                  <button 
                    onClick={() => handleToggleVerification(artist.id, !!artist.isVerified)}
                    disabled={isVerifying === artist.id}
                    className={`mt-4 w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      artist.isVerified 
                        ? 'bg-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600' 
                        : 'bg-brand-blue text-white hover:bg-slate-900 shadow-lg shadow-brand-blue/20'
                    }`}
                  >
                    {isVerifying === artist.id ? (
                      <Loader2 size={12} className="animate-spin mx-auto" />
                    ) : artist.isVerified ? 'Remove Verification' : 'Verify Artist'}
                  </button>
                </div>
              ))}
          </div>
          {artists.length === 0 && (
              <div className="p-12 text-center text-gray-400 italic">No artists registered on the platform yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
