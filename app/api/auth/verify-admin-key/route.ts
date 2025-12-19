import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Admin secret key - should be stored in environment variable
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'BOZQ_BARBERSHOP_ADMIN_2025_SECRET';

/**
 * POST /api/auth/verify-admin-key
 * Verify if provided admin secret key is valid
 * Used for exclusive admin registration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secretKey } = body;

    if (!secretKey) {
      return NextResponse.json(
        { valid: false, error: 'Secret key required' },
        { status: 400 }
      );
    }

    // Verify secret key
    const isValid = secretKey === ADMIN_SECRET_KEY;

    if (!isValid) {
      return NextResponse.json(
        { valid: false, error: 'Invalid admin secret key' },
        { status: 401 }
      );
    }

    // Valid key
    return NextResponse.json({
      valid: true,
      message: 'Admin secret key verified',
    });
  } catch (error: any) {
    console.error('Verify admin key error:', error);
    return NextResponse.json(
      { valid: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
