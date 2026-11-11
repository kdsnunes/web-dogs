export interface HealthEvent {
  id: string;
  organization_id: string;
  dog_id: string;
  category: string | null;
  subcategory: string | null;
  item_id: string | null;
  quantity: number | null;
  event_date: string;
  description: string | null;
  next_due_date: string | null;
  created_at: string;
  updated_at: string;
  dogs?: { name: string } | null;
  inventory_items?: { name: string; unit: string } | null;
}
