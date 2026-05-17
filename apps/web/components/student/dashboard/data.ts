export const sidebarItems = [
  "Dashboard",
  "Lessons",
  "Schedule",
  "Materials",
  "Forum",
  "Assessments",
  "Settings",
] as const;

export const performanceBars = [
  { value: 85.3, label: "Algorithms structures" },
  { value: 64.7, label: "Object program." },
  { value: 84.2, label: "Database program." },
  { value: 45.6, label: "Web develop." },
  { value: 43.5, label: "Mobile application" },
  { value: 74.4, label: "Machine learning" },
] as const;

export const visitItems = [
  { value: 92, label: "Algorithms structures" },
  { value: 83, label: "Object program." },
  { value: 78, label: "Database program." },
  { value: 97, label: "Web develop." },
  { value: 96, label: "Mobile application" },
  { value: 89, label: "Machine learning" },
] as const;

export const teachers = [
  {
    name: "Mary Johnson (mentor)",
    subject: "Science",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
  },
  {
    name: "James Brown",
    subject: "Foreign language (Chinese)",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop",
  },
] as const;

export const calendarItems = [
  {
    time: "10:00",
    title: "Electronics lesson",
    detail: "9:45-10:30, 21 lesson",
    active: true,
  },
  {
    time: "11:00",
    title: "Electronics lesson",
    detail: "11:00-11:40, 23 lesson",
    active: false,
  },
  {
    time: "12:00",
    title: "Robotics lesson",
    detail: "12:00-12:45, 23 lesson",
    active: false,
  },
  {
    time: "13:00",
    title: "C++ lesson",
    detail: "13:45-14:30, 21 lesson",
    active: false,
  },
] as const;

export const upcomingEvents = [
  {
    title: 'The main event in your life "Robot Fest" will coming soon in...',
    date: "14 December 2023",
    time: "12.00 pm",
    avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=90&h=90&fit=crop",
  },
  {
    title: "Webinar of new tools in Minecraft",
    date: "21 December 2023",
    time: "11.00 pm",
    avatar: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=90&h=90&fit=crop",
  },
] as const;
