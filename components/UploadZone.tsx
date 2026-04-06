"use client";

import React, { useCallback, useRef, useState } from "react";
import { Camera, Upload, Image as ImageIcon, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  imagePreviewUrl: string | null;
  isProcessing: boolean;
  onReset: () => void;
}

export function UploadZone({
  onFileSelected,
  imagePreviewUrl,
  isProcessing,
  onReset,
}: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  if (imagePreviewUrl) {
    return (
      <div className="relative w-full h-full min-h-[280px] rounded-xl overflow-hidden group animate-fade-in">
        <img
          src={imagePreviewUrl}
          alt="Preview struk"
          className="w-full h-full object-contain bg-secondary/30"
          style={{ maxHeight: "100%" }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={isProcessing}
            className="bg-white/90 text-gray-800 hover:bg-white border-0 shadow-lg"
            id="btn-reset-image"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Ganti Foto
          </Button>
        </div>
        {isProcessing && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      id="upload-zone"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "relative flex flex-col items-center justify-center w-full min-h-[280px] rounded-xl border-2 border-dashed transition-all duration-300",
        isDragging
          ? "border-primary bg-accent/30 scale-[1.01]"
          : "border-border hover:border-primary/50 hover:bg-accent/10 bg-secondary/30"
      )}
    >
      {/* Hidden desktop file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        id="file-input-desktop"
      />
      {/* Hidden camera input (mobile) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
        id="file-input-camera"
      />
      {/* Hidden gallery input (mobile) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        id="file-input-gallery"
      />

      {/* Desktop: label \u2014 one click opens exactly one dialog */}
      <label htmlFor="file-input-desktop" className="hidden md:flex flex-col items-center gap-4 p-6 text-center cursor-pointer w-full">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
          <ImageIcon className="w-8 h-8 text-white" />
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Upload Foto Struk</p>
          <p className="text-sm text-muted-foreground">Drag & drop atau klik untuk pilih file</p>
        </div>
        <p className="text-xs text-muted-foreground">Mendukung JPG, PNG, WEBP, HEIC</p>
      </label>
      {/* Mobile: display only, no click \u2014 buttons below handle upload */}
      <div className="md:hidden flex flex-col items-center gap-4 p-6 text-center pointer-events-none select-none">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
          <ImageIcon className="w-8 h-8 text-white" />
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Upload Foto Struk</p>
          <p className="text-sm text-muted-foreground">Pilih sumber foto di bawah</p>
        </div>
        <p className="text-xs text-muted-foreground">Mendukung JPG, PNG, WEBP, HEIC</p>
      </div>

      {/* Mobile action buttons — pointer-events-auto so they receive clicks */}
      <div className="flex gap-3 md:hidden pointer-events-auto">
        <Button
          size="lg"
          className="flex-1"
          onClick={() => cameraInputRef.current?.click()}
          id="btn-camera"
        >
          <Camera className="w-5 h-5 mr-2" />
          Kamera
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={() => galleryInputRef.current?.click()}
          id="btn-gallery"
        >
          <Upload className="w-5 h-5 mr-2" />
          Galeri
        </Button>
      </div>

      {/* Desktop drop indicator */}
      {isDragging && (
        <div className="absolute inset-0 rounded-xl bg-primary/10 border-2 border-primary flex items-center justify-center">
          <p className="text-primary font-semibold text-lg">Lepaskan untuk upload</p>
        </div>
      )}
    </div>
  );
}

