import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { memberId, spendAmount } = await req.json();

    if (!memberId) {
      return NextResponse.json({ error: 'Missing Member ID' }, { status: 400 });
    }

    // 1. Calculate new points (10 points per dollar spent)
    const pointsToAdd = spendAmount ? Math.floor(spendAmount * 10) : 0;
    
    // TODO: Fetch the member's current total points from your database/Firebase here if needed
    const currentPoints = 100; // Replace with actual database lookup
    const updatedTotal = currentPoints + pointsToAdd;

    // 2. Send PATCH update to WalletWallet so pass design and QR code stay untouched
    const walletRes = await fetch(`https://api.walletwallet.dev/v1/passes/${memberId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WALLETWALLET_API_KEY}`,
      },
      body: JSON.stringify({
        fields: {
          points: updatedTotal,
        },
        barcode: {
          type: 'QR',
          value: memberId, // Preserves the static QR code
        },
      }),
    });

    if (!walletRes.ok) {
      const errData = await walletRes.text();
      console.error('WalletWallet API error:', errData);
      throw new Error('Failed to update WalletWallet pass');
    }

    return NextResponse.json({ 
      success: true, 
      pointsAdded: pointsToAdd,
      newTotal: updatedTotal 
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
