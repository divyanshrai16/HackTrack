import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const res = NextResponse.json({ ok: true, message: 'Setting test cookie' })
    res.cookies.set('hacktrack_test', '1', {
      path: '/',
      sameSite: 'lax',
      secure: true,
    } as any)
    return res
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
