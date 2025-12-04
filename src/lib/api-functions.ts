// API Configuration using poehali.dev Cloud Functions
// Auto-generated from backend/func2url.json

const FUNCTIONS: Record<string, string> = {
  "generate-upload-url": "https://functions.poehali.dev/559ff756-6b7f-42fc-8a61-2dac6de68639",
  "update-activity": "https://functions.poehali.dev/a70b420b-cb23-4948-9a56-b8cefc96f976",
  "blacklist": "https://functions.poehali.dev/7d7db6d4-88e3-4f83-8ad5-9fc30ccfd5bf",
  "get-subscriptions": "https://functions.poehali.dev/ac3ea823-b6ec-4987-9602-18e412db6458",
  "subscribe": "https://functions.poehali.dev/332c7a6c-5c6e-4f84-85de-81c8fd6ab8d5",
  "profile-photos": "https://functions.poehali.dev/6ab5e5ca-f93c-438c-bc46-7eb7a75e2734",
  "get-conversations": "https://functions.poehali.dev/aea3125a-7d11-4637-af71-0998dfbaf5b2",
  "private-messages": "https://functions.poehali.dev/0222e582-5c06-4780-85fa-c9145e5bba14",
  "payment-webhook": "https://functions.poehali.dev/39c159dc-cf4b-4d2e-8919-591b5583cb96",
  "create-payment": "https://functions.poehali.dev/f92685aa-bd08-4a3c-9170-4d421a00058c",
  "add-energy": "https://functions.poehali.dev/f9307039-6dd4-4bc5-9b0e-992b36715215",
  "register": "https://functions.poehali.dev/1d4d268e-0d0a-454a-a1cc-ecd19c83471a",
  "reset-password": "https://functions.poehali.dev/f1d38f0f-3d7d-459b-a52f-9ae703ac77d3",
  "login": "https://functions.poehali.dev/57bd04c8-4731-4857-a2b8-a71c6bda783a",
  "add-reaction": "https://functions.poehali.dev/71ceb200-e467-4cf1-8f37-7d831ae549e7",
  "get-user": "https://functions.poehali.dev/518f730f-1a8e-45ad-b0ed-e9a66c5a3784",
  "create-user": "https://functions.poehali.dev/ce477ede-fb67-4de1-8f61-ad91d7ba3623",
  "admin-users": "https://functions.poehali.dev/c9561d6d-10c4-4b31-915e-07e239e7ae5f",
  "get-messages": "https://functions.poehali.dev/392f3078-9f28-4640-ab86-dcabecaf721a",
  "send-message": "https://functions.poehali.dev/8d34c54f-b2de-42c1-ac0c-9f6ecf5e16f6",
  "verify-sms": "https://functions.poehali.dev/c4359550-f604-4126-8e72-5087a670b7cb",
  "send-sms": "https://functions.poehali.dev/39b076de-8be1-48c0-8684-f94df4548b91"
};

function getUrl(functionName: string): string {
  const url = FUNCTIONS[functionName];
  if (!url) {
    throw new Error(`Function ${functionName} not found in func2url.json`);
  }
  return url;
}

