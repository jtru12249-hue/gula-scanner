'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [spendAmount, setSpendAmount] = useState('');
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let scanner;
    if (scanning) {
      scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(
        async (decodedText) => {
          scanner.clear();
          setScanning(false);
          await handleAddPoints(decodedText);
        },
        (errorMessage) => {
          // Scanning in progress...
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch((err) => console.error(err));
      }
    };
  }, [scanning]);

  const handleAddPoints = async (memberId) => {
    setLoading(true);
    setStatusMsg({ type: 'info', text: 'Adding points to pass...' });

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
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl text-center space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black tracking-wider text-red-500 uppercase">
            GULA Staff
          </h1>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest">
            Loyalty Pass Scanner
          </p>
        </div>

        {/* Purchase Amount Input */}
        <div className="text-left space-y-2">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Order Total ($)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={spendAmount}
            onChange={(e) => setSpendAmount(e.target.value)}
            disabled={scanning || loading}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-lg font-mono focus:outline-none focus:border-red-500 transition"
          />
        </div>

        {/* Status Messages */}
        {statusMsg.text && (
          <div
            className={`p-3 rounded-xl text-sm font-medium ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                : statusMsg.type === 'error'
                ? 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
                : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* Scanner Area */}
        {scanning ? (
          <div className="space-y-4">
            <div id="reader" className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950"></div>
            <button
              onClick={() => setScanning(false)}
              className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-medium text-sm transition"
            >
              Cancel / Close Camera
            </button>
          </div>
        ) : (
          <button
            onClick={() => setScanning(true)}
            disabled={loading}
            className="w-full py-4 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-red-900/30 transition duration-150 uppercase tracking-wider"
          >
            {loading ? 'Processing...' : 'Open Camera & Scan QR'}
          </button>
        )}

      </div>
    </div>
  );
}
