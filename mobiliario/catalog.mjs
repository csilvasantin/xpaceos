import { definePiece } from '../eras/epoch.mjs';

// Categoría Mobiliario para Xpacios. La planta es el objeto testigo: siempre está.
export const FURNITURE = [
  definePiece({ id: 'planta', saga: 'Planta', silhouette: 'plant', color: '#3ddc6a', witness: true, x: 90, y: 250, fn: 'testigo' }),
  definePiece({ id: 'silla', saga: 'Silla', silhouette: 'chair', color: '#ff5a36', x: 280, y: 250, fn: 'sentarse' }),
  definePiece({ id: 'mesa', saga: 'Mesa', silhouette: 'table', color: '#3aa0ff', x: 470, y: 250, fn: 'apoyar' }),
  definePiece({ id: 'lampara', saga: 'Lámpara', silhouette: 'lamp', color: '#ffd23a', x: 660, y: 250, fn: 'alumbrar' }),
];
