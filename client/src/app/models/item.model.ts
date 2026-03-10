export interface Photo {
  id: number;
  url: string;
  sort_order: number;
}

export interface Item {
  id: number;
  name: string;
  description: string;
  location_id: number | null;
  location_path: string;
  tags: string[];
  photos: Photo[];
  created_at: string;
  updated_at: string;
}
