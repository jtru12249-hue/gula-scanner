import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { memberId, spendAmount } = await req.json();

    if (!memberId) {
      return NextResponse.json({ error: 'No Pass ID detected from QR code.' }, { status: 400 });
    }

    const apiKey = process.env.WALLETWALLET_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'WALLETWALLET_API_KEY is missing in Vercel settings.' }, { status: 500 });
    }

    const pointsToAdd = spendAmount ? Math.floor(spendAmount * 10) : 0;
    const currentPoints = 100; // Replace with database lookup if used
    const updatedTotal = currentPoints + pointsToAdd;

    const walletRes = await fetch(`https://api.walletwallet.dev/v1/passes/${memberId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
      return NextResponse.json({ error: `Wallet API (${walletRes.status}): ${errText}` }, { status: walletRes.status });
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
