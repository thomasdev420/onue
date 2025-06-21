import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const providers = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }),
];

// Add the Credentials provider only in development
if (process.env.NODE_ENV === "development") {
  providers.push(
    CredentialsProvider({
      name: "Development Login",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "dev@local.com" },
      },
      async authorize(credentials, req) {
        // This is a mock authorization for development.
        // It accepts any email and returns a user object.
        if (credentials?.email) {
          return { id: "1", name: "Dev User", email: credentials.email };
        }
        // Return null if authentication fails
        return null;
      },
    })
  );
}

export const authOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };