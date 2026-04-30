'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Plus, DollarSign, Tag as TagIcon } from 'lucide-react';

export const MarketplaceUpload = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !description || !price) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('tags', JSON.stringify(tags));

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Reset form
        setFile(null);
        setPreview(null);
        setDescription('');
        setPrice('');
        setTags([]);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-tactical-emerald text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50"
      >
        <Plus size={28} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass-panel p-6 rounded-3xl shadow-2xl border border-white/10"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Upload size={20} className="text-tactical-emerald" />
                  Upload Heritage Item
                </h2>
                <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload Zone */}
                <div 
                  className={`relative h-48 rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center overflow-hidden ${
                    preview ? 'border-tactical-emerald' : 'border-white/20 hover:border-tactical-emerald/50'
                  }`}
                >
                  {preview ? (
                    <>
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => { setFile(null); setPreview(null); }}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center">
                      <Upload size={32} className="text-white/40 mb-2" />
                      <span className="text-sm text-white/60">Drag & drop or click to upload</span>
                      <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                    </label>
                  )}
                </div>

                {/* Description */}
                <div>
                  <textarea
                    placeholder="Describe this treasure..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/30 focus:outline-none focus:border-tactical-emerald/50 min-h-[100px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                {/* Price & Tags */}
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <DollarSign size={16} className="absolute left-3 top-3.5 text-white/40" />
                    <input
                      type="number"
                      placeholder="Price"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-white placeholder:text-white/30 focus:outline-none focus:border-tactical-emerald/50"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="relative flex-[2]">
                    <TagIcon size={16} className="absolute left-3 top-3.5 text-white/40" />
                    <input
                      type="text"
                      placeholder="Add tags (Enter)"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-white placeholder:text-white/30 focus:outline-none focus:border-tactical-emerald/50"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                    />
                  </div>
                </div>

                {/* Tag Pills */}
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-tactical-emerald/20 border border-tactical-emerald/30 text-tactical-emerald rounded-full text-xs font-medium">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-white">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isUploading || !file}
                  className="w-full py-4 bg-tactical-emerald text-white rounded-xl font-bold text-lg shadow-lg shadow-tactical-emerald/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {isUploading ? 'Broadcasting to Feed...' : 'Publish to Marketplace'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
