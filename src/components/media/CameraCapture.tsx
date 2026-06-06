'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const startCamera = async () => {
    setIsInitializing(true);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Ensure video actually plays
        await videoRef.current.play();
      }
    } catch (error: any) {
      console.error('Camera access denied:', error);
      alert(`Camera Error: ${error.message}. Please ensure permissions are enabled in your browser settings.`);
    } finally {
      setIsInitializing(false);
    }
  };
  
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !stream) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context?.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        onCapture(blob);
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };
  
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);
  
  return (
    <div className="w-full">
      {!stream ? (
        <button 
          onClick={startCamera} 
          disabled={isInitializing}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
        >
          {isInitializing ? <RefreshCw className="animate-spin" /> : <Camera size={24} />}
          {isInitializing ? 'Opening Camera...' : 'Open Camera Viewfinder'}
        </button>
      ) : (
        <div className="relative bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border-4 border-white ring-1 ring-slate-200">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto aspect-[3/4] object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-8 px-6 z-30">
            <button 
              onClick={capturePhoto} 
              className="bg-white text-indigo-600 rounded-full p-6 shadow-2xl hover:scale-110 active:scale-95 transition-all group"
              title="Capture Photo"
            >
              <div className="w-10 h-10 rounded-full border-4 border-indigo-600 group-hover:bg-indigo-50 transition-colors"></div>
            </button>
            <button 
              onClick={stopCamera} 
              className="bg-rose-500 text-white rounded-full p-6 shadow-2xl hover:bg-rose-600 active:scale-95 transition-all"
              title="Close Camera"
            >
              <X size={32} />
            </button>
          </div>
          
          {/* Viewport Overlay */}
          <div className="absolute inset-0 pointer-events-none border-[40px] border-black/20 z-10" />
        </div>
      )}
    </div>
  );
}
