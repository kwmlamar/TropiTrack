export type UserProfile = {
  id: string;
  name: string;
  email: string;
  company_id: string;
  role: string;
  // ... other fields
};

export type UserProfileWithCompany = UserProfile & {
  company?: {
    id: string;
    name: string;
  };
};
