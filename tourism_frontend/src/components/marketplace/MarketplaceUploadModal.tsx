import React, { useState, useRef } from 'react';
import { UploadCloud, X, Plus } from 'lucide-react';

interface MarketplaceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (formData: FormData) => Promise<void>;
}

export const MarketplaceUploadModal: React.FC<MarketplaceUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload
}) => {
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (validTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
    } else {
      alert("Unsupported file type. Please use JPEG, PNG, or WebP.");
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
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
    formData.append('image', file);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('tags', tags.join(','));

    try {
      await onUpload(formData);
      // Reset form
      setFile(null);
      setDescription('');
      setPrice('');
      setTags([]);
      onClose();
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Glassmorphic Modal */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-6 text-2xl font-bold tracking-tight text-white">Upload to Marketplace</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Drag & Drop Zone */}
          <div 
            className={`relative flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
              isDragging 
                ? 'border-emerald-400 bg-emerald-400/10' 
                : 'border-white/20 bg-white/5 hover:bg-white/10'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept="image/jpeg, image/png, image/webp"
              onChange={(e) => e.target.files && handleFileSelection(e.target.files[0])}
            />
            
            {file ? (
              <div className="text-center text-emerald-300">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm opacity-70">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-white/60">
                <UploadCloud className="mb-2 h-8 w-8" />
                <p className="text-sm font-medium">Drag & Drop image here</p>
                <p className="text-xs opacity-70">JPEG, PNG, WebP</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Description</label>
              <textarea 
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white placeholder-white/30 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none h-24"
                placeholder="Describe your artisan creation..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Price (USD)</label>
              <input 
                type="number" 
                required
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white placeholder-white/30 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                placeholder="e.g. 45.00"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Tags</label>
              <div className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                {tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-200 border border-emerald-500/30"
                  >
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => removeTag(tag)}
                      className="text-emerald-200/60 hover:text-emerald-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input 
                  type="text" 
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  className="flex-1 bg-transparent p-1 text-sm text-white placeholder-white/30 outline-none min-w-[120px]"
                  placeholder="Type a tag & press Enter"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={!file || isUploading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-emerald-950 transition-all hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
          >
            {isUploading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-950 border-t-transparent" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
            {isUploading ? 'Indexing...' : 'Upload to Marketplace'}
          </button>
        </form>
      </div>
    </div>
  );
};
