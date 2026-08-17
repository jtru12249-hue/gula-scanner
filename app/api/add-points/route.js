import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function POST(request) {
  try {
    const { memberId, spendAmount, action } = await request.json();

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const memberRef = doc(db, 'members', memberId);
    const memberSnap = await getDoc(memberRef);

    if (!memberSnap.exists()) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const memberData = memberSnap.data();
    let currentPoints = memberData.points || 0;
    let newBalance = currentPoints;
    let pointsEarned = 0;

    // Handle Reward Redemption
    if (action === 'REDEEM') {
      if (currentPoints < 1000) {
        return NextResponse.json({ error: 'Insufficient points (1,000 required)' }, { status: 400 });
      }
      newBalance = currentPoints - 1000;
    } 
    // Handle Adding Points from Purchase
    else {
      if (spendAmount === undefined || isNaN(spendAmount)) {
        return NextResponse.json({ error: 'Valid spend amount is required' }, { status: 400 });
      }
      pointsEarned = Math.floor(spendAmount * 10); // 10 points per $1
      newBalance = currentPoints + pointsEarned;
    }

    // 1. Update Firestore
    await updateDoc(memberRef, { points: newBalance });

    // 2. Push update using your direct Imgur image link
    if (memberData.passId) {
      const logoUrl = 'https://i.imgur.com/Q6JfH2E.jpeg'; 

      const walletRes = await fetch(`https://api.walletwallet.dev/api/passes/${memberData.passId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WALLETWALLET_API_KEY}`
        },
        body: JSON.stringify({
          logoText: 'GULA EXPRESS',
          backgroundColor: 'rgb(26, 26, 26)',  
          foregroundColor: 'rgb(255, 255, 255)', 
          labelColor: 'rgb(255, 107, 0)',       
          logoURL: logoUrl,
          iconURL: logoUrl,
          primaryFields: [
            { key: 'points_balance', label: 'POINTS', value: String(newBalance) }
          ],
          secondaryFields: [
            { label: 'MEMBER', value: memberData.name || 'Gold Status' },
            { label: 'NEXT REWARD', value: 'Free Cachapa at 1,000 pts' }
          ],
          backFields: [
            { label: 'Program Details', value: 'Earn 10 points for every $1 spent at GULA EXPRESS.' }
          ]
        })
      });

      const resData = await walletRes.json().catch(() => ({}));
      console.log('WalletWallet API response status:', walletRes.status, resData);
    }

    return NextResponse.json({
      success: true,
      action: action === 'REDEEM' ? 'REDEEM' : 'ADD',
      pointsEarned,
      newBalance
    });

  } catch (error) {
    console.error('Error updating points:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
