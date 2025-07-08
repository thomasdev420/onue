'use client';

import SessionProviderWrapper from "../../SessionProviderWrapper";

export default function ProductionSessionProvider({ children }) {
    return (
      <SessionProviderWrapper>
        {children}
      </SessionProviderWrapper>
    );
} 