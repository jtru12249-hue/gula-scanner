'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannerStarted, setScannerStarted] = useState(false);

  useEffect(() => {
    let html5QrCode: any = null;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        html5QrCode = new Html5Qrcode("reader");

        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            setMemberId(decodedText);
            setMessage('QR Code Scanned Successfully!');
          },
          () => {} // Ignore scan errors
        );
        setScannerStarted(true);
      } catch (err) {
        console.error("Camera access error:", err);
      }
    };

    startScanner();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, []);

  const handleUpdatePoints = async (action: 'ADD' | 'REDEEM') => {
    if (!memberId) {
      alert('Please scan a QR code or enter a Member ID');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/add-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          spendAmount: action === 'ADD' ? parseFloat(amount) : undefined,
          action
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update points');
      }

      if (action === 'REDEEM') {
        setMessage(`Success! Redeemed reward. New Balance: ${data.newBalance} pts`);
      } else {
        setMessage(`Success! Added ${data.pointsEarned} pts. New Balance: ${data.newBalance} pts`);
      }
      setAmount('');
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: '450px', margin: '20px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center' }}>GULA Scanner Terminal</h2>

      {/* Video Stream Container */}
      <div 
        id="reader" 
        style={{ 
          width: '100%', 
          minHeight: '260px', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '8px', 
          overflow: 'hidden', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {!scannerStarted && <p style={{ color: '#666' }}>Requesting Camera Access...</p>}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontWeight: 'bold' }}>Scanned Member ID:</label>
        <input 
          type="text" 
          value={memberId} 
          onChange={(e) => setMemberId(e.target.value)} 
          placeholder="Scan QR or paste ID" 
          style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontWeight: 'bold' }}>Purchase Amount ($):</label>
        <input 
          type="number" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
          placeholder="0.00" 
          style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box' }}
        />
      </div>

      <button 
        onClick={() => handleUpdatePoints('ADD')} 
        disabled={loading}
        style={{ width: '100%', padding: '12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', marginBottom: '10px', cursor: 'pointer' }}
      >
        {loading ? 'Processing...' : 'Add Points ($1 = 10 pts)'}
      </button>

      <button 
        onClick={() => handleUpdatePoints('REDEEM')} 
        disabled={loading}
        style={{ width: '100%', padding: '12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
      >
        {loading ? 'Processing...' : 'Redeem Free Reward (1,000 pts)'}
      </button>

      {message && <p style={{ marginTop: '20px', fontWeight: 'bold', textAlign: 'center' }}>{message}</p>}
    </main>
  );
}
