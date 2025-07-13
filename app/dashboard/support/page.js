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
      question: "Is this just another AI slop generator?",
      answer: "Absolutely not. Most AI tools churn out generic, lifeless content because they rely solely on automation. Swiftreel is different. We blend advanced AI with content optimization tools and your unique voice, so what you get isn’t just fast, it’s authentically you. Engaging. Real. Memorable."
    },
    {
      question: "Can I customize the generated content?",
      answer: "Absolutely! All generated content is fully editable. You can modify text, adjust positioning, change colors, add images, and customize every aspect of your slides and memes using our intuitive drag-and-drop interface."
    },
    {
      question: "How do you get such good results?",
      answer: "At Swiftreel, every piece of content is uniquely crafted using the information you provide. We run it through a proven system that tests and refines it hundreds of times to ensure it’s as effective and engaging as possible. Then, we use AI to fine-tune the final version and schedule it for posting at the optimal time — so your content always performs at its best."
    },
    {
      question: "How does the AI content generation work?",
      answer: "Our AI analyzes your prompts and business context to create relevant, engaging content. It considers your brand voice, target audience, and content goals to generate personalized slides, memes, and videos that match your style."
    },
    {
      question: "How does the content proccess work?",
      answer: "Our model works with you to uncover unique, emotionally resonant, and context-aware stories, ideas, and insights that are 100 percent original and completely your own. We then refine the content to optimize it for reach and engagement, publish it at the right time, and gather feedback to keep improving with every post."
    },
    {
      question: "Can i fully automate my content creation?",
      answer: "Some types of content are best fully automated, but for others, the best results come when you're involved, usually just a few hours each month."
    },
    {
      question: "What social media platforms are supported?", 
      answer: "We support all major platforms including TikTok, Instagram, Facebook, Twitter, LinkedIn, and YouTube. Each platform is optimized for the best performance and engagement."
    },
    {
      question: "How do I upgrade my account?",
      answer: "Click the 'Upgrade' button in your sidebar to view our premium plans. Premium features include unlimited content generation, advanced analytics, priority support, and exclusive templates."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use enterprise-grade security measures to protect your data. All content and personal information is encrypted and stored securely. We never share your data with third parties."
    },
    {
      question: "How can I get help if I'm stuck?",
      answer: "You can reach our support team through the contact form below, email us directly, or use our live chat feature. We typically respond within 24 hours and offer priority support for premium users."
    }
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Support Center</h1>
        <p className="text-gray-600 text-lg">Find answers to common questions and get the help you need</p>
      </div>

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