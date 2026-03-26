import Phase0DemoClient from './Phase0DemoClient';

export const metadata = {
  title: 'Phase 0 — Amply',
  description: 'Live Pinecone Phase 0 pipeline (POST /api/phase0)',
};

export default function Phase0DemoPage() {
  return <Phase0DemoClient />;
}
