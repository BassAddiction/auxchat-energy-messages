// API Gateway Configuration - proxies all backend functions
const API_GATEWAY = 'https://auxchat.ru/api';

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

// upload-photo - uploads to Timeweb S3 via HTTP PUT (now on auxchat.ru)
FUNCTIONS['upload-photo'] = `${API_GATEWAY}/upload-photo`;

// geocode - for geolocation (now on auxchat.ru)
FUNCTIONS['geocode'] = `${API_GATEWAY}/geocode`;

// get-user - for user data with city field (now on auxchat.ru)
FUNCTIONS['get-user'] = `${API_GATEWAY}/get-user`;

// update-location - for updating user geolocation (now on auxchat.ru)
FUNCTIONS['update-location'] = `${API_GATEWAY}/update-location`;

// generate-upload-url - for voice messages and chat photo uploads (now on auxchat.ru)
FUNCTIONS['generate-upload-url'] = `${API_GATEWAY}/generate-upload-url`;

// generate-presigned-url - for direct photo uploads to Timeweb S3 (now on auxchat.ru)
FUNCTIONS['generate-presigned-url'] = `${API_GATEWAY}/generate-presigned-url`;

console.log('[FUNC2URL] Generated FUNCTIONS:', FUNCTIONS);
console.log('[FUNC2URL] upload-photo =', FUNCTIONS['upload-photo']);
console.log('[FUNC2URL] generate-upload-url =', FUNCTIONS['generate-upload-url']);