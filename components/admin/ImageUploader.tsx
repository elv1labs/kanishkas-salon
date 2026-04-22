"use client";
// components/admin/ImageUploader.tsx
// Features: Drag-and-drop, progress indication (simulated), preview, multi-session ready.

import { useState, useRef, useCallback } from "react";
import { UploadCloud, X, Image as ImageIcon, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  folder?: "products" | "services" | "gallery" | "general";
  currentImageUrl?: string;
  label?: string;
  className?: string;
}

export default function ImageUploader({
  onUploadSuccess,
  folder = "general",
  currentImageUrl,
  label = "Upload Image",
  className,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    // 1. Client-side fast validation
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPEG, PNG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size exceeds 5MB limit.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    // 2. Optimistic Preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // 3. API Upload
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setSuccess(true);
      onUploadSuccess(data.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image. Please try again.");
      setPreview(currentImageUrl || null); // Revert on failure
    } finally {
      setUploading(false);
    }
  }, [currentImageUrl, folder, onUploadSuccess]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setSuccess(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">{label}</label>}
      
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "relative group cursor-pointer transition-all duration-300 rounded-sm border-2 border-dashed overflow-hidden aspect-video flex flex-col items-center justify-center p-4",
          isDragging 
            ? "border-gold bg-gold/5 scale-[1.01]" 
            : "border-cream-darker bg-cream/30 hover:border-gold/50 hover:bg-cream/50",
          preview && "border-solid"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept="image/*"
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full"
            >
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-espresso/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="p-2 bg-white rounded-full text-espresso hover:bg-gold hover:text-white transition-colors"
                >
                  <ImageIcon size={20} />
                </button>
                <button
                  onClick={removeImage}
                  className="p-2 bg-white rounded-full text-espresso hover:bg-red-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-white rounded-full border border-cream-darker flex items-center justify-center mx-auto mb-3 text-charcoal-lighter group-hover:text-gold transition-colors">
                <UploadCloud size={24} />
              </div>
              <p className="text-sm font-medium text-espresso">Click or drag to upload</p>
              <p className="text-xs text-charcoal-lighter mt-1">PNG, JPG or WebP (max 5MB)</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Overlays */}
        {uploading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <Loader2 size={32} className="text-gold animate-spin mb-3" />
            <p className="text-sm font-semibold text-espresso">Processing Image...</p>
          </div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-2 right-2 z-10 bg-green-500 text-white p-1 rounded-full shadow-lg"
          >
            <CheckCircle size={16} />
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-red-500 text-xs mt-2"
          >
            <AlertCircle size={14} />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
