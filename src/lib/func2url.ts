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
  'geocode',
  'update-location',
];

// Generate FUNCTIONS object with API Gateway URLs
export const FUNCTIONS = FUNCTION_NAMES.reduce((acc, name) => {
  acc[name] = `${API_GATEWAY}/${name}`;
  return acc;
}, {} as Record<string, string>);

// upload-photo - separate function on poehali.dev for profile photo uploads
FUNCTIONS['upload-photo'] = 'https://functions.poehali.dev/e02155bb-d5d7-4a35-81a4-b089847fecf4';

// geocode - separate function on poehali.dev for geolocation (API Gateway doesn't proxy it)
FUNCTIONS['geocode'] = 'https://functions.poehali.dev/90e9cacc-48ca-4b42-b817-3a77b67db25c';

// get-user - separate function on poehali.dev for user data with city field
FUNCTIONS['get-user'] = 'https://functions.poehali.dev/518f730f-1a8e-45ad-b0ed-e9a66c5a3784';

// generate-upload-url - for voice messages and chat photo uploads (on Yandex Cloud)
FUNCTIONS['generate-upload-url'] = 'https://functions.yandexcloud.net/d4e1drhlub4imqleg10q';

console.log('[FUNC2URL] Generated FUNCTIONS:', FUNCTIONS);
console.log('[FUNC2URL] upload-photo =', FUNCTIONS['upload-photo']);
console.log('[FUNC2URL] generate-upload-url =', FUNCTIONS['generate-upload-url']);