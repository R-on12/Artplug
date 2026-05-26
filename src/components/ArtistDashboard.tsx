import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  BarChart3, 
  Plus, 
  Image as ImageIcon, 
  Trash2, 
  LayoutDashboard,
  ShoppingBag,
  DollarSign,
  Loader2,
  Settings,
  Instagram,
  Twitter,
  Globe,
  Save,
  CheckCircle2,
  Users,
  MessageSquare,
  Calendar,
  ChevronRight,
  TrendingUp,
  Clock,
  ExternalLink,
  BadgeCheck,
  Upload
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import ImageUpload from './ImageUpload';

interface Artwork {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  price: string;
  image: string;
  medium: string;
  status: 'available' | 'sold';
  createdAt: any;
}

interface Sale {
  id: string;
  title: string;
  price: string;
  buyerEmail: string;
  buyerId?: string;
  createdAt: any;
}

interface Follower {
  id: string;
  followerId: string;
  followerName: string;
  createdAt: any;
}

interface Comment {
  id: string;
  text: string;
  authorName: string;
  targetType: string;
  createdAt: any;
}

interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  service: string;
  status: string;
  createdAt: any;
}

export default function ArtistDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'artworks' | 'sales' | 'followers' | 'comments' | 'bookings' | 'profile'>('overview');
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Profile State
  const [profileData, setProfileData] = useState({
    displayName: '',
    bio: '',
    photoURL: ''
  });
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    twitter: '',
    x: '',
    website: ''
  });
  const [isVerified, setIsVerified] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingLinks, setIsSavingLinks] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [medium, setMedium] = useState('Digital Painting');

  const fetchData = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      // Fetch Artworks
      const artQuery = query(
        collection(db, 'artworks'), 
        where('artistId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const artSnapshot = await getDocs(artQuery);
      setArtworks(artSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Artwork)));

      // Fetch Sales
      const salesQuery = query(
        collection(db, 'sales'), 
        where('artistId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const salesSnapshot = await getDocs(salesQuery);
      setSales(salesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Sale)));

      // Fetch Followers
      const followersQuery = query(
        collection(db, 'users', auth.currentUser.uid, 'followers'),
        orderBy('createdAt', 'desc')
      );
      const followersSnapshot = await getDocs(followersQuery);
      setFollowers(followersSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Follower)));

      // Fetch Comments
      const commentsQuery = query(
        collection(db, 'comments'),
        where('targetId', '==', auth.currentUser.uid),
        where('targetType', '==', 'artist'),
        orderBy('createdAt', 'desc')
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      setComments(commentsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Comment)));

      // Fetch Bookings
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('artistId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      setBookings(bookingsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));

      // Fetch User Profile
      const { getDoc } = await import('firebase/firestore');
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfileData({
          displayName: userData.displayName || auth.currentUser.displayName || '',
          bio: userData.bio || '',
          photoURL: userData.photoURL || auth.currentUser.photoURL || ''
        });
        if (userData.socialLinks) setSocialLinks(userData.socialLinks);
        if (userData.isVerified) setIsVerified(userData.isVerified);
      }

    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'artist_data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    try {
      await addDoc(collection(db, 'artworks'), {
        title,
        price,
        image: imageUrl,
        medium,
        artist: auth.currentUser.displayName || 'Artist',
        artistId: auth.currentUser.uid,
        isVerified,
        status: 'available',
        createdAt: serverTimestamp()
      });
      
      setTitle('');
      setPrice('');
      setImageUrl('');
      setMedium('Digital Painting');
      setIsAdding(false);
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'artworks');
    }
  };

  const handleDeleteArtwork = async (id: string) => {
    if (!window.confirm('Delete this artwork listing?')) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'artworks', id));
      setArtworks(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `artworks/${id}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateSocialLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsSavingLinks(true);
    setSaveSuccess(false);
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        socialLinks
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    } finally {
      setIsSavingLinks(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsSavingProfile(true);
    setProfileSaveSuccess(false);
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      const { updateProfile } = await import('firebase/auth');
      
      // Update Firestore
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        displayName: profileData.displayName,
        bio: profileData.bio,
        photoURL: profileData.photoURL
      });

      // Update Auth Profile if changed
      if (profileData.displayName !== auth.currentUser.displayName || profileData.photoURL !== auth.currentUser.photoURL) {
        await updateProfile(auth.currentUser, {
          displayName: profileData.displayName,
          photoURL: profileData.photoURL
        });
      }

      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-brand-blue" size={32} />
      </div>
    );
  }

  const totalEarnings = sales.reduce((acc, sale) => acc + parseFloat(sale.price.replace(',', '')), 0);

  // Prepare chart data (simple daily grouping for the last 7 items)
  const chartData = [...sales].reverse().slice(-7).map(s => ({
    date: s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'New',
    amount: parseFloat(s.price.replace(',', ''))
  }));

  const recentActivity = [
    ...sales.map(s => ({ type: 'sale', date: s.createdAt, title: `Acquisition: ${s.title}`, detail: `Sold to ${s.buyerEmail}` })),
    ...comments.map(c => ({ type: 'comment', date: c.createdAt, title: `New Feedback`, detail: `"${c.text.slice(0, 30)}..." from ${c.authorName}` })),
    ...bookings.map(b => ({ type: 'booking', date: b.createdAt, title: `Service Request`, detail: `${b.service} - ${b.status}` }))
  ].sort((a, b) => {
    const timeA = a.date?.toMillis ? a.date.toMillis() : Date.now();
    const timeB = b.date?.toMillis ? b.date.toMillis() : Date.now();
    return timeB - timeA;
  }).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">Studio Dashboard<span className="text-brand-blue">.</span></h1>
          <p className="text-gray-400 mt-2">Manage your collection and track your marketplace performance.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => window.location.hash = '#profile'}
            className="flex items-center justify-center gap-2 bg-white border-2 border-slate-900 text-slate-900 px-6 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95"
          >
            <ExternalLink size={16} /> View Public Studio
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center justify-center gap-2 bg-black text-white px-6 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-blue transition-all shadow-lg active:scale-95"
          >
            {isAdding ? 'Cancel' : <><Plus size={16} /> New Artwork</>}
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-4 mb-12 border-b border-gray-100 pb-6">
        {[
          { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
          { id: 'artworks', icon: ImageIcon, label: 'Collection' },
          { id: 'sales', icon: ShoppingBag, label: 'Sales' },
          { id: 'followers', icon: Users, label: 'Followers' },
          { id: 'comments', icon: MessageSquare, label: 'Feedback' },
          { id: 'bookings', icon: Calendar, label: 'Bookings' },
          { id: 'profile', icon: Settings, label: 'Artist Identity' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                : 'text-gray-400 hover:text-slate-900 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-12">
          
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm group hover:border-brand-blue/30 transition-all">
                  <div className="p-3 bg-blue-50 text-brand-blue rounded-2xl w-fit mb-4">
                    <DollarSign size={24} />
                  </div>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Net Revenue</p>
                  <h2 className="text-3xl font-display font-black text-slate-900 mt-1">${totalEarnings.toLocaleString()}</h2>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm group hover:border-brand-blue/30 transition-all">
                  <div className="p-3 bg-green-50 text-green-600 rounded-2xl w-fit mb-4">
                    <Users size={24} />
                  </div>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Followers</p>
                  <h2 className="text-3xl font-display font-black text-slate-900 mt-1">{followers.length}</h2>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm group hover:border-brand-blue/30 transition-all">
                  <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl w-fit mb-4">
                    <MessageSquare size={24} />
                  </div>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Feedback</p>
                  <h2 className="text-3xl font-display font-black text-slate-900 mt-1">{comments.length}</h2>
                </div>
              </div>

              {/* Chart Section */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Revenue Flow</h3>
                    <p className="text-xs text-gray-400 mt-1">Growth trajectory based on recent acquisitions</p>
                  </div>
                  <div className="flex items-center gap-2 text-green-500 font-bold text-xs uppercase tracking-widest">
                    <TrendingUp size={16} /> +12% Growth
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorAmount)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Latest Activity Log */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-slate-900">Activity Monitor</h3>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <Clock size={14} /> Real-time stream
                  </div>
                </div>
                <div className="space-y-4">
                  {recentActivity.map((activity, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all cursor-default"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          activity.type === 'sale' ? 'bg-green-100 text-green-600' :
                          activity.type === 'comment' ? 'bg-blue-100 text-blue-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {activity.type === 'sale' ? <DollarSign size={18} /> : 
                           activity.type === 'comment' ? <MessageSquare size={18} /> : 
                           <Calendar size={18} />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{activity.title}</p>
                          <p className="text-xs text-gray-400">{activity.detail}</p>
                        </div>
                      </div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-gray-300">
                        {activity.date?.toDate ? activity.date.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </div>
                    </motion.div>
                  ))}
                  {recentActivity.length === 0 && (
                    <div className="py-12 text-center text-gray-300 italic text-sm">
                      Waiting for incoming signals...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'artworks' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ImageIcon size={20} className="text-brand-blue" />
                  Visual Legacy
                </h3>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
                  {artworks.length} Masterpieces
                </p>
              </div>

              {isAdding && (
                <section className="bg-gray-50 p-8 rounded-[2rem] border-2 border-dashed border-gray-200">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Plus size={20} className="text-brand-blue" />
                    List New Masterpiece
                  </h3>
                  <form onSubmit={handleAddArtwork} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Artwork Title</label>
                      <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Neon Dreams" className="w-full p-4 rounded-xl border border-gray-200 focus:border-brand-blue outline-none transition-all bg-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Price (USD)</label>
                      <input value={price} onChange={e => setPrice(e.target.value)} required placeholder="e.g. 1,200" className="w-full p-4 rounded-xl border border-gray-200 focus:border-brand-blue outline-none transition-all bg-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Creative Medium</label>
                      <select value={medium} onChange={e => setMedium(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200 focus:border-brand-blue outline-none transition-all bg-white">
                        <option>Pencil Art</option>
                        <option>Pastel Art</option>
                        <option>Water colour Art</option>
                        <option>Digital Illustration</option>
                        <option>Oil Painting</option>
                        <option>Digital Painting</option>
                        <option>Contemporary Arts</option>
                        <option>Photography</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <ImageUpload 
                        label="Masterpiece Visual" 
                        currentUrl={imageUrl} 
                        onUpload={setUrl => setImageUrl(setUrl)} 
                        aspectRatio="portrait"
                      />
                    </div>
                    <div className="md:col-span-2 pt-4">
                      <button type="submit" className="w-full bg-brand-blue text-white font-black py-4 rounded-xl uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-200">
                        Publish to Gallery
                      </button>
                    </div>
                  </form>
                </section>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {artworks.length === 0 ? (
                  <div className="col-span-2 text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100 italic text-gray-400">
                    No works listed yet. Start by clicking 'New Artwork'.
                  </div>
                ) : (
                  artworks.map(art => (
                    <motion.div key={art.id} whileHover={{ y: -10 }} className="group bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                      <div className="aspect-[4/5] relative overflow-hidden">
                        <img src={art.image} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute top-4 right-4 flex gap-2">
                          <button onClick={() => handleDeleteArtwork(art.id)} className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          art.status === 'available' ? 'bg-green-500/80' : 'bg-slate-900/80'
                        } backdrop-blur text-white`}>
                          {art.status}
                        </div>
                      </div>
                      <div className="p-6">
                        <h4 className="font-bold text-slate-900">{art.title}</h4>
                        <p className="text-brand-blue font-black text-sm mt-1">${art.price}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'followers' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Users size={20} className="text-brand-blue" />
                Community Base
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {followers.map(f => (
                  <div key={f.id} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
                      {f.followerName[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{f.followerName}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">Collector</p>
                    </div>
                  </div>
                ))}
                {followers.length === 0 && (
                  <div className="col-span-2 py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                    <p className="text-gray-400 italic">No followers yet. Curate more work to attract collectors!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'comments' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare size={20} className="text-brand-blue" />
                Global Feedback
              </h3>
              <div className="space-y-4">
                {comments.map(c => (
                  <div key={c.id} className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-blue text-white flex items-center justify-center font-bold">
                          {c.authorName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{c.authorName}</p>
                          <p className="text-[9px] text-gray-400 uppercase tracking-widest">
                            {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString() : 'Recent'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed italic">"{c.text}"</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                    <p className="text-gray-400 italic">No feedback received yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'bookings' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Calendar size={20} className="text-brand-blue" />
                Commissions & Bookings
              </h3>
              <div className="space-y-4">
                {bookings.map(b => (
                  <div key={b.id} className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm group">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                          <Clock size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{b.service}</h4>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest">{b.clientEmail}</p>
                        </div>
                      </div>
                      <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        b.status === 'pending' ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'
                      }`}>
                        {b.status}
                      </div>
                    </div>
                  </div>
                ))}
                {bookings.length === 0 && (
                  <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                    <Users size={32} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 italic">No active booking requests.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-gray-100 shadow-sm">
                <h3 className="text-2xl font-display font-black text-slate-900 mb-8">Refine Your Identity</h3>
                
                <form onSubmit={handleUpdateProfile} className="space-y-8">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="md:w-1/3">
                      <ImageUpload 
                        label="Identity Visual" 
                        currentUrl={profileData.photoURL} 
                        onUpload={url => setProfileData(prev => ({ ...prev, photoURL: url }))} 
                      />
                      <p className="mt-4 text-[10px] text-gray-400 font-black uppercase tracking-widest leading-relaxed">
                        Your visual avatar as it appears to collectors globally.
                      </p>
                    </div>

                    <div className="md:w-2/3 space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Display Name</label>
                        <input 
                          value={profileData.displayName}
                          onChange={e => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                          className="w-full p-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-brand-blue transition-all font-bold"
                          placeholder="e.g. Victor Thorne"
                        />
                      </div>
                      <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl text-brand-blue">
                          <CheckCircle2 size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-brand-blue">Identity Locked</p>
                          <p className="text-xs text-blue-900 font-medium">Your profile information is secured on our global visual registry.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Artist Statement / Bio</label>
                    <textarea 
                      value={profileData.bio}
                      onChange={e => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full p-6 rounded-[2rem] bg-gray-50 border-none outline-none focus:ring-2 focus:ring-brand-blue transition-all h-48 resize-none text-slate-800 leading-relaxed"
                      placeholder="Tell the world about your creative philosophy, influences, and journey..."
                    />
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={isSavingProfile}
                      className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-brand-blue transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isSavingProfile ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : profileSaveSuccess ? (
                        <><CheckCircle2 size={16} /> Identity Secured</>
                      ) : (
                        <><Save size={16} /> Commit Profile Changes</>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Security & Verification Card */}
              <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white overflow-hidden relative">
                <div className="relative z-10">
                  <h3 className="text-2xl font-display font-black mb-4">Master Verification</h3>
                  <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
                    Verified profiles enjoy 24% higher engagement and placement in the "Featured Collections" section.
                  </p>
                  <div className="flex items-center gap-4">
                    {isVerified ? (
                      <div className="flex items-center gap-3 px-6 py-3 bg-green-500/20 text-green-400 rounded-full font-black text-[10px] uppercase tracking-widest">
                        <BadgeCheck size={18} /> Fully Verified Artist
                      </div>
                    ) : (
                      <button className="px-8 py-4 bg-brand-blue text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all">
                        Request Verification
                      </button>
                    )}
                  </div>
                </div>
                <div className="absolute -right-20 -bottom-20 opacity-10">
                  <CheckCircle2 size={300} />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'sales' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag size={20} className="text-brand-blue" />
                Acquisition History
              </h3>
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {sales.map(sale => (
                    <div key={sale.id} className="p-8 hover:bg-gray-50 transition-colors flex justify-between items-center">
                      <div className="flex items-center gap-6">
                        <div className="p-4 bg-blue-50 text-brand-blue rounded-2xl">
                          <DollarSign size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{sale.title}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Buyer: {sale.buyerEmail}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-brand-blue font-black text-xl">${sale.price}</p>
                        <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-widest">
                          {sale.createdAt?.toDate ? sale.createdAt.toDate().toLocaleDateString() : 'Just now'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {sales.length === 0 && (
                    <div className="p-20 text-center text-gray-400 italic">
                      No sales recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Sidebar - Shared Info */}
        <div className="space-y-8">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200">
            <h4 className="font-display font-black text-xl mb-4">Studio Status</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <CheckCircle2 size={14} className={isVerified ? 'text-green-500' : 'text-gray-600'} /> Verified
                </div>
                <span className={`text-[10px] font-bold ${isVerified ? 'text-green-400' : 'text-gray-500'}`}>
                  {isVerified ? 'ACTIVE' : 'PENDING'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <BarChart3 size={14} /> Tier
                </div>
                <span className="text-[10px] font-bold text-brand-blue">ELITE ARTIST</span>
              </div>
            </div>
          </div>

          <div className="bg-brand-blue/5 p-8 rounded-[2.5rem] border border-brand-blue/10">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-brand-blue" />
              <h4 className="font-bold text-slate-900 text-sm">Growth Insights</h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              Your profile visibility is higher when you have more than 5 active pieces. Add more to your collection to stay relevant.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Views</p>
                <p className="text-sm font-bold text-slate-900 mt-1">1.2k</p>
              </div>
              <div className="bg-white p-4 rounded-2xl">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Likes</p>
                <p className="text-sm font-bold text-slate-900 mt-1">456</p>
              </div>
            </div>
          </div>

          {/* Social Links Setting */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-6">
              <Settings size={18} className="text-gray-400" />
              Connect Profiles
            </h4>
            <form onSubmit={handleUpdateSocialLinks} className="space-y-4">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Instagram size={14} /></div>
                <input placeholder="Instagram URL" value={socialLinks.instagram} onChange={e => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent focus:bg-white focus:border-brand-blue outline-none rounded-xl text-[10px] transition-all" />
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Twitter size={14} /></div>
                <input placeholder="X (Twitter) URL" value={socialLinks.x} onChange={e => setSocialLinks(prev => ({ ...prev, x: e.target.value }))} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent focus:bg-white focus:border-brand-blue outline-none rounded-xl text-[10px] transition-all" />
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Globe size={14} /></div>
                <input placeholder="Portfolio" value={socialLinks.website} onChange={e => setSocialLinks(prev => ({ ...prev, website: e.target.value }))} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent focus:bg-white focus:border-brand-blue outline-none rounded-xl text-[10px] transition-all" />
              </div>
              <button type="submit" disabled={isSavingLinks} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-black py-4 rounded-xl uppercase text-[10px] tracking-widest hover:bg-brand-blue transition-all disabled:opacity-50">
                {isSavingLinks ? <Loader2 size={16} className="animate-spin" /> : saveSuccess ? <><CheckCircle2 size={16} /> Updated</> : <><Save size={16} /> Save Links</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
