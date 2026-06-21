import { withAuth } from 'next-auth/middleware';

export const proxy = withAuth(
  function proxy() {
    // Standard NextAuth middleware wrapper
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export default proxy;

export const config = {
  matcher: ['/dashboard/:path*'],
};
