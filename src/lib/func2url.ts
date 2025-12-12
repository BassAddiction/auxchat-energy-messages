// API Gateway Configuration - proxies all backend functions
const API_GATEWAY = 'https://d5dkffis8kfdsr7g6rjo.z7jmlavt.apigw.yandexcloud.net';

// Function names that are proxied through API Gateway
const FUNCTION_NAMES = [
  'add-energy',
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

// upload-photo - separate function on poehali.dev for photo uploads
FUNCTIONS['upload-photo'] = 'https://functions.poehali.dev/e02155bb-d5d7-4a35-81a4-b089847fecf4';

console.log('[FUNC2URL] Generated FUNCTIONS:', FUNCTIONS);
console.log('[FUNC2URL] upload-photo =', FUNCTIONS['upload-photo']);