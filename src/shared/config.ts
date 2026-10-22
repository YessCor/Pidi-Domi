// Coordenadas FICTICIAS por defecto (mismas que el schema)
export const DEFAULT_COORDS = { latitude: 10.96854, longitude: -74.78132 };
export const DELIVERY_FEE = 3000;

/** Punto de entrega ficticio cerca del centro por defecto (para que el mapa muestre una ruta real). */
export const fakeDeliveryCoords = () => ({
  latitude: DEFAULT_COORDS.latitude + (Math.random() - 0.5) * 0.03,
  longitude: DEFAULT_COORDS.longitude + (Math.random() - 0.5) * 0.03,
});
