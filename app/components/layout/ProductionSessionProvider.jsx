import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import SessionProviderWrapper from "../../SessionProviderWrapper";

export default async function ProductionSessionProvider({ children }) {
  try {
    const session = await getServerSession(authOptions);
    return (
      <SessionProviderWrapper session={session}>
        {children}
      </SessionProviderWrapper>
    );
  } catch (error) {
    console.error('Error getting server session:', error);
    // Fallback to no session if there's an error
    return (
      <SessionProviderWrapper session={null}>
        {children}
      </SessionProviderWrapper>
    );
  }
} 