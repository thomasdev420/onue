import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Flightmedia Privacy Policy</h1>
      <p className="mb-4">At Flightmedia (<a href="https://flightmedia.app" className="text-blue-600 underline">https://flightmedia.app</a>), we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy outlines how we collect, use, and safeguard your data when you use our service.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">1. Information We Collect</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>Email address</li>
        <li>User ID (provided by Google)</li>
      </ul>
      <p className="mb-4">This information is used to associate the videos you create with your account and to populate payment fields for Stripe transactions.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">2. How We Use Your Information</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>To tie videos you create to your account</li>
        <li>To facilitate payments through Stripe</li>
        <li>To upload videos to YouTube on your behalf (with your explicit permission)</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">3. YouTube Integration</h2>
      <p className="mb-2">When you grant us permission to access your YouTube account, we only use this access to upload videos on your behalf. We do not:</p>
      <ul className="list-disc ml-6 mb-4">
        <li>Access any personal information from your YouTube account</li>
        <li>Like, subscribe, or view videos on your behalf</li>
        <li>Edit or delete existing videos</li>
        <li>Upload any videos without your explicit permission</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">4. Google Authentication and YouTube API</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>Flightmedia uses Google Authentication and YouTube API Services to provide its functionality. By using our service, you agree to the following:</li>
        <li>You agree to be bound by the YouTube Terms of Service.</li>
        <li>Our API Client uses YouTube API Services to upload videos to YouTube on your behalf.</li>
        <li>By signing into Flightmedia with Google, you are subject to Google's Privacy Policy.</li>
      </ul>
      <h3 className="text-lg font-semibold mt-6 mb-2">Authorised Data Access and Usage</h3>
      <p className="mb-4">Flightmedia accesses and uses authorised data solely for the purpose of uploading videos to YouTube on your behalf. We store authentication access and refresh tokens for authentication purposes until they are no longer needed.</p>
      <h3 className="text-lg font-semibold mt-6 mb-2">Data Deletion and Revoking Access</h3>
      <p className="mb-4">You can revoke Flightmedia's access to your data at any time through the Google security settings page. If you request to remove your authentication, we will promptly delete all associated tokens and data.</p>
      <h3 className="text-lg font-semibold mt-6 mb-2">Video Upload Process</h3>
      <p className="mb-2">When uploading videos to YouTube, Flightmedia will ask for your permission to set the following metadata properties:</p>
      <ul className="list-disc ml-6 mb-4">
        <li>Title</li>
        <li>Description</li>
        <li>Privacy status (Public, Unlisted, or Private)</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">5. Data Sharing and Third Parties</h2>
      <p className="mb-4">We do not sell, share, or disclose your personal information to any third parties. Your data is kept strictly for use within our product.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">6. Data Storage and Security</h2>
      <p className="mb-4">Your Google information is stored securely in our database and will not be transferred outside our system unless you request us to delete your email and associated videos.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">7. Cookies and Tracking</h2>
      <p className="mb-4">We do not use cookies or tracking technologies to track users. We use PostHog to monitor button clicks within the application for the purpose of improving user experience. This information is kept internal and is not sold or shared with any third parties.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">8. Your Rights</h2>
      <p className="mb-4">You have the right to request deletion of your email and videos created using our service. To exercise this right, please contact us using the information provided below.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">9. Changes to This Policy</h2>
      <p className="mb-4">We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">10. Contact Us</h2>
      <p className="mb-4">If you have any questions about this Privacy Policy, please contact us at:</p>
      <p className="mb-4">Email: <a href="mailto:thjcollins42@gmail.com" className="text-blue-600 underline">thjcollins42@gmail.com</a></p>
      <h2 className="text-xl font-semibold mt-8 mb-2">11. Compliance</h2>
      <p className="mb-4">While we strive to adhere to best practices in data protection, we recommend consulting with a legal professional to ensure full compliance with all applicable privacy laws and regulations, which may include GDPR, CCPA, or others depending on your user base and operational jurisdictions.</p>
      <p className="text-sm text-gray-500 mt-8">Last updated: 7/3/2025</p>
    </div>
  );
} 