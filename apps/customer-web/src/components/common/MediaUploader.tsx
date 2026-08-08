'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Video, Trash2, RefreshCw, Loader2, Eye } from 'lucide-react';
import { getApiBaseUrl, getImageUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();


interface MediaUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  acceptType?: 'image' | 'video';
  label?: string;
  helperText?: string;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  value,
  onChange,
  acceptType = 'image',
  label,
  helperText,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVideo = acceptType === 'video';
  const allowedExtensions = isVideo ? '.mp4,.mov,.webm' : '.jpg,.jpeg,.png,.webp';
  const maxSizeMb = isVideo ? 100 : 5;

  const handleFileSelect = async (file: File) => {
    setError(null);

    // Client-side validation
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const validImageExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const validVideoExts = ['.mp4', '.mov', '.webm'];

    if (!isVideo && !validImageExts.includes(ext)) {
      setError('Invalid format. Only JPG, JPEG, PNG, and WEBP images are allowed.');
      return;
    }

    if (isVideo && !validVideoExts.includes(ext)) {
      setError('Invalid format. Only MP4, MOV, and WEBM videos are allowed.');
      return;
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File size exceeds maximum allowed limit of ${maxSizeMb}MB.`);
      return;
    }

    // Set immediate client-side preview URL
    const localPreview = URL.createObjectURL(file);
    onChange(localPreview);

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/storage/upload?type=${acceptType}`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onChange(data.url);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.message || 'File upload failed. Please try again.');
      }
    } catch {
      setError('Network error uploading file. Ensure backend is running.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
    if (e.target) e.target.value = '';
  };


  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-bold text-gray-700">
          {label} {value && <span className="text-emerald-600 text-[10px] font-black">✓ Uploaded</span>}
        </label>
      )}

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-bold text-rose-700">
          ⚠️ {error}
        </div>
      )}

      {value ? (
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            {isVideo ? (
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-900 flex items-center justify-center text-white">
                <Video className="h-6 w-6" />
              </div>
            ) : (
              <img
                src={getImageUrl(value)}
                alt="Uploaded media preview"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
                }}
                className="h-16 w-16 shrink-0 rounded-xl object-cover border border-gray-200 bg-white"
              />
            )}
            <div className="truncate text-xs">
              <span className="font-bold text-gray-900 block truncate">{value.split('/').pop()}</span>
              <a
                href={getImageUrl(value)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-1 mt-1"
              >
                <Eye className="h-3 w-3" /> View Media File
              </a>
            </div>

          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Replace
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
            isDragging
              ? 'border-orange-500 bg-orange-50/50'
              : 'border-gray-200 bg-gray-50/50 hover:border-orange-400 hover:bg-white'
          }`}
        >
          {isUploading ? (
            <div className="py-4 space-y-2 text-orange-600">
              <Loader2 className="mx-auto h-8 w-8 animate-spin" />
              <span className="block text-xs font-bold">Uploading media to server...</span>
            </div>
          ) : (
            <>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 group-hover:scale-110 transition">
                {isVideo ? <Video className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
              </div>
              <p className="text-xs font-bold text-gray-800">
                Click to upload or drag &amp; drop {isVideo ? 'video' : 'image'}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                {helperText || (isVideo ? 'MP4, MOV, WEBM up to 100MB' : 'JPG, PNG, WEBP up to 5MB')}
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={allowedExtensions}
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
};
