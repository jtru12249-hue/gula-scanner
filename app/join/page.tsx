'use client';
import { useState, FormEvent } from 'react';

export default function JoinPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/create-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });

      const data = await res.json();
      if (data.passUrl) {
        // Redirect customer directly to their unique Apple Wallet pass download
        window.location.href = data.passUrl;
      } else {
        alert('Error creating pass: ' + data.error);
        setLoading(false);
      }
    } catch {
      alert('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Join GULA Rewards 🍔</h1>
      <p>Enter your details to add your digital loyalty pass to Apple Wallet.</p>
      
      <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input 
          type="text" 
          placeholder="Your Full Name" 
          required 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          style={{ padding: '12px', fontSize: '16px' }}
        />
        <input 
          type="tel" 
          placeholder="Phone Number" 
          required 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)}
          style={{ padding: '12px', fontSize: '16px' }}
        />
        <button 
          type="submit" 
          disabled={loading} 
          style={{ padding: '14px', background: '#000', color: '#fff', fontSize: '16px', fontWeight: 'bold' }}
        >
          {loading ? 'Creating Pass...' : 'Add to Apple Wallet'}
        </button>
      </form>
    </div>
  );
}
