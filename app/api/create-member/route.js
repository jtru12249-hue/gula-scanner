import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc } from 'firebase/firestore';

export async function POST(request) {
  try {
    const { name, phone } = await request.json();

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    // 1. Create unique member entry in Firebase
    const docRef = await addDoc(collection(db, 'members'), {
      name,
      phone,
      points: 0,
      createdAt: new Date()
    });

    const uniqueMemberId = docRef.id;

    // 2. Call WalletWallet API with exact schema parameters
    const walletRes = await fetch('https://api.walletwallet.dev/api/passes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WALLETWALLET_API_KEY}`
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
        error: passData.message || JSON.stringify(passData) 
      }, { status: walletRes.status });
    }

    // Save pass ID to Firebase record
    const passId = passData.id || passData._id || passData.serialNumber;
    if (passId) {
      await updateDoc(docRef, { passId });
    }

    const passUrl = passData.downloadUrl || passData.url || passData.passUrl || passData.appleWalletUrl;

    return NextResponse.json({ success: true, memberId: uniqueMemberId, passUrl });

  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