export const api = {
  // Helper to add auth header
  headers(userId?: string | null) {
    const id = userId || localStorage.getItem('auxchat_user_id');
    return {
      'Content-Type': 'application/json',
      ...(id && { 'X-User-Id': id }),
    };
  },

  // Auth endpoints
  async login(phone: string, password: string) {
    const res = await fetch(getUrl('login'), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ username: phone, password }),
    });
    if (!res.ok) throw new Error(`Login failed: ${res.statusText}`);
    return res.json();
  },

  async register(username: string, phone: string, password: string, code: string) {
    const res = await fetch(getUrl('register'), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ username, phone, password, code }),
    });
    if (!res.ok) throw new Error(`Register failed: ${res.statusText}`);
    return res.json();
  },

  async sendSMS(phone: string) {
    const res = await fetch(getUrl('send-sms'), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) throw new Error(`Send SMS failed: ${res.statusText}`);
    return res.json();
  },

  async verifySMS(phone: string, code: string) {
    const res = await fetch(getUrl('verify-sms'), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ phone, code }),
    });
    if (!res.ok) throw new Error(`Verify SMS failed: ${res.statusText}`);
    return res.json();
  },

  async resetPassword(phone: string, code: string, newPassword: string) {
    const res = await fetch(getUrl('reset-password'), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ phone, code, new_password: newPassword }),
    });
    if (!res.ok) throw new Error(`Reset password failed: ${res.statusText}`);
    return res.json();
  },

  // User endpoints
  async getUser(userId?: string) {
    const res = await fetch(getUrl('get-user'), {
      headers: this.headers(userId),
    });
    if (!res.ok) throw new Error(`Get user failed: ${res.statusText}`);
    return res.json();
  },

  async updateActivity(userId: string) {
    const res = await fetch(getUrl('update-activity'), {
      method: 'POST',
      headers: this.headers(userId),
    });
    if (!res.ok) throw new Error(`Update activity failed: ${res.statusText}`);
    return res.json();
  },

  async updateUsername(userId: string, newUsername: string) {
    const res = await fetch(getUrl('get-user'), {
      method: 'PUT',
      headers: this.headers(userId),
      body: JSON.stringify({ username: newUsername }),
    });
    if (!res.ok) throw new Error(`Update username failed: ${res.statusText}`);
    return res.json();
  },

  // Messages endpoints
  async getMessages(limit = 20, offset = 0) {
    const res = await fetch(`${getUrl('get-messages')}?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error(`Get messages failed: ${res.statusText}`);
    return res.json();
  },

  async sendMessage(userId: string, content: string, voiceUrl?: string, voiceDuration?: number) {
    const res = await fetch(getUrl('send-message'), {
      method: 'POST',
      headers: this.headers(userId),
      body: JSON.stringify({ text: content, voice_url: voiceUrl, voice_duration: voiceDuration }),
    });
    if (!res.ok) throw new Error(`Send message failed: ${res.statusText}`);
    return res.json();
  },

  async addReaction(userId: string, messageId: number, emoji: string) {
    const res = await fetch(getUrl('add-reaction'), {
      method: 'POST',
      headers: this.headers(userId),
      body: JSON.stringify({ message_id: messageId, emoji }),
    });
    if (!res.ok) throw new Error(`Add reaction failed: ${res.statusText}`);
    return res.json();
  },

  // Private messages
  async getPrivateMessages(userId: string, otherUserId: string, limit = 50, offset = 0) {
    const res = await fetch(`${getUrl('private-messages')}?other_user_id=${otherUserId}&limit=${limit}&offset=${offset}`, {
      headers: this.headers(userId),
    });
    if (!res.ok) throw new Error(`Get private messages failed: ${res.statusText}`);
    return res.json();
  },

  async sendPrivateMessage(userId: string, receiverId: string, content: string) {
    const res = await fetch(getUrl('private-messages'), {
      method: 'POST',
      headers: this.headers(userId),
      body: JSON.stringify({ receiver_id: receiverId, text: content }),
    });
    if (!res.ok) throw new Error(`Send private message failed: ${res.statusText}`);
    return res.json();
  },

  async getConversations(userId: string) {
    const res = await fetch(getUrl('get-conversations'), {
      headers: this.headers(userId),
    });
    if (!res.ok) throw new Error(`Get conversations failed: ${res.statusText}`);
    return res.json();
  },

  async getUnreadCount(userId: string) {
    const res = await fetch(`${getUrl('private-messages')}?unread=true`, {
      headers: this.headers(userId),
    });
    if (!res.ok) throw new Error(`Get unread count failed: ${res.statusText}`);
    return res.json();
  },

  // Profile photos
  async getProfilePhotos(userId: string) {
    const res = await fetch(`${getUrl('profile-photos')}?user_id=${userId}`);
    if (!res.ok) throw new Error(`Get profile photos failed: ${res.statusText}`);
    return res.json();
  },

  async uploadPhoto(userId: string, photoUrl: string) {
    const res = await fetch(getUrl('profile-photos'), {
      method: 'POST',
      headers: this.headers(userId),
      body: JSON.stringify({ photo_url: photoUrl }),
    });
    if (!res.ok) throw new Error(`Upload photo failed: ${res.statusText}`);
    return res.json();
  },

  async deletePhoto(userId: string, photoId: number) {
    const res = await fetch(getUrl('profile-photos'), {
      method: 'DELETE',
      headers: this.headers(userId),
      body: JSON.stringify({ photo_id: photoId }),
    });
    if (!res.ok) throw new Error(`Delete photo failed: ${res.statusText}`);
    return res.json();
  },

  // Subscriptions
  async getSubscriptions(userId: string) {
    const res = await fetch(getUrl('get-subscriptions'), {
      headers: this.headers(userId),
    });
    if (!res.ok) throw new Error(`Get subscriptions failed: ${res.statusText}`);
    return res.json();
  },

  async subscribe(userId: string, targetUserId: string) {
    const res = await fetch(getUrl('subscribe'), {
      method: 'POST',
      headers: this.headers(userId),
      body: JSON.stringify({ target_user_id: targetUserId }),
    });
    if (!res.ok) throw new Error(`Subscribe failed: ${res.statusText}`);
    return res.json();
  },

  async unsubscribe(userId: string, targetUserId: string) {
    const res = await fetch(getUrl('subscribe'), {
      method: 'DELETE',
      headers: this.headers(userId),
      body: JSON.stringify({ target_user_id: targetUserId }),
    });
    if (!res.ok) throw new Error(`Unsubscribe failed: ${res.statusText}`);
    return res.json();
  },

  // Blacklist
  async addToBlacklist(userId: string, blockedUserId: string) {
    const res = await fetch(getUrl('blacklist'), {
      method: 'POST',
      headers: this.headers(userId),
      body: JSON.stringify({ blocked_user_id: blockedUserId }),
    });
    if (!res.ok) throw new Error(`Add to blacklist failed: ${res.statusText}`);
    return res.json();
  },

  async removeFromBlacklist(userId: string, blockedUserId: string) {
    const res = await fetch(getUrl('blacklist'), {
      method: 'DELETE',
      headers: this.headers(userId),
      body: JSON.stringify({ blocked_user_id: blockedUserId }),
    });
    if (!res.ok) throw new Error(`Remove from blacklist failed: ${res.statusText}`);
    return res.json();
  },

  // Energy
  async addEnergy(userId: string, amount: number) {
    const res = await fetch(getUrl('add-energy'), {
      method: 'POST',
      headers: this.headers(userId),
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new Error(`Add energy failed: ${res.statusText}`);
    return res.json();
  },

  // Upload URL generation
  async generateUploadUrl(userId: string, filename: string, contentType: string) {
    const res = await fetch(getUrl('generate-upload-url'), {
      method: 'POST',
      headers: this.headers(userId),
      body: JSON.stringify({ filename, content_type: contentType }),
    });
    if (!res.ok) throw new Error(`Generate upload URL failed: ${res.statusText}`);
    return res.json();
  },
};
