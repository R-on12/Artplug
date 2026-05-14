import { motion } from 'motion/react';
import { User } from 'firebase/auth';
import { LogOut, Paintbrush } from 'lucide-react';

interface NavbarProps {
  setView: (view: any) => void;
  currentView: string;
  user: User | null;
  isArtist?: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export default function Navbar({ setView, currentView, user, isArtist, onLogin, onLogout }: NavbarProps) {
  return (
    <nav className="flex justify-between items-center py-8 px-6 md:px-12 bg-white border-b border-gray-100 sticky top-0 z-50">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2 md:gap-3 text-2xl md:text-3xl font-display font-black tracking-tighter text-black cursor-pointer group shrink-0"
        onClick={() => setView('gallery')}
      >
        <div className="relative w-8 h-8 flex items-center justify-center">
          <motion.div
            animate={{ 
              rotate: [0, -20, 20, 0],
              x: [0, -5, 5, 0],
              y: [0, 2, -2, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-brand-blue relative z-10"
          >
            <Paintbrush size={24} />
          </motion.div>
          {/* Animated Paint Stroke */}
          <motion.div 
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ 
              scaleX: [0, 1, 1, 0],
              opacity: [0, 0.8, 0.8, 0],
              x: [-10, 0, 5, 10]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-1 left-0 w-full h-1.5 bg-brand-blue rounded-full origin-left blur-[1px]"
          />
        </div>
        <span>ARTPLUG<span className="text-brand-blue">.</span></span>
      </motion.div>
      
      <div className="flex items-center space-x-4 md:space-x-10 font-bold text-[9px] md:text-xs uppercase tracking-[0.1em] md:tracking-[0.2em] text-gray-500">
        <button 
          onClick={() => setView('gallery')} 
          className={`hover:text-black transition relative pb-1 ${currentView === 'gallery' ? 'text-black border-b-2 border-black' : ''}`}
        >
          Gallery
        </button>

        {isArtist && (
          <button 
            onClick={() => setView('artists-list')} 
            className={`hover:text-black transition relative pb-1 ${currentView === 'artists-list' ? 'text-black border-b-2 border-black' : ''}`}
          >
            Artists
          </button>
        )}
        
        {isArtist && (
          <button 
            onClick={() => setView('artist-dashboard')} 
            className={`hover:text-brand-blue transition relative pb-1 ${currentView === 'artist-dashboard' ? 'text-brand-blue border-b-2 border-brand-blue' : ''}`}
          >
            My Studio
          </button>
        )}

        {user?.email === 'coopedill@gmail.com' && (
          <button 
            onClick={() => setView('admin')} 
            className={`hover:text-black transition relative pb-1 ${currentView === 'admin' ? 'text-red-500 border-b-2 border-red-500' : 'text-red-400'}`}
          >
            Admin
          </button>
        )}
        
        {user ? (
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <p 
                className="text-[10px] font-bold text-black leading-none cursor-pointer hover:text-brand-blue transition-colors"
                onClick={() => setView('profile' as any)}
              >
                {user.displayName}
              </p>
              <button 
                onClick={onLogout}
                className="text-[9px] uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors mt-1"
              >
                Sign Out
              </button>
            </div>
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              className="w-8 h-8 rounded-full border border-gray-100 cursor-pointer hover:ring-2 hover:ring-brand-blue/20 transition-all"
              alt="Avatar"
              onClick={() => setView('profile' as any)}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-6">
            <button 
              onClick={onLogin}
              className="text-[9px] sm:text-[10px] font-black tracking-widest text-gray-400 hover:text-black transition-colors uppercase whitespace-nowrap"
            >
              Log In
            </button>
            <button 
              onClick={onLogin}
              className="bg-slate-900 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl hover:bg-brand-blue transition-all shadow-xl shadow-slate-200 uppercase text-[9px] sm:text-[10px] font-black tracking-widest active:scale-95 whitespace-nowrap"
            >
              Sign Up
            </button>
          </div>
        )}

        {user && (
          <button onClick={onLogout} className="sm:hidden text-gray-400">
            <LogOut size={18} />
          </button>
        )}
      </div>
    </nav>
  );
}
