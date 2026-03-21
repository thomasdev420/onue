'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle, Mail, HelpCircle } from 'lucide-react';

export default function Support() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: 'What is AI Selection?',
      answer:
        'We simulate how shopping assistants (like ChatGPT and Claude) answer real buyer questions, then measure whether your product is mentioned and whether it’s picked as the best option. That gives you visibility and selection scores you can improve over time.',
    },
    {
      question: 'How do I run a scan?',
      answer:
        'Go to AI Selection in the sidebar, paste your public product or store URL, and choose Ingest. Then run a selection scan. You’ll need OpenAI (and optionally Anthropic) API keys configured on the server, plus Supabase with the amply_* tables. See AMPLY_SELECTION_MVP.md in the repo.',
    },
    {
      question: 'Where did social posting and slide generation go?',
      answer:
        'This workspace is focused on winning when AI chooses products, not on scheduling TikTok or generating slide decks. Those features were removed from the dashboard to match the product mission.',
    },
    {
      question: 'How do I upgrade my account?',
      answer:
        "Use the Upgrade button in the sidebar to view plans. Higher tiers include more credits for AI-powered features as we expand selection scans and fixes.",
    },
    {
      question: 'Is my data secure?',
      answer:
        'We use standard security practices for authentication and storage. Scan data is tied to your account; follow your own privacy policy for customer-facing claims.',
    },
    {
      question: 'How can I get help if I’m stuck?',
      answer:
        'Use the options below to reach support. We typically respond within 24 hours; premium users may get priority.',
    },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">


      {/* FAQ Section */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-8">
          <HelpCircle className="text-[#3953e6]" size={24} />
          <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                {openFaq === index ? (
                  <ChevronUp className="text-[#3953e6] flex-shrink-0" size={20} />
                ) : (
                  <ChevronDown className="text-gray-400 flex-shrink-0" size={20} />
                )}
              </button>
              {openFaq === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-gradient-to-r from-[#3953e6] to-[#36aeea] rounded-2xl p-8 text-white">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Still Need Help?</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <MessageCircle size={24} />
              <h3 className="font-semibold">Live Chat</h3>
            </div>
            <p className="text-blue-100 text-sm mb-4">Let my AI assistant help you right now</p>
            <button className="bg-white text-[#3953e6] px-4 py-2 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
              Start Chat
            </button>
          </div>
          
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <Mail size={24} />
              <h3 className="font-semibold">Email Support</h3>
            </div>
            <p className="text-blue-100 text-sm mb-4">I&apos;ll personally get back to you as soon as possible</p>
            <button className="bg-white text-[#3953e6] px-4 py-2 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
              Send Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 