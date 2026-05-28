"use client";

import React, { useState, useRef, useEffect } from "react";
import { Upload, X, RefreshCw } from "lucide-react";

interface Props {
  currentImageUrl?: string | null;
  name?: string; // Nombre del campo file, por defecto "image"
}

export default function ProductImageUploader({ currentImageUrl = null, name = "image" }: Props) {
  const [prevImageUrl, setPrevImageUrl] = useState<string | null>(currentImageUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl);
  const [isDragActive, setIsDragActive] = useState(false);
  const [removeImage, setRemoveImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar cuando cambia currentImageUrl desde afuera
  if (currentImageUrl !== prevImageUrl) {
    setPrevImageUrl(currentImageUrl);
    setPreviewUrl(currentImageUrl);
    setRemoveImage(false);
    setErrorMsg(null);
  }

  // Limpiar el input DOM de archivos cuando cambia la URL
  useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [currentImageUrl]);

  const handleFile = (file: File) => {
    setErrorMsg(null);

    // Validaciones básicas en el cliente
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (file.size > MAX_SIZE) {
      setErrorMsg("La imagen supera el límite de 2MB.");
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg("Formato no soportado (usa JPG, PNG, WEBP o GIF).");
      return;
    }

    // Crear preview local
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setRemoveImage(false);

    // Limpiar revocación previa si existiera
    return () => URL.revokeObjectURL(objectUrl);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
      if (fileInputRef.current) {
        // Asignar el archivo al input usando DataTransfer para que el submit del form lo envíe
        fileInputRef.current.files = e.dataTransfer.files;
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPreviewUrl(null);
    setRemoveImage(true);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-350">
        Foto del Producto
      </label>

      {/* Inputs ocultos para el envío del formulario */}
      <input
        ref={fileInputRef}
        type="file"
        name={name}
        id={name}
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
      <input type="hidden" name="removeImage" value={removeImage.toString()} />

      {previewUrl ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 group transition-all duration-300 shadow-sm max-w-full aspect-[4/3] flex items-center justify-center">
          <img
            src={previewUrl}
            alt="Vista previa del producto"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          {/* Overlay de edición */}
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={triggerSelect}
              className="p-2.5 bg-white/20 hover:bg-white/35 text-white rounded-full backdrop-blur-md transition-all active:scale-90 flex items-center justify-center cursor-pointer shadow"
              title="Cambiar foto"
            >
              <RefreshCw className="w-5 h-5 animate-hover-spin" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-all active:scale-90 flex items-center justify-center cursor-pointer shadow"
              title="Quitar foto"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerSelect}
          className={`relative rounded-2xl border-2 border-dashed aspect-[4/3] flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 select-none ${
            isDragActive
              ? "border-primary bg-primary/5 dark:bg-primary/10 scale-[0.99]"
              : "border-slate-300 dark:border-slate-800 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/20 dark:hover:bg-slate-950/30 hover:border-slate-400 dark:hover:border-slate-700"
          }`}
        >
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-xs text-slate-450 dark:text-slate-500 mb-3 group-hover:scale-105 transition-transform">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-250">
            Cargue una foto del producto
          </p>
          <p className="text-[10px] text-slate-450 mt-1">
            Arrastre y suelte aquí o haga clic para explorar
          </p>
          <p className="text-[9px] text-slate-400 dark:text-slate-550 mt-3 font-medium uppercase tracking-wider">
            JPG, PNG, WEBP, GIF hasta 2MB
          </p>
        </div>
      )}

      {errorMsg && (
        <p className="text-xs text-red-500 font-semibold animate-pulse mt-1 flex items-center gap-1.5">
          <span>⚠️</span> {errorMsg}
        </p>
      )}
    </div>
  );
}
