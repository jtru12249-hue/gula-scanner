import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc } from 'firebase/firestore';

export async function POST(request) {
  try {
    const { name, phone } = await request.json();

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    // 1. Create unique document in Firebase
    const docRef = await addDoc(collection(db, 'members'), {
      name,
      phone,
      points: 0,
      createdAt: new Date()
    });

    const uniqueMemberId = docRef.id;

    // 2. Request new pass from WalletWallet API
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
    console.log('WalletWallet Create Pass Response:', passData);

    if (!walletRes.ok) {
      return NextResponse.json({ 
        error: passData.message || passData.error || 'Failed to generate pass on WalletWallet' 
      }, { status: walletRes.status });
    }

    // Save WalletWallet pass ID if returned
    const passId = passData.id || passData._id || passData.serialNumber;
    if (passId) {
      await updateDoc(docRef, { passId });
    }

    // Resolve public download URL
    const passUrl = passData.downloadUrl || passData.url || passData.passUrl || passData.appleWalletUrl;

    return NextResponse.json({ 
      success: true, 
      memberId: uniqueMemberId, 
      passUrl
    });

  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
