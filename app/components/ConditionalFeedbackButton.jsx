"use client";

import { usePathname } from 'next/navigation';
import FeedbackButton from './FeedbackButton';

export default function ConditionalFeedbackButton() {
  const pathname = usePathname();
  
  // Show feedback button on all pages except when coming soon is active
  // The coming soon page will handle its own feedback button visibility
  return <FeedbackButton />;
}
