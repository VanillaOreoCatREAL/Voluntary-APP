export interface Organization {
  id: string;
  name: string;
  logo: string;
  verified: boolean;
}

export interface VolunteerOpportunity {
  id: string;
  title: string;
  organization: Organization;
  location: string;
  type: "online" | "in-person" | "remote" | "hybrid";
  duration: string;
  category: string;
  description: string;
  requirements: string[];
  postedDate: string;
  image?: string;
  applicants: number;
  dates?: string;
  startTime?: string;
  website?: string;
  organizerName?: string;
  companyName?: string;
}

export const organizations: Organization[] = [];

export const opportunities: VolunteerOpportunity[] = [];

export const categories = [
  "All",
  "Healthcare",
  "Education",
  "Technology",
  "Environment",
  "Community Service",
  "Animal Welfare",
  "Arts & Culture",
  "Youth Programs",
  "Senior Care",
  "Disaster Relief",
  "Sports & Fitness",
];
