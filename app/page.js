'use client';
import { useState, useEffect, CSSProperties, FormEvent } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface StatusState {
  loading: boolean;
  message: string;
  type: 'info' | 'success' | 'error' | '';
}

export default function MobileScanner() {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [spendAmount, setSpendAmount] = useState<string>('');
  const [status, setStatus] = useState<StatusState>({ loading: false, message: '', type: '' });

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (!memberId) {
      scanner = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          supportedScanTypes: []
        },
        false
      );

      scanner.render(
        (decodedText: string) => {
          setMemberId(decodedText);
          setStatus({ loading: false, message: `Scanned Member: ${decodedText}`, type: 'info' });
        },
        () => {}
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [memberId]);

  const handleAddPoints = async (e: FormEvent) => {
    e.preventDefault();
    if (!spendAmount || isNaN(Number(spendAmount))) return;

    setStatus({ loading: true, message: 'Updating pass...', type: 'info' });

    try {
      const res = await fetch('/api/add-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          spendAmount: parseFloat(spendAmount),
          action: 'ADD'
        })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({
          loading: false,
          message: `Success! Added ${data.pointsEarned} pts. New total: ${data.newBalance} pts.`,
          type: 'success'
        });
        setSpendAmount('');
      } else {
        setStatus({ loading: false, message: data.error || 'Failed to update', type: 'error' });
      }
    } catch {
      setStatus({ loading: false, message: 'Network connection error', type: 'error' });
    }
  };

  const handleRedeemReward = async () => {
    if (!confirm('Deduct 1,000 points to redeem Free Cachapa?')) return;

    setStatus({ loading: true, message: 'Redeeming reward...', type: 'info' });

    try {
      const res = await fetch('/api/add-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          action: 'REDEEM'
        })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({
          loading: false,
          message: `Reward Redeemed! Deducted 1,000 pts. New total: ${data.newBalance} pts.`,
          type: 'success'
        });
      } else {
        setStatus({ loading: false, message: data.error || 'Redemption failed', type: 'error' });
      }
    } catch {
      setStatus({ loading: false, message: 'Network connection error', type: 'error' });
    }
  };

  const resetScanner = () => {
    setMemberId(null);
    setSpendAmount('');
    setStatus({ loading: false, message: '', type: '' });
  };

  return (
    <div style={styles.pageWrapper}>
      <main style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>GULA Staff Scanner</h1>
        </header>

        {!memberId ? (
          <div style={styles.scannerWrapper}>
            <p style={styles.instructions}>Scan customer wallet pass QR code</p>
            <div id="reader" style={styles.reader}></div>
          </div>
        ) : (
          <div style={styles.card}>
            <div style={styles.memberBadge}>
              <span style={styles.label}>Member ID</span>
              <strong style={styles.memberVal}>{memberId}</strong>
            </div>

            <form onSubmit={handleAddPoints} style={styles.form}>
              <label style={styles.inputLabel}>Enter Spend Amount ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={spendAmount}
                onChange={(e) => setSpendAmount(e.target.value)}
                style={styles.input}
                autoFocus
              />

              <button
                type="submit"
                disabled={status.loading || !spendAmount}
                style={{ ...styles.button, opacity: status.loading || !spendAmount ? 0.6 : 1 }}
              >
                {status.loading ? 'Processing...' : 'Add Points & Push Update'}
              </button>
            </form>

            <div style={styles.divider}>OR</div>

            <button
              onClick={handleRedeemReward}
              disabled={status.loading}
              style={{ ...styles.redeemButton, opacity: status.loading ? 0.6 : 1 }}
            >
              🎁 Redeem Free Cachapa (-1,000 pts)
            </button>

            <button onClick={resetScanner} style={styles.resetButton}>
              Scan Another Pass
            </button>
          </div>
        )}

        {status.message && (
          <div style={{
            ...styles.toast,
            backgroundColor: status.type === 'error' ? '#fee2e2' : status.type === 'success' ? '#dcfce7' : '#e0f2fe',
            color: status.type === 'error' ? '#991b1b' : status.type === 'success' ? '#166534' : '#075985'
          }}>
            {status.message}
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  pageWrapper: { minHeight: '100vh', backgroundColor: '#f3f4f6', paddingTop: '40px', paddingBottom: '40px' },
  container: { maxWidth: '420px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' },
  header: { textAlign: 'center', marginBottom: '20px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#111827' },
  scannerWrapper: { background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' },
  instructions: { textAlign: 'center', fontSize: '14px', color: '#374151', marginBottom: '12px', fontWeight: '500' },
  reader: { width: '100%', borderRadius: '8px', overflow: 'hidden' },
  card: { background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  memberBadge: { padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e5e7eb' },
  label: { fontSize: '12px', color: '#4b5563', fontWeight: '600', textTransform: 'uppercase' },
  memberVal: { fontSize: '15px', color: '#111827', fontWeight: 'bold' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  inputLabel: { fontSize: '14px', fontWeight: '600', color: '#111827' },
  input: { padding: '12px', fontSize: '18px', borderRadius: '8px', border: '1px solid #9ca3af', backgroundColor: '#ffffff', color: '#111827', outline: 'none' },
  button: { padding: '14px', background: '#000000', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  divider: { textAlign: 'center', margin: '16px 0', fontSize: '12px', color: '#6b7280', fontWeight: 'bold' },
  redeemButton: { width: '100%', padding: '14px', background: '#166534', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' },
  resetButton: { width: '100%', marginTop: '12px', padding: '10px', background: 'transparent', color: '#4b5563', border: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
  toast: { marginTop: '16px', padding: '12px', borderRadius: '8px', fontSize: '14px', textAlign: 'center', fontWeight: '600' }
};
