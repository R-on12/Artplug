import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getCountFromServer
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  ArrowLeft,
  Loader2,
  Instagram,
  Globe,
  Twitter,
  ExternalLink,
  BadgeCheck,
  UserPlus,
  UserCheck,
  MessageSquare,
  Send,
  Calendar,
  X,
  ChevronRight
} from 'lucide-react';
import { addDoc } from 'firebase/firestore';
import ArtCard from './ArtCard';

interface ArtistProfileProps {
  artistId: string;
  artistName: string;
  onBack: () => void;
  onBuy: (artwork: any) => void;
}

interface ArtistUser {
  id?: string;
  isVerified?: boolean;
  bio?: string;
  photoURL?: string;
  displayName?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    x?: string;
    website?: string;
  };
}

interface Comment {
  id: string;
  text: string;
  authorName: string;
  createdAt: any;
}

export default function ArtistProfile({ artistId, artistName, onBack, onBuy }: ArtistProfileProps) {
  const [artworks, setArtworks] = useState<any[]>([]);
  const [artistProfile, setArtistProfile] = useState<ArtistUser | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [activeView, setActiveView] = useState<'works' | 'about'>('works');

  // Comment State
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Booking State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingService, setBookingService] = useState('Custom Commission');
  const [bookingDetails, setBookingDetails] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const fetchData = async () => {
    try {
      setIsSelf(auth.currentUser?.uid === artistId);

      // Fetch Artworks
      const artQuery = query(
        collection(db, 'artworks'), 
        where('artistId', '==', artistId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(artQuery);
      setArtworks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch Artist User Profile for social links
      const artistDoc = await getDoc(doc(db, 'users', artistId));
      if (artistDoc.exists()) {
        setArtistProfile(artistDoc.data() as ArtistUser);
      }

      // Fetch Follower Count
      const followersColl = collection(db, 'users', artistId, 'followers');
      const countSnapshot = await getCountFromServer(followersColl);
      setFollowerCount(countSnapshot.data().count);

      // Fetch Comments
      const commentsQuery = query(
        collection(db, 'comments'),
        where('targetId', '==', artistId),
        where('targetType', '==', 'artist'),
        orderBy('createdAt', 'desc')
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      setComments(commentsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Comment)));

      // Check if following
      if (auth.currentUser) {
        const followDoc = await getDoc(doc(db, 'users', artistId, 'followers', auth.currentUser.uid));
        setIsFollowing(followDoc.exists());
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `artist_profile/${artistId}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [artistId]);

  const handleToggleFollow = async () => {
    if (!auth.currentUser) {
      alert("Please sign in to follow artists.");
      return;
    }
    
    setFollowLoading(true);
    try {
      const followDocRef = doc(db, 'users', artistId, 'followers', auth.currentUser.uid);
      
      if (isFollowing) {
        await deleteDoc(followDocRef);
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
      } else {
        await setDoc(followDocRef, {
          followerId: auth.currentUser.uid,
          followerName: auth.currentUser.displayName || 'Collector',
          createdAt: serverTimestamp()
        });
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `followers/${artistId}`);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      await addDoc(collection(db, 'comments'), {
        text: newComment,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Collector',
        targetId: artistId,
        targetType: 'artist',
        createdAt: serverTimestamp()
      });
      setNewComment('');
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'comments');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsSubmittingBooking(true);
    try {
      await addDoc(collection(db, 'bookings'), {
        artistId: artistId,
        clientId: auth.currentUser.uid,
        clientName: auth.currentUser.displayName || 'Client',
        clientEmail: auth.currentUser.email || '',
        service: bookingService,
        details: bookingDetails,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setIsBookingModalOpen(false);
        setBookingDetails('');
      }, 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bookings');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
      {/* Booking Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight">Commission Artist<span className="text-brand-blue">.</span></h3>
              <button onClick={() => setIsBookingModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleBooking} className="p-8 space-y-6">
              {bookingSuccess ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                    <Calendar size={40} />
                  </div>
                  <h4 className="text-xl font-bold">Request Sent!</h4>
                  <p className="text-gray-500 text-sm">{artistName} will be in touch via email soon.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Project Type</label>
                    <select 
                      value={bookingService} 
                      onChange={e => setBookingService(e.target.value)}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                    >
                      <option>Custom Commission</option>
                      <option>Commercial Project</option>
                      <option>Studio Visit</option>
                      <option>Workshop/Class</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Brief Details</label>
                    <textarea 
                      required
                      value={bookingDetails}
                      onChange={e => setBookingDetails(e.target.value)}
                      placeholder="Describe your vision or project requirements..."
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-brand-blue transition-all h-32 resize-none"
                    />
                  </div>
                  <button 
                    disabled={isSubmittingBooking}
                    className="w-full bg-brand-blue text-white font-black py-5 rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-brand-blue/20 disabled:opacity-50"
                  >
                    {isSubmittingBooking ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Send Request'}
                  </button>
                </>
              )}
            </form>
          </motion.div>
        </div>
      )}

      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors mb-8 group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-widest">Back to Gallery</span>
      </button>

      <header className="mb-16">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {artistProfile?.photoURL ? (
              <div 
                onClick={() => isSelf && (window.location.hash = '#studio')}
                className={`w-32 h-32 md:w-48 md:h-48 rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl flex-shrink-0 ${isSelf ? 'cursor-pointer hover:ring-4 hover:ring-brand-blue/30 transition-all' : ''}`}
              >
                <img src={artistProfile.photoURL} alt={artistName} className="w-full h-full object-cover" />
                {isSelf && (
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Update Photo</span>
                  </div>
                )}
              </div>
            ) : (
              <div 
                onClick={() => isSelf && (window.location.hash = '#studio')}
                className={`w-32 h-32 md:w-48 md:h-48 rounded-[3rem] bg-slate-900 text-white flex items-center justify-center text-5xl font-black shadow-2xl flex-shrink-0 ${isSelf ? 'cursor-pointer hover:bg-brand-blue transition-colors' : ''}`}
              >
                {artistName[0]}
              </div>
            )}
            
            <div className="pt-4">
              <h1 
                onClick={() => isSelf && (window.location.hash = '#studio')}
                className={`text-5xl md:text-7xl font-display font-black text-slate-900 tracking-tight mb-4 flex items-center gap-4 ${isSelf ? 'cursor-pointer hover:text-brand-blue transition-colors' : ''}`}
              >
                {artistProfile?.displayName || artistName}
                {artistProfile?.isVerified && (
                  <div className="bg-brand-blue/10 p-2 rounded-2xl">
                    <BadgeCheck size={32} className="text-brand-blue fill-brand-blue/10" />
                  </div>
                )}
                <span className="text-brand-blue">.</span>
              </h1>
              <p className="text-lg text-gray-400 font-light max-w-xl leading-relaxed">
                {artistProfile?.bio || "Curated artist specializing in contemporary visual legacies. Each piece is a testament to the intersection of vision and craft."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 md:pt-4">
            {isSelf && (
              <button 
                onClick={() => window.location.hash = '#studio'} 
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-blue transition-all shadow-lg active:scale-95 flex items-center gap-2 group"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Manage Studio
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
            {!isSelf && (
              <button 
                onClick={() => setIsBookingModalOpen(true)}
                className="px-8 py-4 bg-white border-2 border-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-lg active:scale-95"
              >
                Book/Commission
              </button>
            )}
            {artistProfile?.socialLinks?.instagram && (
              <a 
                href={artistProfile.socialLinks.instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 bg-white border border-gray-100 rounded-xl hover:text-brand-blue transition-all shadow-sm hover:shadow-md flex items-center"
              >
                <Instagram size={20} />
              </a>
            )}
            {artistProfile?.socialLinks?.website && (
              <a 
                href={artistProfile.socialLinks.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 bg-white border border-gray-100 rounded-xl hover:text-brand-blue transition-all shadow-sm hover:shadow-md flex items-center"
              >
                <Globe size={20} />
              </a>
            )}
          </div>
        </div>
        
        <div className="mt-12 flex gap-12 border-b border-gray-100 pb-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          <div>
            <span className="text-slate-900 block text-2xl font-display mb-1">{followerCount}</span>
            Followers
          </div>
          <div>
            <span className="text-slate-900 block text-2xl font-display mb-1">{artworks.length}</span>
            Total Works
          </div>
          <div className="ml-auto flex items-center">
            {!isSelf && (
              <button 
                onClick={handleToggleFollow}
                disabled={followLoading}
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 ${
                  isFollowing 
                    ? 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 shadow-none' 
                    : 'bg-brand-blue text-white hover:bg-slate-900 shadow-brand-blue/20'
                }`}
              >
                {followLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : isFollowing ? (
                  <><UserCheck size={16} /> Following</>
                ) : (
                  <><UserPlus size={16} /> Follow Artist</>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-brand-blue" size={32} />
        </div>
      ) : (
        <div className="space-y-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {artworks.map(art => (
              <ArtCard 
                key={art.id}
                {...art}
                onBuy={() => onBuy(art)}
              />
            ))}
          </div>

          {/* Feedback Section */}
          <section className="bg-gray-50 rounded-[3rem] p-12 lg:p-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
              <div>
                <h2 className="text-4xl font-display font-black text-slate-900 tracking-tight lg:sticky lg:top-10">
                  Artist Feedback<span className="text-brand-blue">.</span>
                  <span className="block text-lg text-gray-400 font-light mt-4 tracking-normal">What the collective thinks about {artistName}'s work.</span>
                </h2>
                
                {!isSelf && (
                  <form onSubmit={handleSubmitComment} className="mt-12 bg-white p-8 rounded-3xl shadow-sm space-y-6">
                    <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Leave your mark</label>
                    <textarea 
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Share your thoughts on this artist..."
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-brand-blue transition-all h-32 resize-none"
                    />
                    </div>
                    <button 
                      type="submit"
                      disabled={isSubmittingComment || !newComment.trim()}
                      className="w-full bg-slate-900 text-white font-black py-4 rounded-xl uppercase text-[10px] tracking-widest hover:bg-brand-blue transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmittingComment ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Submit Feedback</>}
                    </button>
                  </form>
                )}
              </div>

              <div className="space-y-8">
                {comments.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
                    <MessageSquare size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-light italic">Be the first to leave feedback for this artist.</p>
                  </div>
                ) : (
                  comments.map(comment => (
                    <motion.div 
                      key={comment.id}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold">
                          {comment.authorName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{comment.authorName}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                            {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString() : 'Just now'}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-600 leading-relaxed italic">"{comment.text}"</p>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
