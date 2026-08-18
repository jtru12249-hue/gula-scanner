import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { memberId, spendAmount } = await req.json();

    if (!memberId) {
      return NextResponse.json({ error: 'No member ID scanned.' }, { status: 400 });
    }

    let cleanId = memberId.trim();

    // Extract ID if scanned value is a URL
    if (cleanId.includes('http://') || cleanId.includes('https://')) {
      try {
        const url = new URL(cleanId);
        cleanId = url.searchParams.get('id') || url.pathname.split('/').filter(Boolean).pop() || cleanId;
      } catch (e) {
        // Fallback to cleanId
      }
    }

    const pointsToAdd = spendAmount ? Math.floor(parseFloat(spendAmount) * 10) : 0;

    // 1. Fetch current member from Firebase Firestore
    const memberRef = doc(db, 'members', cleanId);
    const memberSnap = await getDoc(memberRef);

    let currentPoints = 0;
    let memberName = 'GULA MEMBER';

    if (memberSnap.exists()) {
      const data = memberSnap.data();
      currentPoints = data.points || 0;
      memberName = data.name || memberName;
    }

    const updatedTotal = currentPoints + pointsToAdd;

    // 2. Save new points balance directly to Firebase
    if (memberSnap.exists()) {
      await updateDoc(memberRef, {
        points: updatedTotal,
        lastUpdated: new Date().toISOString(),
      });
    } else {
      await setDoc(memberRef, {
        name: memberName,
        points: updatedTotal,
        createdAt: new Date().toISOString(),
      });
    }

    // 3. Sync with WalletWallet API
    const apiKey = process.env.WALLETWALLET_API_KEY;
    if (apiKey) {
      // Try updating existing pass
      let walletRes = await fetch(`https://api.walletwallet.dev/v1/passes/${cleanId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          primaryFields: [
            { key: 'POINTS', value: updatedTotal.toString(), label: 'POINTS' },
          ],
          barcode: { type: 'QR', value: cleanId },
        }),
      });

      // If pass was not found on WalletWallet (404), auto-register it on WalletWallet
      if (walletRes.status === 404) {
        await fetch('https://api.walletwallet.dev/v1/passes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            serialNumber: cleanId,
            logoText: 'GULA EXPRESS',
            primaryFields: [
              { key: 'POINTS', value: updatedTotal.toString(), label: 'POINTS' },
            ],
            secondaryFields: [
              { key: 'MEMBER', value: memberName.toUpperCase(), label: 'MEMBER' },
            ],
            barcode: { type: 'QR', value: cleanId },
          }),
        });
      }
    }

    return NextResponse.json({
      success: true,
      pointsAdded: pointsToAdd,
      newTotal: updatedTotal,
    });

  } catch (error: any) {
    console.error('Error adding points:', error);
    return NextResponse.json(
      { error: error.message || 'Server error updating points' },
      { status: 500 }
    );
  }
}
