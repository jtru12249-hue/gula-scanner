import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { name, email } = await req.json();

    // 1. Create member in Firebase Firestore first to get a unique document ID
    const docRef = await addDoc(collection(db, 'members'), {
      name: name || 'GULA Member',
      email: email || '',
      points: 0,
      createdAt: new Date().toISOString(),
    });

    const memberId = docRef.id; // e.g., "x1fjvv504r77yPs7NqWw"

    // 2. Issue pass in WalletWallet using the exact same ID as serialNumber
    const walletRes = await fetch('https://api.walletwallet.dev/v1/passes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WALLETWALLET_API_KEY}`,
      },
      body: JSON.stringify({
        serialNumber: memberId, // Forces WalletWallet ID to match Firebase ID
        logoText: 'GULA EXPRESS',
        primaryFields: [
          {
            key: 'POINTS',
            value: '0',
            label: 'POINTS',
          },
        ],
        secondaryFields: [
          {
            key: 'MEMBER',
            value: name ? name.toUpperCase() : 'GULA MEMBER',
            label: 'MEMBER',
          },
        ],
        barcode: {
          type: 'QR',
          value: memberId, // Scans as the exact same ID
        },
      }),
    });

    const walletData = await walletRes.json();

    if (!walletRes.ok) {
      console.error('Wallet error:', walletData);
      throw new Error(walletData.error || 'Failed to issue Wallet pass');
    }

    // 3. Return the Pass URL to display on your /join page
    return NextResponse.json({
      success: true,
      memberId: memberId,
      passUrl: walletData.url || walletData.passUrl,
    });

  } catch (error: any) {
    console.error('Create Member Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
