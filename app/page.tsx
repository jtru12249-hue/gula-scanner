'use client';

import { useState, useEffect } from 'react';

export default function ScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [spendAmount, setSpendAmount] = useState('');
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  // Safely load the scanner only on the client side
  useEffect(() => {
    let html5QrcodeScanner;

    if (scanning) {
      import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
        html5QrcodeScanner = new Html5QrcodeScanner(
          'reader',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );

        html5QrcodeScanner.render(
          async (decodedText) => {
            html5QrcodeScanner.clear();
            setScanning(false);
            await handleAddPoints(decodedText);
          },
          (errorMessage) => {
            // Silently handle ongoing scan frames
          }
        );
      }).catch(err => {
        setStatusMsg({ type: 'error', text: 'Camera initialization failed. Check permissions.' });
        setScanning(false);
      });
    }

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(console.error);
      }
    };
  }, [scanning]);

  const handleAddPoints = async (memberId) => {
    setLoading(true);
    setStatusMsg({ type: 'info', text: 'Authenticating and adding points...' });

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
      
      <div className="w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-[0_0_40px_rgba(220,38,38,0.15)] flex flex-col space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700 uppercase drop-shadow-sm">
            GULA
          </h1>
          <p className="text-xs text-neutral-400 mt-2 uppercase tracking-[0.3em] font-semibold">
            Staff Terminal
          </p>
        </div>

        {/* Input Area */}
        <div className="space-y-3">
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

        {/* Scanner & Controls */}
        <div className="pt-2">
          {scanning ? (
            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
              <div 
                id="reader" 
                className="overflow-hidden rounded-2xl border-2 border-red-500/30 bg-black shadow-[0_0_30px_rgba(220,38,38,0.2)] [&>video]:object-cover"
              ></div>
              <button
                onClick={() => setScanning(false)}
                className="w-full py-4 bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-neutral-300 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all"
              >
                Close Camera
              </button>
            </div>
          ) : (
            <button
              onClick={() => setScanning(true)}
              disabled={loading}
              className="w-full py-5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 active:scale-[0.98] text-white font-black rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all duration-200 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Scan Pass'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
