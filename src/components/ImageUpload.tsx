import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentUrl?: string;
  label?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait';
}

export default function ImageUpload({ 
  onUpload, 
  currentUrl, 
  label = "Upload Image", 
  className = "",
  aspectRatio = 'square'
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    setIsUploading(true);
    
    try {
      // For this environment, we'll convert to a high-quality Data URL (Base64)
      // to avoid requiring external API keys immediately, while giving a "real" upload feel.
      // In a production app, you'd upload to Cloudinary/S3 here.
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        onUpload(base64String);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload failed:', error);
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview('');
    onUpload('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const aspectClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[4/5]'
  }[aspectRatio];

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</label>}
      
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative group cursor-pointer border-2 border-dashed rounded-[2rem] overflow-hidden transition-all duration-300 ${aspectClass} ${
          isDragging 
            ? 'border-brand-blue bg-blue-50/50 scale-[0.99]' 
            : preview 
              ? 'border-transparent' 
              : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300'
        }`}
      >
        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div 
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <img src={preview} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <p className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Upload size={14} /> Replace Image
                </p>
              </div>
              <button
                onClick={clearImage}
                className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-full text-gray-400 hover:text-red-500 hover:scale-110 transition-all z-10"
              >
                <X size={16} />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col items-center justify-center p-8 text-center gap-4"
            >
              <div className={`p-4 rounded-3xl bg-white shadow-sm text-gray-300 group-hover:text-brand-blue group-hover:scale-110 transition-all duration-300`}>
                {isUploading ? <Loader2 size={32} className="animate-spin text-brand-blue" /> : <Upload size={32} />}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-600">
                  {isUploading ? 'Securing asset...' : 'Drop your vision here'}
                </p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium italic">
                  or click to browse locally
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isUploading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin text-brand-blue" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Optimizing...</p>
            </div>
          </div>
        )}

        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
}
