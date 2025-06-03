import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabase } from "../../../../supabaseClient";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === "google") {
        try {
          // Sign in to Supabase with Google
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: account.id_token,
          });

          if (error) throw error;
          return true;
        } catch (error) {
          console.error('Error signing in to Supabase:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      // Get Supabase session
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      
      // Add Supabase user ID to the session
      if (supabaseSession?.user) {
        session.supabaseUserId = supabaseSession.user.id;
      }
      
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };