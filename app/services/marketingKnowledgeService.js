/**
 * Marketing Knowledge Service
 * Provides marketing strategies, fundamentals, and content guidelines
 */

// Platform-specific marketing strategies
export const PLATFORM_STRATEGIES = {
  instagram: {
    name: 'Instagram',
    engagement: 'Visual storytelling with high-quality images, stories, and reels. Use hashtags strategically and engage with followers through comments and DMs.'
  },
  tiktok: {
    name: 'TikTok',
    engagement: 'Short-form video content with trending sounds and challenges. Focus on entertainment value and viral potential.'
  },
  linkedin: {
    name: 'LinkedIn',
    engagement: 'Professional content with industry insights, thought leadership, and networking opportunities. Use business-focused language.'
  },
  facebook: {
    name: 'Facebook',
    engagement: 'Community-focused content with groups, live videos, and personal connections. Mix of professional and casual tone.'
  },
  twitter: {
    name: 'Twitter',
    engagement: 'Real-time updates, industry news, and concise insights. Use hashtags and engage in conversations.'
  },
  youtube: {
    name: 'YouTube',
    engagement: 'Long-form educational content, tutorials, and in-depth analysis. Focus on providing comprehensive value.'
  },
  pinterest: {
    name: 'Pinterest',
    engagement: 'Visual discovery with infographics, DIY content, and inspirational boards. Optimize for search and discovery.'
  }
};

// Core marketing fundamentals
export const MARKETING_FUNDAMENTALS = {
  audience: 'Understand your target audience deeply - their pain points, desires, and behaviors',
  value: 'Always provide clear, actionable value in every piece of content',
  consistency: 'Maintain consistent branding, messaging, and posting frequency',
  engagement: 'Focus on building genuine relationships, not just broadcasting messages',
  measurement: 'Track key metrics to understand what works and optimize accordingly',
  authenticity: 'Be genuine and transparent in all communications',
  storytelling: 'Use compelling narratives to connect emotionally with your audience',
  optimization: 'Continuously test and improve based on data and feedback'
};

// Content creation guidelines
export const CONTENT_GUIDELINES = {
  clarity: 'Make your message crystal clear and easy to understand',
  brevity: 'Keep content concise and focused on one main point',
  action: 'Include clear calls-to-action when appropriate',
  visual: 'Use high-quality visuals to enhance your message',
  timing: 'Post when your audience is most active and engaged',
  relevance: 'Ensure content is timely and relevant to your audience',
  quality: 'Maintain high standards for all content published',
  engagement: 'Encourage interaction and conversation with your audience'
};

/**
 * Generate content ideas based on topic and platform
 * @param {string} topic - The main topic or theme
 * @param {string} platform - The target platform
 * @param {object} businessContext - Business context information
 * @returns {Array} Array of content ideas
 */
export function generateContentIdeas(topic, platform, businessContext = {}) {
  const ideas = [];
  
  // Platform-specific content ideas
  switch (platform.toLowerCase()) {
    case 'instagram':
      ideas.push(
        `Visual story about ${topic}`,
        `Before/after transformation with ${topic}`,
        `Behind-the-scenes look at ${topic}`,
        `Infographic highlighting key ${topic} insights`,
        `User-generated content featuring ${topic}`
      );
      break;
      
    case 'tiktok':
      ideas.push(
        `Quick tip about ${topic}`,
        `Trending challenge related to ${topic}`,
        `Day-in-the-life featuring ${topic}`,
        `Educational short about ${topic}`,
        `Fun fact about ${topic}`
      );
      break;
      
    case 'linkedin':
      ideas.push(
        `Industry insight about ${topic}`,
        `Professional tip for ${topic}`,
        `Case study involving ${topic}`,
        `Expert opinion on ${topic}`,
        `Trend analysis in ${topic}`
      );
      break;
      
    default:
      ideas.push(
        `Key insight about ${topic}`,
        `Practical tip for ${topic}`,
        `Interesting fact about ${topic}`,
        `How-to guide for ${topic}`,
        `Success story with ${topic}`
      );
  }
  
  return ideas;
} 