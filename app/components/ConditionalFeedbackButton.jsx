"use client";

import { usePathname } from 'next/navigation';
import FeedbackButton from './FeedbackButton';

export default function ConditionalFeedbackButton() {
  const pathname = usePathname();
  
  // Don't show feedback button on the home page when coming soon is active
  if (pathname === '/') {
    return null;
  }
  
  return <FeedbackButton />;
}
