import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc } from 'firebase/firestore';

export async function POST(request) {
  try {
    const { name, phone } = await request.json();

    // 1. Create unique document in Firebase
    const docRef = await addDoc(collection(db, 'members'), {
      name,
      phone,
      points: 0,
      createdAt: new Date()
    });

    const uniqueMemberId = docRef.id; // Unique ID created by Firebase

    // 2. Request a new pass from WalletWallet API for this user
    const walletRes = await fetch('https://api.walletwallet.dev/api/passes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WALLETWALLET_API_KEY}`
      },
      body: JSON.stringify({
        logoText: 'GULA EXPRESS',
        backgroundColor: 'rgb(26, 26, 26)',
        foregroundColor: 'rgb(255, 255, 255)',
        labelColor: 'rgb(255, 107, 0)',
        logoURL: 'https://i.imgur.com/Q6JfH2E.jpeg',
        iconURL: 'https://i.imgur.com/Q6JfH2E.jpeg',
        barcode: {
          format: 'PKBarcodeFormatQR',
          message: uniqueMemberId,
          messageEncoding: 'iso-8859-1',
          altText: uniqueMemberId
        },
        primaryFields: [{ key: 'points_balance', label: 'POINTS', value: '0' }],
        secondaryFields: [
          { label: 'MEMBER', value: name },
          { label: 'NEXT REWARD', value: 'Free Cachapa at 1,000 pts' }
        ]
      })
    });

    const passData = await walletRes.json();

    // Save WalletWallet pass ID to Firebase record
    if (passData.id) {
      await updateDoc(docRef, { passId: passData.id });
    }

    return NextResponse.json({ 
      success: true, 
      memberId: uniqueMemberId, 
      passUrl: passData.downloadUrl || passData.url 
    });

  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json({ error: 'Failed to create pass' }, { status: 500 });
  }
}
