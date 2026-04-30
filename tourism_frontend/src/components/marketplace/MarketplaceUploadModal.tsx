'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, Tag as TagIcon, IndianRupee, Image as ImageIcon } from 'lucide-react';

interface MarketplaceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { description: string; price: number; tags: string[]; files: File[] }) => void;
}

export const MarketplaceUploadModal: React.FC<MarketplaceUploadModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      if (!tags.includes(currentTag.trim())) {
        setTags([...tags, currentTag.trim()]);
      }
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      description,
      price: parseFloat(price) || 0,
      tags,
      files,
    });
    // Reset form
    setFiles([]);
    setDescription('');
    setPrice('');
    setTags([]);
    setCurrentTag('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pt-12 pb-4 sm:p-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-[#0F172A]/80 border border-white/10 shadow-2xl backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
              <div>
                <h2 className="text-lg font-medium text-white">Upload New Asset</h2>
                <p className="text-xs text-white/40 mt-1 uppercase tracking-wider">Marketplace Integration Module</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Drag & Drop Zone */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Media Assets</label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 ${
                      isDragging 
                        ? 'border-emerald-500 bg-emerald-500/10' 
                        : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                    <UploadCloud className={`h-10 w-10 mb-3 ${isDragging ? 'text-emerald-400' : 'text-white/40'}`} />
                    <p className="text-sm text-white/80">
                      <span className="font-semibold text-emerald-400">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-white/40 mt-1">SVG, PNG, JPG or GIF (max. 10MB)</p>
                  </div>

                  {/* File Previews */}
                  {files.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <AnimatePresence>
                        {files.map((file, idx) => (
                          <motion.div
                            key={`${file.name}-${idx}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="relative group aspect-square rounded-lg border border-white/10 overflow-hidden bg-black/50"
                          >
                            <div className="absolute inset-0 flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-white/20" />
                            </div>
                            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 backdrop-blur-md">
                              <p className="truncate text-[10px] text-white/70 text-center">{file.name}</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                              className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-red-500/80 hover:text-white transition-colors backdrop-blur-md opacity-0 group-hover:opacity-100"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Listing Price</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <IndianRupee className="h-4 w-4 text-emerald-400/70" />
                      </div>
                      <input
                        type="number"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="block w-full rounded-lg border border-white/10 bg-black/20 py-2.5 pl-10 pr-3 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Tags</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <TagIcon className="h-4 w-4 text-white/40" />
                      </div>
                      <input
                        type="text"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        className="block w-full rounded-lg border border-white/10 bg-black/20 py-2.5 pl-10 pr-3 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all"
                        placeholder="Type and press Enter..."
                      />
                    </div>
                    {/* Tags Container */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <AnimatePresence>
                        {tags.map((tag) => (
                          <motion.div
                            key={tag}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 backdrop-blur-sm"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="text-emerald-400/60 hover:text-emerald-300 focus:outline-none"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Description</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="block w-full rounded-lg border border-white/10 bg-black/20 p-3 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all resize-none"
                    placeholder="Provide details about the material, origin, and creation process..."
                  />
                </div>

                {/* Footer / Actions */}
                <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-white/10">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!description || !price || files.length === 0}
                    className="group relative overflow-hidden rounded-lg bg-emerald-500 px-6 py-2 text-sm font-semibold text-black transition-all hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10">Upload Asset</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
