// This file defines the structure for collecting user data during onboarding.
// It will be used in a future pop-up section when users create their account.
// The collected data can be used to personalize and improve ChatGPT API prompts.

const userDataTemplate = {
  name: '',
  email: '',
  interests: [], // e.g. ['marketing', 'memes', 'ai']
  goals: '', // e.g. 'Grow my TikTok following'
  company: '',
  role: '',
  experienceLevel: '', // e.g. 'beginner', 'intermediate', 'expert'
  // Add more fields as needed for your use case
};

export default userDataTemplate; 