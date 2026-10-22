// Espejo del schema de Supabase (enums y tablas)
export type Role = 'CLIENTE' | 'COMERCIO' | 'DOMICILIARIO';
export type StoreOrderStatus = 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO';
export type DeliveryOrderStatus = 'SIN_ASIGNAR' | 'ACEPTADO' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO';
export type DriverStatus = 'DISPONIBLE' | 'OCUPADO' | 'INACTIVO';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  phone?: string | null;
  role: Role;
  avatar_url?: string | null;
  created_at?: string;
}

export interface Store {
  id: string;
  owner_id: string;
  name: string;
  category: string | null;
  image_url: string | null;
  latitude: number;
  longitude: number;
  is_active: boolean;
  created_at?: string;
}

export interface Product {
  id: string;
  store_id: string; // -> stores.id
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  is_available: boolean;
  created_at?: string;
}

export interface Driver {
  id: string;
  vehicle_type: string | null;
  status: DriverStatus;
  current_latitude: number | null;
  current_longitude: number | null;
}

export interface Order {
  id: string;
  client_id: string;
  store_id: string;
  driver_id: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_latitude: number;
  delivery_longitude: number;
  delivery_address: string;
  store_status: StoreOrderStatus;
  delivery_status: DeliveryOrderStatus;
  created_at: string;
  updated_at?: string;
}

/** Order con el join `stores(name, latitude, longitude)` */
export interface OrderWithStore extends Order {
  stores?: Pick<Store, 'name' | 'latitude' | 'longitude'> | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
