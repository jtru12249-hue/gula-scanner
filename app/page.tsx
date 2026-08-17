'use client';

import { useState } from 'react';

export default function ScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const startCamera = async () => {
    setErrorMsg('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this browser/connection.');
      }
      setScanning(true);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to open camera. Please check browser permissions.');
      setScanning(false);
    }
  };

  const resetScanner = () => {
    setScanning(false);
    setErrorMsg('');
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>GULA Staff Scanner</h1>

      {errorMsg && (
        <div style={{ color: 'red', marginBottom: '15px', padding: '10px', border: '1px solid red' }}>
          <p>{errorMsg}</p>
          <button onClick={resetScanner} style={{ padding: '8px 16px', marginTop: '5px' }}>
            Try Again / Go Back
          </button>
        </div>
      )}

      {!scanning ? (
        <button onClick={startCamera} style={{ padding: '12px 24px', fontSize: '16px' }}>
          Open Camera to Scan
        </button>
      ) : (
        <div>
          <p>Camera Active...</p>
          {/* Your HTML5 QR Code / Scanner Component Here */}
          
          <br />
          <button onClick={resetScanner} style={{ padding: '10px 20px', marginTop: '15px', backgroundColor: '#ccc' }}>
            Cancel / Go Back
          </button>
        </div>
      )}
    </div>
  );
}
