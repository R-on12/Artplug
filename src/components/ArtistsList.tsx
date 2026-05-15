import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  limit, 
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { BadgeCheck, Users, ArrowRight, Loader2 } from 'lucide-react';

interface Artwork {
  id: string;
  image: string;
  title: string;
}

interface ArtistWithWorks {
  id: string;
  displayName: string;
  isVerified?: boolean;
  photoURL?: string;
  artworks: Artwork[];
}

interface ArtistsListProps {
  onArtistClick: (id: string, name: string) => void;
  onBrowseGallery: () => void;
}

const MOCK_ARTISTS: ArtistWithWorks[] = [
  {
    id: 'm1',
    displayName: 'Kojo Mensah',
    isVerified: true,
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    artworks: [
      { id: '1', title: 'Neon Silence', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=400' },
      { id: '11', title: 'Virtual Horizon', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400' }
    ]
  },
  {
    id: 'm2',
    displayName: 'Sarah Chen',
    isVerified: true,
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    artworks: [
      { id: '2', title: 'Ethereal Flow', image: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=400' }
    ]
  },
  {
    id: 'm3',
    displayName: 'Lisa Wang',
    isVerified: false,
    photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
    artworks: [
      { id: '6', title: 'Concrete Jungle', image: 'https://images.unsplash.com/photo-1493119508027-2b584f234d6c?auto=format&fit=crop&q=80&w=400' }
    ]
  }
];

export default function ArtistsList({ onArtistClick, onBrowseGallery }: ArtistsListProps) {
  const [artists, setArtists] = useState<ArtistWithWorks[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        // 1. Fetch artists
        const artistsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'artist'),
          limit(20)
        );
        const artistsSnapshot = await getDocs(artistsQuery);
        
        const artistsData: ArtistWithWorks[] = [];

        for (const artistDoc of artistsSnapshot.docs) {
          const artist = artistDoc.data();
          
          // 2. Fetch their top 3 works
          const worksQuery = query(
            collection(db, 'artworks'),
            where('artistId', '==', artistDoc.id),
            orderBy('createdAt', 'desc'),
            limit(3)
          );
          const worksSnapshot = await getDocs(worksQuery);
          const works = worksSnapshot.docs.map(d => ({ 
            id: d.id, 
            image: d.data().image,
            title: d.data().title
          }));

          artistsData.push({
            id: artistDoc.id,
            displayName: artist.displayName || 'Anonymous Artist',
            isVerified: artist.isVerified,
            photoURL: artist.photoURL,
            artworks: works
          });
        }

        setArtists(artistsData.length > 0 ? artistsData : MOCK_ARTISTS);
      } catch (error) {
        console.error('Failed to fetch artists:', error);
        setArtists(MOCK_ARTISTS);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-brand-blue" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Curating the collective...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <h1 className="text-5xl md:text-7xl font-display font-black text-slate-900 tracking-tight mb-4">
            DISCOVER<br/>ARTISTS<span className="text-brand-blue">.</span>
          </h1>
          <p className="text-lg text-gray-400 font-light max-w-xl">
            Meet the visionaries behind the works. Browse their collections and styles at a glance.
          </p>
        </div>
        <button 
          onClick={onBrowseGallery}
          className="flex items-center gap-2 group text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-brand-blue transition-colors"
        >
          Back to Main Gallery <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="space-y-12">
        {artists.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
            <Users size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 italic">No verified artists found. Be the first to join!</p>
          </div>
        ) : (
          artists.map((artist) => (
            <motion.div 
              key={artist.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col lg:flex-row group hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-500"
            >
              {/* Artist Info Panel */}
              <div className="p-8 lg:p-12 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col justify-between bg-gray-50/30">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-2xl mb-6 overflow-hidden">
                    {artist.photoURL ? (
                      <img 
                        src={artist.photoURL} 
                        alt={artist.displayName} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span>{artist.displayName[0]}</span>
                    )}
                  </div>
                  <h3 className="text-2xl font-display font-black text-slate-900 flex items-center gap-2 mb-2">
                    {artist.displayName}
                    {artist.isVerified && <BadgeCheck size={20} className="text-brand-blue fill-brand-blue/10" />}
                  </h3>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Curated Member</p>
                </div>
                
                <button 
                  onClick={() => onArtistClick(artist.id, artist.displayName)}
                  className="mt-8 flex items-center gap-2 bg-slate-900 text-white w-fit px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-blue transition-all"
                >
                  View Profile <ArrowRight size={14} />
                </button>
              </div>

              {/* Work Preview Gallery */}
              <div className="p-8 lg:p-12 lg:w-2/3">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Featured collection</h4>
                  <span className="text-[10px] font-bold text-brand-blue">{artist.artworks.length} Works</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 md:gap-8">
                  {artist.artworks.length > 0 ? (
                    artist.artworks.map((work) => (
                      <motion.div 
                        key={work.id}
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="group/work relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 shadow-sm"
                      >
                        <img 
                          src={work.image} 
                          alt={work.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/work:opacity-100 transition-opacity flex items-end p-4">
                          <p className="text-white text-[9px] font-black uppercase tracking-widest truncate">{work.title}</p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-3 py-12 flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-100 rounded-3xl">
                      <p className="text-xs italic">Collection coming soon</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
