export interface StudentProfile {
  id: string;
  name: string;
  avatar: string;
  university: string;
  major: string;
  year: string;
  bio: string;
  location: string;
  skills: string[];
  interests: string[];
  hoursVolunteered: number;
  opportunitiesCompleted: number;
}

export const currentStudent: StudentProfile = {
  id: "current",
  name: "",
  avatar: "",
  university: "",
  major: "",
  year: "",
  bio: "",
  location: "",
  skills: [],
  interests: [],
  hoursVolunteered: 0,
  opportunitiesCompleted: 0,
};
