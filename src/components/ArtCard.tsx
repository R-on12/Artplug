import React from 'react';
import { motion } from 'motion/react';
import { auth } from '../lib/firebase';
import { BadgeCheck } from 'lucide-react';
import { formatPrice } from '../lib/currency';

interface ArtCardProps {
  id: number | string;
  title: string;
  artist: string;
  artistId?: string;
  isVerified?: boolean;
  price: string;
  image: string;
  currencyCode?: string;
  onBuy?: () => void;
  onArtistClick?: (id: string, name: string) => void;
}

const ArtCard: React.FC<ArtCardProps> = ({ id, title, artist, artistId, isVerified, price, image, currencyCode = 'USD', onBuy, onArtistClick }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ 
        y: -10, 
        scale: 1.01,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)"
      }}
      transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col group border border-gray-100 transition-colors duration-300"
    >
      <div className="flex-1 bg-gray-200 overflow-hidden relative aspect-[4/5]">
        <motion.img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
        />
        <div className="absolute top-4 right-4">
          <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase text-black shadow-sm">
            {formatPrice(price, currencyCode)}
          </span>
        </div>
      </div>
      <div className="p-5 border-t border-gray-50 flex justify-between items-center bg-white">
        <div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-blue transition-colors line-clamp-1">{title}</h3>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onArtistClick && artistId) onArtistClick(artistId, artist);
            }}
            className="text-xs text-gray-400 uppercase tracking-widest font-medium mt-1 hover:text-brand-blue transition-colors flex items-center gap-1"
          >
            {artist}
            {isVerified && <BadgeCheck size={14} className="text-brand-blue fill-brand-blue/10" />}
          </button>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (onBuy) onBuy();
          }}
          className="bg-black text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand-blue transition-colors shadow-sm active:scale-95"
        >
          Buy
        </button>
      </div>
    </motion.div>
  );
};

export default ArtCard;
