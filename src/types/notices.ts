import { Category } from './index';

export type NoticeFormValues = {
  title: string;
  description: string;
  category: Category;
  location: string;
  eventDate: Date | null;
  imageUri: string | null;
  remind: boolean;
};