import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { memberId, spendAmount } = await req.json();

    if (!memberId) {
      return NextResponse.json({ error: 'Missing Member ID' }, { status: 400 });
    }

    const pointsToAdd = spendAmount ? Math.floor(spendAmount * 10) : 0;
    
    // Fetch total or set calculated total
    const currentPoints = 100; // Replace with database lookup if used
    const updatedTotal = currentPoints + pointsToAdd;

    // PATCH update matching the exact Pass Editor keys
    const walletRes = await fetch(`https://api.walletwallet.dev/v1/passes/${memberId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WALLETWALLET_API_KEY}`,
      },
      body: JSON.stringify({
        primaryFields: [
          {
            key: 'POINTS',
            value: updatedTotal.toString(),
            label: 'POINTS',
          },
        ],
        barcode: {
          type: 'QR',
          value: memberId,
        },
      }),
    });

    if (!walletRes.ok) {
      const errText = await walletRes.text();
      console.error('WalletWallet error:', errText);
      throw new Error('Failed to update pass');
    }

    return NextResponse.json({ 
      success: true, 
      pointsAdded: pointsToAdd, 
      newTotal: updatedTotal 
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Server Error' }, 
      { status: 500 }
    );
  }
}
