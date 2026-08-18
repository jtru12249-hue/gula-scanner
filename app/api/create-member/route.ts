import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { name, email } = await req.json();

    // 1. Save member to Firebase Firestore
    const docRef = await addDoc(collection(db, 'members'), {
      name: name || 'GULA Member',
      email: email || '',
      points: 0,
      createdAt: new Date().toISOString(),
    });

    const memberId = docRef.id;

    // 2. Issue pass in WalletWallet using the exact same ID
    const walletRes = await fetch('https://api.walletwallet.dev/v1/passes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WALLETWALLET_API_KEY}`,
      },
      body: JSON.stringify({
        serialNumber: memberId,
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
          value: memberId,
        },
      }),
    });

    const walletData = await walletRes.json();

    if (!walletRes.ok) {
      throw new Error(walletData.error || 'Failed to issue Wallet pass');
    }

    return NextResponse.json({
      success: true,
      memberId: memberId,
      passUrl: walletData.url || walletData.passUrl,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
