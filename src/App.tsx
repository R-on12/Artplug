import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy,
  where 
} from 'firebase/firestore';
import { auth, db, signIn, signOutUser, handleFirestoreError, OperationType } from './lib/firebase';
import { CURRENCY_RATES, formatPrice } from './lib/currency';
import { 
  LogOut,
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';
import Navbar from './components/Navbar';
import ArtCard from './components/ArtCard';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import Checkout from './components/Checkout';
import ArtistDashboard from './components/ArtistDashboard';
import ArtistProfile from './components/ArtistProfile';
import ArtistsList from './components/ArtistsList';

interface Artwork {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  price: string;
  image: string;
  medium?: string;
}

const MOCK_ARTWORKS = [
  { id: '1', title: "Neon Silence", artist: "Kojo Mensah", price: "1200", image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=800", medium: "Digital Painting" },
  { id: '2', title: "Ethereal Flow", artist: "Sarah Chen", price: "850", image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800", medium: "Traditional Painting" },
  { id: '3', title: "Urban Pulse", artist: "David R.", price: "2400", image: "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=800", medium: "Photography" },
  { id: '4', title: "Digital Soul", artist: "Elena Rossi", price: "400", image: "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?auto=format&fit=crop&q=80&w=800", medium: "Digital Painting" },
  { id: '5', title: "Liquid Dreams", artist: "Marcus Thorne", price: "1800", image: "https://images.unsplash.com/photo-1547891124-4d22f02c6707?auto=format&fit=crop&q=80&w=800", medium: "Acrylic Painting" },
  { id: '6', title: "Concrete Jungle", artist: "Lisa Wang", price: "950", image: "https://images.unsplash.com/photo-1493119508027-2b584f234d6c?auto=format&fit=crop&q=80&w=800", medium: "Photography" },
  { id: '7', title: "Golden Hour", artist: "James Miller", price: "3200", image: "https://images.unsplash.com/photo-1525909002-1b05e0c869d8?auto=format&fit=crop&q=80&w=800", medium: "Oil Painting" },
  { id: '8', title: "Midnight Jazz", artist: "Sufiya K.", price: "1500", image: "https://images.unsplash.com/photo-1501472312651-726afe119ff1?auto=format&fit=crop&q=80&w=800", medium: "Contemporary Arts" },
  { id: '9', title: "Whispers of Oak", artist: "Thomas Reed", price: "600", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800", medium: "Pencil Art" },
  { id: '10', title: "Crimson Bloom", artist: "Isabella Cruz", price: "1100", image: "https://images.unsplash.com/photo-1459908676235-d5f02a50184b?auto=format&fit=crop&q=80&w=800", medium: "Pastel Art" },
  { id: '11', title: "Virtual Horizon", artist: "Alex Rivera", price: "2000", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800", medium: "Digital Painting" },
  { id: '12', title: "The Architect", artist: "Sofia Dupont", price: "4500", image: "https://images.unsplash.com/photo-1508898578281-774ac4893c0c?auto=format&fit=crop&q=80&w=800", medium: "Contemporary Arts" },
];

export default function App() {
  const [view, setView] = useState<'gallery' | 'profile' | 'admin' | 'checkout' | 'artist-dashboard' | 'artist-profile' | 'artists-list'>('gallery');
  const [user, setUser] = useState<User | null>(null);
  const [artistApp, setArtistApp] = useState<{ status: string } | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<{ id: string, name: string } | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedium, setSelectedMedium] = useState('All');
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    // Fetch currency from platform settings
    const fetchSettings = async () => {
      try {
        const settingsSnapshot = await getDocs(collection(db, 'settings'));
        const currencySetting = settingsSnapshot.docs.find(d => d.id === 'platform')?.data()?.currency;
        if (currencySetting) setCurrency(currencySetting);
      } catch (e) {
        console.error('Error fetching settings', e);
      }
    };
    fetchSettings();
  }, []);

  // Deep Navigation Hash Listener
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#studio' && user && artistApp?.status === 'approved') {
        setView('artist-dashboard');
      } else if (hash === '#profile' && user) {
        setSelectedArtist({ id: user.uid, name: user.displayName || 'Me' });
        setView('artist-profile');
      }
      // Reset hash
      if (hash) window.history.replaceState(null, '', ' ');
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial check
    if (window.location.hash) handleHashChange();
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user, artistApp]);

  // Form State
  const [artistName, setArtistName] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [creativeMedium, setCreativeMedium] = useState('Digital Painting');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Check for artist status
        try {
          const q = query(collection(db, 'applications'), where('userId', '==', u.uid));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            setArtistApp({ status: data.status });
          } else {
            setArtistApp(null);
          }
        } catch (e) {
          console.error('Error fetching artist status', e);
        }
      } else {
        setArtistApp(null);
      }

      if (!u && (view === 'profile' || view === 'admin' || view === 'artist-dashboard')) {
        setView('gallery');
      }
      // Basic client-side admin guard
      if (u && view === 'admin' && u.email !== 'coopedill@gmail.com') {
        setView('gallery');
      }
    });
    return () => unsubscribe();
  }, [view]);

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        const q = query(collection(db, 'artworks'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Artwork));
        
        // If Firestore is empty, we show mock data for demonstration
        setArtworks(docs.length > 0 ? docs : MOCK_ARTWORKS);
      } catch (error) {
        console.error('Failed to fetch artworks', error);
        setArtworks(MOCK_ARTWORKS);
      } finally {
        setLoading(false);
      }
    };

    fetchArtworks();
  }, []);

  const filteredArtworks = artworks.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         art.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMedium = selectedMedium === 'All' || art.medium === selectedMedium;
    return matchesSearch && matchesMedium;
  });

  const handleLogin = async () => {
    try {
      await signIn();
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        console.error('Popup blocked');
        // We could also set a state to show a UI message instead of alert
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.log('Login cancelled');
      } else {
        console.error('Login error:', error);
      }
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to apply.');
      return;
    }

    setSubmitting(true);
    try {
      const appData = {
        artistName,
        portfolioLink,
        creativeMedium,
        status: 'pending',
        userId: user.uid,
        createdAt: serverTimestamp(),
      };
      
      await addDoc(collection(db, 'applications'), appData);
      setSubmitted(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'applications');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gallery-bg selection:bg-brand-blue selection:text-white font-sans text-black overflow-x-hidden">
      <Navbar 
        setView={setView} 
        currentView={view} 
        user={user}
        isArtist={artistApp?.status === 'approved'}
        onLogin={handleLogin}
        onLogout={signOutUser}
      />
      
      <AnimatePresence mode="wait">
        {view === 'gallery' ? (
          <motion.main 
            key="gallery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[calc(100vh-160px)]"
          >
            {/* Sidebar / Hero Message */}
            <div className="w-full md:w-1/3 p-8 md:p-12 flex flex-col justify-between border-r border-gray-100 bg-white">
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-6xl md:text-8xl font-display font-black leading-[0.9] tracking-tighter mb-8 text-black"
                >
                  CURATED<br/>WORKS<span className="text-brand-blue">.</span>
                </motion.h1>
                <p className="text-xl text-gray-400 font-light leading-relaxed max-w-sm">
                  The high-fidelity connection between global creators and intentional collectors.
                </p>
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="w-full md:w-2/3 p-8 md:p-12 bg-gray-50/50 overflow-y-auto">
              {/* Search Pane */}
              <div className="mb-12 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text"
                    placeholder="Search by title or artist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white pl-12 pr-4 py-4 rounded-2xl border border-gray-100 shadow-sm focus:border-brand-blue outline-none transition-all"
                  />
                </div>
                <div className="flex gap-4">
                  <select 
                    value={selectedMedium}
                    onChange={(e) => setSelectedMedium(e.target.value)}
                    className="bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm font-bold text-xs uppercase tracking-widest outline-none focus:border-brand-blue appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_1.2rem_center] bg-no-repeat pr-12 cursor-pointer hover:border-brand-blue/30 transition-all animate-in fade-in slide-in-from-top-1 duration-500"
                  >
                    <option>All</option>
                    <option>Digital Painting</option>
                    <option>Traditional Painting</option>
                    <option>Acrylic Painting</option>
                    <option>Photography</option>
                    <option>Pencil Art</option>
                    <option>Pastel Art</option>
                    <option>Oil Painting</option>
                    <option>Contemporary Arts</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                      <div className="bg-gray-200 aspect-[4/5] rounded-xl mb-4" />
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {filteredArtworks.length === 0 ? (
                    <div className="col-span-2 py-20 text-center">
                      <p className="text-gray-400 italic">No masterpieces found matching your search.</p>
                      <button 
                        onClick={() => { setSearchQuery(''); setSelectedMedium('All'); }}
                        className="mt-4 text-brand-blue font-bold text-xs uppercase tracking-widest"
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    filteredArtworks.map(art => {
                      const { id, title, artist, price, image, artistId } = art as any;
                      return (
                        <ArtCard 
                          key={id}
                          id={id}
                          title={title}
                          artist={artist}
                          artistId={artistId}
                          price={price}
                          image={image}
                          currencyCode={currency}
                          onArtistClick={(id, name) => {
                            setSelectedArtist({ id, name });
                            setView('artist-profile');
                          }}
                          onBuy={() => {
                            if (!user) {
                              handleLogin();
                              return;
                            }
                            setSelectedArtwork(art);
                            setView('checkout');
                          }}
                        />
                      );
                    })
                  )}
                </div>
              )}


            </div>
          </motion.main>
        ) : view === 'profile' && user ? (
          <Profile user={user} />
        ) : view === 'admin' && user && user.email === 'coopedill@gmail.com' ? (
          <AdminDashboard />
        ) : view === 'artist-dashboard' && user && artistApp?.status === 'approved' ? (
          <ArtistDashboard />
        ) : view === 'artist-profile' && selectedArtist ? (
          <ArtistProfile 
            artistId={selectedArtist.id} 
            artistName={selectedArtist.name}
            currencyCode={currency}
            onBack={() => setView('gallery')}
            onBuy={(art) => {
              if (!user) {
                handleLogin();
                return;
              }
              setSelectedArtwork(art);
              setView('checkout');
            }}
          />
        ) : view === 'artists-list' ? (
          <ArtistsList 
            onArtistClick={(id, name) => {
              setSelectedArtist({ id, name });
              setView('artist-profile');
            }}
            onBrowseGallery={() => setView('gallery')}
          />
        ) : view === 'checkout' && selectedArtwork ? (
          <Checkout 
            artwork={selectedArtwork} 
            currencyCode={currency}
            onBack={() => setView('gallery')}
            onSuccess={() => {
              alert(`Congratulations! You have successfully acquired "${selectedArtwork.title}".`);
              setView('gallery');
            }}
          />
        ) : null}
      </AnimatePresence>

      <footer className="py-6 px-6 md:px-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-white">
        <div className="flex items-center space-x-6">
          <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-brand-blue">
            <span className="w-2 h-2 rounded-full bg-brand-blue mr-2 animate-pulse"></span>
            Stripe Connected
          </div>
          <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <span className="w-2 h-2 rounded-full bg-gray-300 mr-2"></span>
            Cloudinary Shield Active
          </div>
        </div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] text-center">
          Artplug Eco-System © 2026 v2.4.0
        </div>
      </footer>
    </div>
  );
}

