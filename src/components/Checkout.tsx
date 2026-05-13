import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CreditCard, ShieldCheck, ArrowLeft, CheckCircle, Smartphone, Globe } from 'lucide-react';
import { auth } from '../lib/firebase';

interface CheckoutProps {
  artwork: {
    id: string | number;
    title: string;
    artist: string;
    artistId?: string;
    price: string;
    image: string;
  };
  onBack: () => void;
  onSuccess: () => void;
}

export default function Checkout({ artwork, onBack, onSuccess }: CheckoutProps) {
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'mobile_money' | 'paypal'>('card');

  const handlePurchase = async () => {
    setProcessing(true);
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          artworkId: String(artwork.id), 
          title: artwork.title,
          artist: artwork.artist, 
          artistId: artwork.artistId,
          price: artwork.price,
          userId: auth.currentUser?.uid,
          userEmail: auth.currentUser?.email
        })
      });
      
      const data = await response.json();
      
      if(data.success) {
        // Simulate a slight delay for "processing"
        setTimeout(() => {
          setProcessing(false);
          onSuccess();
        }, 1500);
      }
    } catch (error) {
      console.error('Checkout failed', error);
      setProcessing(false);
      alert('Payment processing failed. Please try again.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-5xl mx-auto px-6 py-12 md:py-20"
    >
      <button 
        onClick={onBack}
        className="flex items-center space-x-2 text-gray-400 hover:text-black transition-colors mb-8 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] uppercase font-bold tracking-widest">Back to Gallery</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xl shadow-gray-200/50">
        {/* Left: Artwork Summary */}
        <div className="p-8 md:p-12 bg-gray-50/50 border-r border-gray-100">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">Order Summary</h2>
          
          <div className="flex gap-6 mb-8">
            <div className="w-32 aspect-[4/5] rounded-xl overflow-hidden shadow-md">
              <img src={artwork.image} alt={artwork.title} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-black text-slate-900">{artwork.title}</h3>
              <p className="text-sm text-gray-400 uppercase tracking-widest mt-1">by {artwork.artist}</p>
              <div className="mt-4 inline-block px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-bold text-brand-blue uppercase tracking-widest">
                Certificate of Authenticity Included
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-8 border-t border-gray-100 font-medium">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span className="text-slate-900">${artwork.price}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Platform Service Fee (Included)</span>
              <span className="text-slate-900">$0.00</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-4 text-slate-900 border-t border-dashed border-gray-200">
              <span>Total</span>
              <span className="text-brand-blue">${artwork.price}</span>
            </div>
          </div>
        </div>

        {/* Right: Payment Details */}
        <div className="p-8 md:p-12">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">Payment Details</h2>
          
          <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setPaymentMethod('card')}
              className={`p-4 rounded-xl border-2 transition-all text-left ${paymentMethod === 'card' ? 'border-brand-blue bg-blue-50/10' : 'border-gray-50 hover:border-gray-100'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <CreditCard size={20} className={paymentMethod === 'card' ? 'text-brand-blue' : 'text-gray-400'} />
                {paymentMethod === 'card' && <CheckCircle size={16} className="text-brand-blue" />}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">Credit Card</p>
            </button>

            <button 
              onClick={() => setPaymentMethod('paypal')}
              className={`p-4 rounded-xl border-2 transition-all text-left ${paymentMethod === 'paypal' ? 'border-brand-blue bg-blue-50/10' : 'border-gray-50 hover:border-gray-100'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Globe size={20} className={paymentMethod === 'paypal' ? 'text-brand-blue' : 'text-gray-400'} />
                {paymentMethod === 'paypal' && <CheckCircle size={16} className="text-brand-blue" />}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">PayPal</p>
            </button>

            <button 
              onClick={() => setPaymentMethod('mobile_money')}
              className={`p-4 rounded-xl border-2 transition-all text-left ${paymentMethod === 'mobile_money' ? 'border-brand-blue bg-blue-50/10' : 'border-gray-50 hover:border-gray-100'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Smartphone size={20} className={paymentMethod === 'mobile_money' ? 'text-brand-blue' : 'text-gray-400'} />
                {paymentMethod === 'mobile_money' && <CheckCircle size={16} className="text-brand-blue" />}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">Mobile Money</p>
            </button>

            <button 
              onClick={() => setPaymentMethod('wallet')}
              className={`p-4 rounded-xl border-2 transition-all text-left ${paymentMethod === 'wallet' ? 'border-brand-blue bg-blue-50/10' : 'border-gray-50 hover:border-gray-100'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg">Pay</span>
                {paymentMethod === 'wallet' && <CheckCircle size={16} className="text-brand-blue" />}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">Apple Pay</p>
            </button>
          </div>

          <div className="space-y-4">
            {paymentMethod === 'card' ? (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-4"
              >
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cardholder Name</label>
                  <input type="text" className="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 outline-none focus:border-brand-blue focus:bg-white transition-all" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Card Number</label>
                  <div className="relative">
                    <input type="text" className="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 outline-none focus:border-brand-blue focus:bg-white transition-all pl-12" placeholder="0000 0000 0000 0000" />
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expiry</label>
                    <input type="text" className="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 outline-none focus:border-brand-blue focus:bg-white transition-all" placeholder="MM / YY" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">CVC</label>
                    <input type="password" size={3} className="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 outline-none focus:border-brand-blue focus:bg-white transition-all" placeholder="***" />
                  </div>
                </div>
              </motion.div>
            ) : paymentMethod === 'mobile_money' ? (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-4"
              >
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                  <input type="tel" className="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 outline-none focus:border-brand-blue focus:bg-white transition-all" placeholder="+233 ..." />
                </div>
                <p className="text-[9px] text-gray-400">A prompt will be sent to your phone to authorize the transaction.</p>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-4"
              >
                <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  You will be redirected to complete your purchase via {paymentMethod === 'paypal' ? 'PayPal' : 'Apple Pay'}.
                </p>
              </motion.div>
            )}
          </div>

            <div className="pt-6">
              <button 
                onClick={handlePurchase}
                disabled={processing}
                className="w-full bg-black text-white font-bold py-5 rounded-xl hover:bg-brand-blue transition shadow-lg shadow-gray-200 uppercase text-[10px] tracking-[0.2em] relative overflow-hidden disabled:opacity-70"
              >
                {processing ? (
                  <span className="flex items-center justify-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    <span>Processing Secure Connection...</span>
                  </span>
                ) : (
                  <span>Acquire Masterpiece — ${artwork.price}</span>
                )}
              </button>
              
              <div className="mt-6 flex items-center justify-center space-x-2 text-gray-400">
                <ShieldCheck size={16} />
                <span className="text-[9px] uppercase tracking-widest font-bold">Encrypted via Stripe Shield 256-bit</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
