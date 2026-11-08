import type { MediaConfig } from './types.ts';

// Медиа реального дома. Топология восстановлена из сервера сценариев (vyborgskoe-node/src/media.js)
// и программы CP3: коды входов матрицы, входы усилителя, выходы HDMI ресивера.

export const sosnyMedia: MediaConfig = {
  nodes: [
    // источники в техпомещении
    { id: 'atv1', name: 'Apple TV 1', role: 'source', kind: 'appletv', video: true, audio: true, outs: ['hdmi'], timing: { boot: 3 }, outlet: 'pdu1:3', via: 'ИК + IP' },
    { id: 'atv2', name: 'Apple TV 2', role: 'source', kind: 'appletv', video: true, audio: true, outs: ['hdmi'], timing: { boot: 3 }, outlet: 'pdu1:4', via: 'ИК + IP' },
    { id: 'kodi1', name: 'Kodi 1', role: 'source', kind: 'kodi', video: true, audio: true, outs: ['hdmi'], timing: { boot: 6 }, outlet: 'pdu1:1', via: 'JSON-RPC' },
    { id: 'kodi2', name: 'Kodi 2', role: 'source', kind: 'kodi', video: true, audio: true, outs: ['hdmi'], timing: { boot: 6 }, outlet: 'pdu1:2', via: 'JSON-RPC' },
    { id: 'sat1', name: 'Спутник 1', role: 'source', kind: 'sat', video: true, audio: true, outs: ['hdmi'], timing: { boot: 5 }, outlet: 'pdu1:5', via: 'ИК' },
    { id: 'sat2', name: 'Спутник 2', role: 'source', kind: 'sat', video: true, audio: true, outs: ['hdmi'], timing: { boot: 5 }, outlet: 'pdu1:6', via: 'ИК' },
    { id: 'sat3', name: 'Спутник 3', role: 'source', kind: 'sat', video: true, audio: true, outs: ['hdmi'], timing: { boot: 5 }, outlet: 'pdu1:7', via: 'ИК' },
    { id: 'mc1', name: 'Стример 1', role: 'source', kind: 'streamer', audio: true, outs: ['line'], timing: { boot: 2 }, via: 'MusicCast' },
    { id: 'mc2', name: 'Стример 2', role: 'source', kind: 'streamer', audio: true, outs: ['line'], timing: { boot: 2 }, via: 'MusicCast' },

    // коммутация
    { id: 'mx', name: 'Матрица WyreStorm 8×8', role: 'matrix', ins: ['in1', 'in2', 'in3', 'in4', 'in5', 'in6', 'in7'], outs: ['o1', 'o2', 'o4', 'o5'], audioOuts: ['a1', 'a2'], timing: { input: 1 }, via: 'IP' },
    { id: 'avr', name: 'Ресивер Yamaha RX-A3010', role: 'avr', ins: ['av2', 'audio1', 'av4'], outs: ['hdmi1', 'hdmi2', 'spk'], timing: { boot: 4, input: 2 }, via: 'IP' },
    { id: 'amp', name: 'Усилитель C2N-AMP 6×100', role: 'amp', ins: ['in1', 'in2', 'in3', 'in4', 'in11', 'in12'], outs: ['z1', 'z2', 'z3', 'z4', 'z5', 'z7'], timing: { boot: 1, input: 1 }, via: 'Crestron' },

    // экраны
    { id: 'pj', name: 'Проектор JVC', role: 'projector', ins: ['hdmi'], timing: { boot: 45, cool: 90 }, via: 'RS-232' },
    { id: 'scr', name: 'Экран и лифт', role: 'screen', timing: { travel: 30 }, via: 'реле' },
    { id: 'tv-living', name: 'Телевизор гостиной', role: 'display', kind: 'smarttv', video: true, audio: true, ins: ['hdmi1', 'tv'], audioOuts: ['opt'], timing: { boot: 6, input: 2 }, via: 'ИК' },
    { id: 'tv-kitchen', name: 'Телевизор кухни', role: 'display', kind: 'smarttv', video: true, audio: true, ins: ['hdmi1', 'tv'], audioOuts: ['opt'], timing: { boot: 6, input: 2 }, via: 'ИК' },
    { id: 'tv-bed', name: 'Телевизор спальни', role: 'display', kind: 'smarttv', video: true, audio: true, ins: ['hdmi1', 'tv'], audioOuts: ['opt'], timing: { boot: 6, input: 2 }, via: 'ИК' },
    { id: 'tv-kids', name: 'Телевизор детской', role: 'display', kind: 'smarttv', video: true, audio: true, ins: ['hdmi1', 'tv'], outs: ['spk'], timing: { boot: 6, input: 2 }, via: 'ИК' }
  ],
  links: [
    { from: ['sat1', 'hdmi'], to: ['mx', 'in1'] }, { from: ['sat2', 'hdmi'], to: ['mx', 'in2'] }, { from: ['sat3', 'hdmi'], to: ['mx', 'in3'] },
    { from: ['kodi1', 'hdmi'], to: ['mx', 'in4'] }, { from: ['kodi2', 'hdmi'], to: ['mx', 'in5'] },
    { from: ['atv1', 'hdmi'], to: ['mx', 'in6'] }, { from: ['atv2', 'hdmi'], to: ['mx', 'in7'] },
    { from: ['mx', 'o1'], to: ['avr', 'av2'] },
    { from: ['mx', 'o2'], to: ['tv-kitchen', 'hdmi1'] },
    { from: ['mx', 'o4'], to: ['tv-bed', 'hdmi1'] },
    { from: ['mx', 'o5'], to: ['tv-kids', 'hdmi1'] },
    { from: ['mx', 'a1'], to: ['amp', 'in11'] },
    { from: ['mx', 'a2'], to: ['amp', 'in12'] },
    { from: ['avr', 'hdmi1'], to: ['pj', 'hdmi'] },
    { from: ['avr', 'hdmi2'], to: ['tv-living', 'hdmi1'] },
    { from: ['tv-living', 'opt'], to: ['avr', 'audio1'] },
    { from: ['tv-kitchen', 'opt'], to: ['amp', 'in3'] },
    { from: ['tv-bed', 'opt'], to: ['amp', 'in4'] },
    { from: ['mc1', 'line'], to: ['amp', 'in1'] },
    { from: ['mc2', 'line'], to: ['amp', 'in2'] },
    { from: ['amp', 'z7'], to: ['avr', 'av4'] }
  ],
  zones: [
    { id: 'cinema', span: 1.4, name: 'Кинотеатр', space: 'living', floor: 'f1', display: 'pj', screen: 'scr', audio: ['avr', 'spk'], sharesWith: ['living'], order: 1 },
    { id: 'living', span: 1.4, name: 'Гостиная', space: 'living', floor: 'f1', display: 'tv-living', audio: ['avr', 'spk'], sharesWith: ['cinema'], order: 2 },
    { id: 'kitchen', span: 1.6, name: 'Кухня', space: 'kitchen', floor: 'f1', display: 'tv-kitchen', audio: ['amp', 'z1'], order: 3 },
    { id: 'bath1', span: 1, name: 'Ванная', space: 'bath1', floor: 'f1', audio: ['amp', 'z2'], order: 4 },
    { id: 'bed', span: 1.8, name: 'Спальня 1', space: 'bed', floor: 'f2', display: 'tv-bed', audio: ['amp', 'z3'], order: 1 },
    { id: 'kids', span: 1.6, name: 'Детская', space: 'kids', floor: 'f2', display: 'tv-kids', audio: ['tv-kids', 'spk'], order: 2 },
    { id: 'bath2b', span: 1, name: 'Спальня 2', space: 'bath2b', floor: 'f2', audio: ['amp', 'z4'], order: 3 },
    { id: 'bath3', span: 1, name: 'Гостевая', space: 'bath3', floor: 'f3', audio: ['amp', 'z5'], order: 1 }
  ],
  section: { floors: [
    { id: 'f3', name: '3', others: [{ name: 'Постирочная', span: 1 }, { name: 'Техпомещение', span: 1 }] },
    { id: 'f2', name: '2', others: [{ name: 'Кабинет', span: 1.2 }] },
    { id: 'f1', name: '1', others: [{ name: 'Прихожая', span: 0.9 }] }
  ] }
};

export const floorNames: Record<string, string> = { f1: '1 этаж', f2: '2 этаж', f3: '3 этаж' };
