export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  linkedin: string;
  portfolio: string;
}

export interface Education {
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Project {
  title: string;
  description: string;
  technologies: string;
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  templateId: string;
  personalInfo: PersonalInfo;
  summary: string;
  education: Education[];
  skills: string[];
  experience: Experience[];
  projects: Project[];
  certifications: string[];
  languages: string[];
  atsScore: number | null;
  atsSuggestions: string;
  createdAt: string;
  updatedAt: string;
  isPremium: boolean;
}

export interface CoverLetter {
  id: string;
  userId: string;
  title: string;
  jobTitle: string;
  companyName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
