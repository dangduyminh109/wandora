export type User = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
  status: 'active' | 'locked';
  phone: string;
  bio: string;
};
