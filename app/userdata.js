// This file defines the structure for collecting user data during onboarding.
// It will be used in a future pop-up section when users create their account.
// The collected data can be used to personalize founder context for AI-assisted workflows.

const userDataTemplate = {
  name: '',
  email: '',
  interests: [], // e.g. ['B2B SaaS', 'climate', 'AI tooling']
  goals: '', // e.g. 'Get recommended by AI assistants in my category'
  company: '',
  role: '',
  experienceLevel: '', // e.g. 'beginner', 'intermediate', 'expert'
  // Add more fields as needed for your use case
};

export default userDataTemplate; 