export type UserProfile = {
  id: string;
  name: string;
  email: string;
  company_id: string;
  role: string;
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  // ... other fields
};

export type UserProfileWithCompany = UserProfile & {
  company?: {
    id: string;
    name: string;
  };
};
