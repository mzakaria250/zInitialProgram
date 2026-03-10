export interface Location {
  id: number;
  name: string;
  parent_id: number | null;
  path: string;
  item_count: number;
  sort_order: number;
  created_at: string;
  children: Location[];
}

export interface LocationDetail extends Location {
  breadcrumb: { id: number; name: string }[];
}
