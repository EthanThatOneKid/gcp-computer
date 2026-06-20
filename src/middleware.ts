import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware() {
    // Standard NextAuth middleware wrapper
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*'],
};
