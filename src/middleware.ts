import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(_req) {
    return NextResponse.next();
  },
  {
    pages: {
      signIn: '/auth/signin',
    },
  }
);

export const config = {
  matcher: [
    '/board/:path*',
    '/api/posts/:path*',
  ],
};