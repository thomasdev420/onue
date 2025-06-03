'use client';

import { useEffect, useState } from 'react';

export default function VersionDisplay() {
  const [version, setVersion] = useState('');

  useEffect(() => {
    // Fetch version from package.json
    fetch('/api/version')
      .then(res => res.json())
      .then(data => setVersion(data.version))
      .catch(err => console.error('Error fetching version:', err));
  }, []);

  if (!version) return null;

  return (
    <div className="fixed top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
      Beta v{version}
    </div>
  );
} 