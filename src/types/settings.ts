export type UserProfileSettings = {
  fullName: string;
  email: string;
  timezone: string;
  phone?: string;
};

export type CompanySettings = {
  companyName: string;
  website?: string;
  billingEmail?: string;
  eircode?: string;
};

export type NotificationSettings = {
  emailAlerts: boolean;
  smsAlerts: boolean;
  weeklyReports: boolean;
};

export type AppSettings = {
  profile: UserProfileSettings;
  company: CompanySettings;
  notifications: NotificationSettings;
};
