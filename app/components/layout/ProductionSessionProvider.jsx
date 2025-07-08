'use client';

import SessionProviderWrapper from "../../SessionProviderWrapper";

export default function ProductionSessionProvider({ children, session }) {
    return (
      <SessionProviderWrapper session={session}>
        {children}
      </SessionProviderWrapper>
    );
} 