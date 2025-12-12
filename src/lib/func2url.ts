// API Gateway Configuration - proxies all backend functions
const API_GATEWAY = 'https://d5dkffis8kfdsr7g6rjo.z7jmlavt.apigw.yandexcloud.net';

// Function names that are proxied through API Gateway
const FUNCTION_NAMES = [
  'add-energy',
  'generate-upload-url',
  'create-payment',
  'payment-webhook',
  'get-messages',
  'login',
  'get-subscriptions',
  'get-conversations',
  'create-user',
  'verify-sms',
  'reset-password',
  'add-reaction',
  'profile-photos',
  'blacklist',
  'send-sms',
  'send-message',
  'register',
  'subscribe',
  'update-activity',
  'private-messages',
  'admin-users',
  'get-user',
];

// Generate FUNCTIONS object with API Gateway URLs
export const FUNCTIONS = FUNCTION_NAMES.reduce((acc, name) => {
  acc[name] = `${API_GATEWAY}/${name}`;
  return acc;
}, {} as Record<string, string>);