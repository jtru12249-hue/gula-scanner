import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc } from 'firebase/firestore';

export async function POST(request) {
  try {
    const { name, phone } = await request.json();

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    // 1. Save member to Firebase
    const docRef = await addDoc(collection(db, 'members'), {
      name,
      phone,
      points: 0,
      createdAt: new Date()
    });

    const uniqueMemberId = docRef.id;
    const apiKey = 'ww_live_a46693b6b87649115a26862018d83c75';

    // 2. Request new pass from WalletWallet
    const walletRes = await fetch('https://api.walletwallet.dev/api/passes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        barcodeValue: uniqueMemberId,
        barcodeFormat: 'QR',
        logoText: 'GULA EXPRESS',
        colorPreset: 'red',
        color: '#ac1b1b',
        logoURL: 'https://i.imgur.com/Q6JfH2E.jpeg',
        iconURL: 'https://i.imgur.com/Q6JfH2E.jpeg',
        primaryFields: [
          { label: 'POINTS', value: '0' }
        ],
        secondaryFields: [
          { label: 'MEMBER', value: name.toUpperCase() },
          { label: 'NEXT REWARD', value: 'FREE REWARD AT 1,000 POINTS!!' }
        ],
        backFields: [
          { label: 'Program Details', value: 'Earn 10 points for every $1 spent at GULA EXPRESS.' }
        ]
      })
    });

    const passData = await walletRes.json().catch(() => ({}));

    if (!walletRes.ok) {
      return NextResponse.json({ 
        error: `WalletWallet error (${walletRes.status}): ${passData.message || JSON.stringify(passData)}` 
      }, { status: walletRes.status });
    }

    // Extract generated pass ID
    const passId = passData.id || passData._id || passData.serialNumber || passData.passId;

    if (passId) {
      await updateDoc(docRef, { passId });
    }

    // Extract direct URL or construct download endpoint dynamically
    const passUrl = passData.downloadUrl || 
                    passData.url || 
                    passData.passUrl || 
                    passData.appleWalletUrl || 
                    (passId ? `https://api.walletwallet.dev/api/passes/${passId}/download` : null) ||
                    (passId ? `https://api.walletwallet.dev/p/${passId}` : null);

    if (!passUrl) {
      return NextResponse.json({ 
        error: 'Pass generated, but could not resolve download link.',
        rawResponse: passData 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, memberId: uniqueMemberId, passUrl });

  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server Exception' }, { status: 500 });
  }
}
