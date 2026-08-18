'use client';

import { useState, useRef } from 'react';

export default function ScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [spendAmount, setSpendAmount] = useState('');
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const qrScannerRef = useRef<any>(null);

  // Instant Rear Camera Stream (25 FPS, HD 720p)
  const startCamera = async () => {
    setScanning(true);
    setStatusMsg({ type: '', text: '' });

    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const html5Qr = new Html5Qrcode('reader');
        qrScannerRef.current = html5Qr;

        await html5Qr.start(
          { facingMode: 'environment' }, // Explicit rear camera selection
          {
            fps: 25,
            qrbox: { width: 280, height: 280 },
            videoConstraints: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          async (decodedText) => {
            await stopCamera();
            await handleAddPoints(decodedText);
          },
          () => {}
        );
      } catch (err: any) {
        console.error('Camera error:', err);
        setStatusMsg({
          type: 'error',
          text: 'Camera error. Please allow camera permissions in your browser.',
        });
        setScanning(false);
      }
    }, 150);
  };

  const stopCamera = async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
        qrScannerRef.current.clear();
      } catch (e) {
        console.error(e);
      }
      qrScannerRef.current = null;
    }
    setScanning(false);
  };

  // Canvas Downscaling Engine for High-Res Mobile Screenshots
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusMsg({ type: 'info', text: 'Analyzing screenshot...' });

    try {
      const decodedText = await processImageFile(file);
      await handleAddPoints(decodedText);
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Could not detect QR code in image.',
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        // Downscale large screenshot to max 1000px for instant decoding
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1000;

        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas creation failed'));

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(async (blob) => {
          if (!blob) return reject(new Error('Image processing error'));
          const resizedFile = new File([blob], file.name, { type: 'image/jpeg' });

          try {
            const { Html5Qrcode } = await import('html5-qrcode');
            const html5Qr = new Html5Qrcode('file-helper');
            const result = await html5Qr.scanFile(resizedFile, false);
            html5Qr.clear();
            resolve(result);
          } catch (err) {
            try {
              const { Html5Qrcode } = await import('html5-qrcode');
              const html5Qr = new Html5Qrcode('file-helper');
              const result = await html5Qr.scanFile(file, false);
              html5Qr.clear();
              resolve(result);
            } catch (e) {
              reject(new Error('No QR code detected. Make sure the QR code is clearly visible in the image.'));
            }
          }
        }, 'image/jpeg', 0.9);
      };
      img.onerror = () => reject(new Error('Failed to load image file.'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleAddPoints = async (memberId: string) => {
    setLoading(true);
    setStatusMsg({ type: 'info', text: 'Updating points...' });

    try {
      const res = await fetch('/api/add-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          spendAmount: parseFloat(spendAmount) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update points.');

      setStatusMsg({
        type: 'success',
        text: `Success! Added ${data.pointsAdded} points. New Total: ${data.newTotal}`,
      });
      setSpendAmount('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black">
      <div id="file-helper" className="hidden"></div>

      <div className="w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-[0_0_40px_rgba(220,38,38,0.15)] flex flex-col space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700 uppercase drop-shadow-sm">
            GULA
          </h1>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-[0.3em] font-semibold">
            Staff Terminal
          </p>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">
            Order Total ($)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-xl font-medium">$</span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={spendAmount}
              onChange={(e) => setSpendAmount(e.target.value)}
              disabled={scanning || loading}
              className="w-full bg-black/50 border border-white/10 rounded-2xl pl-10 pr-4 py-4 text-xl font-mono text-white placeholder-neutral-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Status Toast */}
        {statusMsg.text && (
          <div
            className={`p-4 rounded-2xl text-sm font-semibold tracking-wide text-center transition-all ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                : statusMsg.type === 'error'
                ? 'bg-red-500/10 border border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                : 'bg-neutral-800/50 border border-neutral-700 text-neutral-300'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {scanning ? (
            <div className="space-y-4">
              <div
                id="reader"
                className="overflow-hidden rounded-2xl border-2 border-red-500/30 bg-black min-h-[280px] flex items-center justify-center [&>video]:object-cover [&>video]:w-full [&>video]:h-full"
              ></div>
              <button
                onClick={stopCamera}
                className="w-full py-4 bg-neutral-900 border border-white/10 hover:bg-neutral-800 text-neutral-300 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all"
              >
                Close Camera
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={startCamera}
                disabled={loading}
                className="w-full py-5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 active:scale-[0.98] text-white font-black rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all duration-200 uppercase tracking-widest disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Scan via Camera'}
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full py-4 bg-neutral-900 border border-white/10 hover:bg-neutral-800 active:scale-[0.98] text-neutral-300 font-bold rounded-2xl transition-all uppercase tracking-wider text-sm"
              >
                Upload Screenshot Image
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </>
          )}
        </div>

      </div>
    </div>
  );
}
