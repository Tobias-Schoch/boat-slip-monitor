// Example URLs - configure your own in the database or environment
export const MONITORED_URLS = [
  {
    name: 'Example Website 1',
    url: 'https://example.com',
    description: 'Example website to monitor'
  }
] as const;

// Configure keywords based on your monitoring needs
// Critical keywords trigger high-priority notifications
export const CRITICAL_KEYWORDS = [
  'registration',
  'apply',
  'application',
  'form',
  'submit',
  'available',
  'now open',
  'sign up',
  'register'
] as const;

// Important keywords trigger medium-priority notifications
export const IMPORTANT_KEYWORDS = [
  'updated',
  'new',
  'change',
  'information',
  'deadline',
  'announcement'
] as const;
