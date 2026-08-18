import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { memberId, spendAmount } = await req.json();

    if (!memberId) {
      return NextResponse.json({ error: 'No data scanned from QR code.' }, { status: 400 });
    }

    const apiKey = process.env.WALLETWALLET_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'WALLETWALLET_API_KEY is missing in Vercel environment variables.' }, { status: 500 });
    }

    // Clean up the scanned ID: if it's a URL, extract the ID parameter or last path segment
    let cleanPassId = memberId.trim();
    if (cleanPassId.includes('http://') || cleanPassId.includes('https://')) {
      try {
        const url = new URL(cleanPassId);
        cleanPassId = url.searchParams.get('id') || url.pathname.split('/').filter(Boolean).pop() || cleanPassId;
      } catch (e) {
        // Fallback to raw string if URL parsing fails
      }
    }

    const pointsToAdd = spendAmount ? Math.floor(spendAmount * 10) : 0;
    const currentPoints = 100; // Replace with database lookup if used
    const updatedTotal = currentPoints + pointsToAdd;

    const walletRes = await fetch(`https://api.walletwallet.dev/v1/passes/${cleanPassId}`, {
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
          value: cleanPassId,
        },
      }),
    });

    if (!walletRes.ok) {
      const errText = await walletRes.text();
      console.error(`WalletWallet Error (Scanned ID: ${cleanPassId}):`, errText);
      return NextResponse.json(
        { error: `Wallet API (404): Scanned ID "${cleanPassId}" was not found in WalletWallet.` }, 
        { status: walletRes.status }
      );
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
