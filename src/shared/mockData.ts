import type { Order, Product, Store } from '../types';
import { DEFAULT_COORDS } from './config';

export const MOCK_STORE: Store = {
  id: 'store-1',
  owner_id: '00000000-0000-0000-0000-000000000002',
  name: 'Burger Demo',
  category: 'Comidas rápidas',
  image_url: null,
  ...DEFAULT_COORDS,
  is_active: true,
};

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', store_id: 'store-1', name: 'Hamburguesa clásica', description: 'Carne 150g, queso, lechuga', price: 18000, stock: 20, image_url: null, is_available: true },
  { id: 'p2', store_id: 'store-1', name: 'Papas fritas', description: 'Porción grande', price: 8000, stock: 30, image_url: null, is_available: true },
  { id: 'p3', store_id: 'store-1', name: 'Gaseosa 400ml', description: null, price: 4500, stock: 50, image_url: null, is_available: true },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'o1', client_id: 'c1', store_id: 'store-1', driver_id: null,
    subtotal: 27500, delivery_fee: 3000, total: 30500,
    delivery_latitude: DEFAULT_COORDS.latitude + 0.01, delivery_longitude: DEFAULT_COORDS.longitude + 0.008,
    delivery_address: 'Cra 7 #45-10', store_status: 'LISTO', delivery_status: 'SIN_ASIGNAR',
    created_at: new Date().toISOString(),
  },
  {
    id: 'o2', client_id: 'c2', store_id: 'store-1', driver_id: null,
    subtotal: 18000, delivery_fee: 3000, total: 21000,
    delivery_latitude: DEFAULT_COORDS.latitude - 0.01, delivery_longitude: DEFAULT_COORDS.longitude + 0.012,
    delivery_address: 'Cll 100 #15-20', store_status: 'EN_PREPARACION', delivery_status: 'SIN_ASIGNAR',
    created_at: new Date().toISOString(),
  },
];
