export type PlaceCategory =
  | "Rumah Sakit"
  | "Puskesmas"
  | "Kantor Polisi"
  | "Pemadam Kebakaran"
  | "Kantor Pemerintahan"
  | "Transportasi"
  | "Sekolah"
  | "Lainnya";

export type Place = {
  id: string;
  name: string;
  category: PlaceCategory | string;
  address?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  imageUrl?: string;
  description?: string;
  updatedAt?: string;
};
