'use client';

import { useState, useEffect, useRef } from 'react';

export default function ScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [spendAmount, setSpendAmount] = useState('');
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let html5QrcodeScanner;

    if (scanning) {
      import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
        html5QrcodeScanner = new Html5QrcodeScanner(
          'reader',
          { 
            fps: 15, 
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.0,
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true
            }
          },
          false
        );

        html5QrcodeScanner.render(
          async (decodedText) => {
            html5QrcodeScanner.clear();
            setScanning(false);
            await handleAddPoints(decodedText);
          },
          () => {}
        );
      }).catch(() => {
        setStatusMsg({ type: 'error', text: 'Camera access error.' });
        setScanning(false);
      });
    }

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(console.error);
      }
    };
  }, [scanning]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusMsg({ type: 'info', text: 'Reading image file...' });

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode('file-helper');
      const decodedText = await html5QrCode.scanFile(file, true);
      await handleAddPoints(decodedText);
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Could not detect a QR code in that image.' });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddPoints = async (memberId) => {
    setLoading(true);
    setStatusMsg({ type: 'info', text: 'Adding points...' });

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
      if (!res.ok) throw new Error(data.error || 'Failed to update points');

      setStatusMsg({
        type: 'success',
        text: `Success! Added ${data.pointsAdded} points. New total: ${data.newTotal}`,
      });
      setSpendAmount('');
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black">
      <div id="file-helper" className="hidden"></div>
      
      <div className="w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-[0_0_40px_rgba(220,38,38,0.15)] flex flex-col space-y-6">
        
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700 uppercase drop-shadow-sm">
            GULA
          </h1>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-[0.3em] font-semibold">
            Staff Terminal
          </p>
        </div>

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

        {statusMsg.text && (
          <div className={`p-4 rounded-2xl text-sm font-semibold tracking-wide text-center transition-all ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : statusMsg.type === 'error'
              ? 'bg-red-500/10 border border-red-500/30 text-red-400'
              : 'bg-neutral-800/50 border border-neutral-700 text-neutral-300'
          }`}>
            {statusMsg.text}
          </div>
        )}

        <div className="space-y-3">
          {scanning ? (
            <div className="space-y-4">
              <div id="reader" className="overflow-hidden rounded-2xl border-2 border-red-500/30 bg-black [&>video]:object-cover"></div>
              <button
                onClick={() => setScanning(false)}
                className="w-full py-4 bg-neutral-900 border border-white/5 text-neutral-300 rounded-2xl font-bold text-sm uppercase tracking-wider"
              >
                Close Camera
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setScanning(true)}
                disabled={loading}
                className="w-full py-5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-black rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all uppercase tracking-widest disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Scan via Camera'}
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full py-4 bg-neutral-900 border border-white/10 hover:bg-neutral-800 text-neutral-300 font-bold rounded-2xl transition-all uppercase tracking-wider text-sm"
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
