"use client";

import SessionProviderWrapper from "../../SessionProviderWrapper";

export default function ProductionSessionProvider({ children }) {
  // In client component, we don't need to get session server-side
  // The session will be handled by the SessionProviderWrapper
  return (
    <SessionProviderWrapper session={null}>
      {children}
    </SessionProviderWrapper>
  );
} 