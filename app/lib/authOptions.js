import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

function validateRequiredEnvVars() {
  const requiredEnvVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error("Missing required environment variables:", missingVars);
  }

  return missingVars.length === 0;
}

validateRequiredEnvVars();

function buildProviders() {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    return [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code",
          },
        },
      }),
    ];
  }

  return [
    CredentialsProvider({
      id: "oauth-not-configured",
      name: "OAuth not configured",
      credentials: {},
      async authorize() {
        return null;
      },
    }),
  ];
}

export const authOptions = {
  providers: buildProviders(),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  debug: process.env.NODE_ENV === "development",
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60,
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.callback-url"
          : "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60,
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Host-next-auth.csrf-token"
          : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60,
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log("🔐 Sign in attempt:", {
        user: user?.email,
        provider: account?.provider,
        account: account ? "present" : "missing",
        timestamp: new Date().toISOString(),
        userAgent:
          typeof window !== "undefined" ? window.navigator.userAgent : "server",
      });
      return true;
    },
    async jwt({ token, user, account }) {
      console.log("🔄 JWT callback:", {
        token: token ? "present" : "missing",
        user: user ? "present" : "missing",
        account: account ? "present" : "missing",
        timestamp: new Date().toISOString(),
        tokenSub: token?.sub,
        userEmail: user?.email,
      });
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("📋 Session callback:", {
        session: session ? "present" : "missing",
        token: token ? "present" : "missing",
        userEmail: session?.user?.email,
        timestamp: new Date().toISOString(),
        tokenSub: token?.sub,
        sessionUser: session?.user ? "present" : "missing",
      });
      if (token) {
        session.user.id = token.sub;
        session.accessToken = token.accessToken;
        session.provider = token.provider;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log("🔄 Redirect callback:", {
        url,
        baseUrl,
        timestamp: new Date().toISOString(),
      });
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`;
        console.log("📍 Redirecting to:", redirectUrl);
        return redirectUrl;
      }
      if (
        typeof url === "string" &&
        typeof baseUrl === "string" &&
        /^https?:\/\//.test(url) &&
        /^https?:\/\//.test(baseUrl)
      ) {
        try {
          const urlOrigin = new URL(url).origin;
          const baseUrlOrigin = new URL(baseUrl).origin;
          if (urlOrigin === baseUrlOrigin) {
            console.log("📍 Redirecting to same origin:", url);
            return url;
          }
        } catch (error) {
          console.warn("⚠️ Invalid URL in redirect callback:", error);
        }
      }
      console.log("📍 Default redirect to baseUrl:", baseUrl);
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
