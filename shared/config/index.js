// Shared configuration between frontend and backend
const sharedConfig = {
  appName: 'ReelsPro Ultimate v12',
  version: '12.0.0',
  roles: {
    ADMIN: 'admin',
    USER: 'user'
  },
  status: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    SUSPENDED: 'suspended'
  },
  aiProviders: {
    GROQ: 'groq',
    GEMINI: 'gemini',
    OPENROUTER: 'openrouter',
    HUGGINGFACE: 'huggingface'
  },
  reelSettings: {
    maxDuration: 10,
    aspectRatio: '9:16',
    resolutions: ['1080x1920']
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = sharedConfig;
} else {
  export default sharedConfig;
}
