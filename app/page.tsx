'use client';
import { useState } from 'react';

export default function JoinPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/create-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create pass');
      }

      if (data.passUrl) {
        window.location.href = data.passUrl;
      }
    } catch (err) {
      alert(`Error creating pass: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center' }}>Join GULA Rewards 🍔</h2>
      <p style={{ textAlign: 'center', color: '#666' }}>Enter your details to add your digital loyalty pass to Apple Wallet.</p>

      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Your Full Name" 
          required 
          style={{ width: '100%', padding: '12px', marginBottom: '10px', boxSizing: 'border-box' }}
        />
        <input 
          type="tel" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
          placeholder="Phone Number" 
          required 
          style={{ width: '100%', padding: '12px', marginBottom: '15px', boxSizing: 'border-box' }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '12px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}
        >
          {loading ? 'Creating Pass...' : 'Add to Apple Wallet'}
        </button>
      </form>
    </main>
  );
}
