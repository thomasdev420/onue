import { permanentRedirect } from 'next/navigation';

/** Single funnel: full story, checkout, and steps live on /providers */
export default function ForProvidersRedirectPage() {
  permanentRedirect('/providers');
}
