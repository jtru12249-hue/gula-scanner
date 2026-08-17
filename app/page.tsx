'use client';
import { useState } from 'react';

export default function Home() {
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePoints = async (action) => {
    if (!memberId) {
      alert('Please enter or scan a Member ID');
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
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>GULA Scanner Terminal</h2>

      <div style={{ marginBottom: '15px' }}>
        <label>Customer Member ID:</label>
        <input 
          type="text" 
          value={memberId} 
          onChange={(e) => setMemberId(e.target.value)} 
          placeholder="Scan QR or paste ID" 
          style={{ width: '100%', padding: '10px', marginTop: '5px' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>Purchase Amount ($):</label>
        <input 
          type="number" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
          placeholder="0.00" 
          style={{ width: '100%', padding: '10px', marginTop: '5px' }}
        />
      </div>

      <button 
        onClick={() => handleUpdatePoints('ADD')} 
        disabled={loading}
        style={{ width: '100%', padding: '12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', marginBottom: '10px' }}
      >
        {loading ? 'Processing...' : 'Add Points ($1 = 10 pts)'}
      </button>

      <button 
        onClick={() => handleUpdatePoints('REDEEM')} 
        disabled={loading}
        style={{ width: '100%', padding: '12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}
      >
        {loading ? 'Processing...' : 'Redeem Free Reward (1,000 pts)'}
      </button>

      {message && <p style={{ marginTop: '20px', fontWeight: 'bold', textAlign: 'center' }}>{message}</p>}
    </main>
  );
}
