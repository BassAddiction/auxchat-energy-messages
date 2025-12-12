export interface Message {
  id: number;
  userId: number;
  username: string;
  avatar: string;
  text: string;
  timestamp: Date;
  reactions: { emoji: string; count: number }[];
}

export interface User {
  username: string;
  avatar: string;
  phone: string;
  energy: number;
  status?: string;
}
