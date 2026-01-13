export type CarouselSlide = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};
