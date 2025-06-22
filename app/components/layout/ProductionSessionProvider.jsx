import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import SessionProviderWrapper from "../../SessionProviderWrapper";

export default async function ProductionSessionProvider({ children }) {
  const session = await getServerSession(authOptions);
  return (
    <SessionProviderWrapper session={session}>
      {children}
    </SessionProviderWrapper>
  );
} 