export type Place = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  region: string;
  address: string;
  location: { type: 'Point'; coordinates: [number, number] };
  images: string[];
  tags: string[];
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
};
