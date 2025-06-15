'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';

export default function FAQ() {
  const [openFAQs, setOpenFAQs] = useState({});

  const faqData = [
    {
      question: "What do I get exactly?",
      answer: "Detailed explanation of what the user gets.",
    },
    {
      question: "What are the ShipFast Leaderboards?",
      answer: `The <span class="text-gray-800 underline">Leaderboards</span> are a fun way to showcase your startup.<br/><br/>Startups are ranked by revenue (verified by Stripe), so you can see who's making the most money.<br/><br/>Leaderboards also help you gain exposure by showing your startup to thousands of entrepreneurs who visit the leaderboards page every month.`,
    },
    {
      question: "What are the ShipFast Discounts?",
      answer: "Detailed explanation of discounts.",
    },
    {
      question: "Does ShipFast work with AI (Cursor, Copilot)?",
      answer: "Detailed explanation about AI compatibility.",
    },
  ];

  const handleToggle = (index) => {
    setOpenFAQs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <section className="w-full py-16">
      <div className="max-w-3xl mx-auto px-4">
        <div className="space-y-4">
          {faqData.map((item, index) => (
            <div key={index} className="border-b border-gray-700 pb-4 last:border-0 last:pb-0">
              <button
                className="w-full flex justify-between items-center text-left py-2"
                onClick={() => handleToggle(index)}
              >
                <h3 className={`text-lg font-semibold ${openFAQs[index] ? 'text-gray-900' : 'text-gray-800'}`}>
                  {item.question}
                </h3>
                {openFAQs[index] ? (
                  <Minus className="w-5 h-5 text-gray-800" />
                ) : (
                  <Plus className="w-5 h-5 text-gray-600" />
                )}
              </button>
              {openFAQs[index] && (
                <p className="mt-2 text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.answer }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 