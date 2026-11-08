// Условная планировка для концепта: трёхэтажный дом 12 × 9 м с цоколем, придуманный с нуля.
// С реальным объектом не связана — из модели берутся только помещения и их устройства.
// В продукте контуры приходят из редактора плана; здесь — прямоугольники в метрах.
// x — вдоль фасада (0…12), z — вглубь (0 — задняя стена, 9 — фасад).

export interface Rect { space: string; x: number; z: number; w: number; d: number }
export const W = 12, D = 9;
export const stairsRect = { x: 5, z: 0, w: 2.5, d: 3.5 };

export const plan: Record<string, Rect[]> = {
  f0: [
    { space: 'garage', x: 0, z: 0, w: 5, d: 9 },
    { space: 'corridor0', x: 5, z: 3.5, w: 2.5, d: 5.5 },
    { space: 'boiler', x: 7.5, z: 0, w: 4.5, d: 4.5 },
    { space: 'tech', x: 7.5, z: 4.5, w: 4.5, d: 4.5 }
  ],
  f1: [
    { space: 'living', x: 0, z: 0, w: 5, d: 9 },
    { space: 'hall1', x: 5, z: 3.5, w: 2.5, d: 5.5 },
    { space: 'kitchen', x: 7.5, z: 0, w: 4.5, d: 5 },
    { space: 'hallway', x: 7.5, z: 5, w: 2.6, d: 4 },
    { space: 'bath1', x: 10.1, z: 5, w: 1.9, d: 4 }
  ],
  f2: [
    { space: 'bed', x: 0, z: 0, w: 5, d: 5.8 },
    { space: 'bath2b', x: 0, z: 5.8, w: 5, d: 3.2 },
    { space: 'hall2', x: 5, z: 3.5, w: 2.5, d: 5.5 },
    { space: 'kids', x: 7.5, z: 0, w: 4.5, d: 5.6 },
    { space: 'bath2k', x: 7.5, z: 5.6, w: 4.5, d: 3.4 }
  ],
  f3: [
    { space: 'cabinet', x: 0, z: 0, w: 5, d: 5.8 },
    { space: 'bath3', x: 0, z: 5.8, w: 5, d: 3.2 },
    { space: 'hall3', x: 5, z: 3.5, w: 2.5, d: 5.5 },
    { space: 'workshop', x: 7.5, z: 0, w: 4.5, d: 5.8 },
    { space: 'balcony', x: 7.5, z: 5.8, w: 4.5, d: 3.2 }
  ]
};
export const floorOrder = ['f0', 'f1', 'f2', 'f3'];
export const entrance = { x: 7.8, z: 9, w: 2, d: 3.4 }; // дорожка к входу перед прихожей
