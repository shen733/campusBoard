export const CATEGORIES = ['Academic', 'Events', 'General', 'Emergency'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  role: 'student' | 'admin';
  interests: string[];
  is_discoverable: boolean;
}

export interface Notice {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: Category;
  location: string | null;
  image_url: string | null;
  event_date: string | null;
  created_at: string;
  updated_at: string;
  author?: { full_name: string } | null;
}

export interface NoticeInput {
  title: string;
  description: string;
  category: Category;
  location: string | null;
  image_url: string | null;
  event_date: string | null;
}

export interface DailyForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  conditionCode: number;
}

export interface WeatherData {
  temperature: number;
  windSpeed: number;
  conditionCode: number;
  daily: DailyForecast[];
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}