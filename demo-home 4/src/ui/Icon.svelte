<script lang="ts">
  // Линейные иконки 24×24. Толщина штриха — из пропса, тренды задают свою.
  let { name, size = 22, stroke = 1.6 }: { name: string; size?: number; stroke?: number } = $props();
  const P: Record<string, string> = {
    plan: 'M3 4h18v16H3zM3 12h8v8M11 4v5M15 12h6',
    book: 'M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5V19c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5zM12 6v13.5',
    sofa: 'M5 11V8a2 2 0 012-2h10a2 2 0 012 2v3M3 13a2 2 0 014 0v2h10v-2a2 2 0 014 0v5H3zM6 18v2M18 18v2',
    eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9a3 3 0 100 6 3 3 0 000-6z',
    clock: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2',
    door: 'M6 21V4.5A1.5 1.5 0 017.5 3h9A1.5 1.5 0 0118 4.5V21M3 21h18M14.5 12.5h.01',
    search: 'M10.5 4a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM20 20l-4.8-4.8',
    room: 'M4 11l8-7 8 7v9H4zM10 20v-6h4v6',
    grid: 'M4 4h7v9H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 15h7v5H4z',
    house: 'M3 20h18M5 20V10l7-5 7 5v10M9 20v-5h6v5M15 11h2',
    media: 'M3 5h18v12H3zM8 21h8M12 17v4',
    climate: 'M10 14V5a2 2 0 114 0v9a4 4 0 11-4 0zM12 10v7',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
    sun: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    moon: 'M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z',
    bulb: 'M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0012 3z',
    shade: 'M3 4h18M6 4v16c2.5-1.5 4-6 4-16M18 4v16c-2.5-1.5-4-6-4-16',
    play: 'M8 5v14l11-7z',
    pause: 'M8 5h3v14H8zM13 5h3v14h-3z',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    back: 'M15 5l-7 7 7 7',
    next: 'M9 5l7 7-7 7',
    up: 'M5 15l7-7 7 7',
    down: 'M5 9l7 7 7-7',
    power: 'M12 3v8M6.3 6.3a8 8 0 1011.4 0',
    cam: 'M3 7h12v10H3zM15 10l6-3v10l-6-3',
    bell: 'M6 16V11a6 6 0 1112 0v5l2 2H4zM10 20a2 2 0 004 0',
    ar: 'M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M12 7l5 3v5l-5 3-5-3v-5zM7 10l5 3 5-3M12 13v5',
    vacuum: 'M12 4a8 8 0 100 16 8 8 0 000-16zM12 8a4 4 0 100 8',
    speaker: 'M7 3h10v18H7zM12 13a3 3 0 100 6 3 3 0 000-6zM12 6.5h.01',
    drop: 'M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z',
    x: 'M6 6l12 12M18 6L6 18',
    sliders: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M16 4v4M10 10v4M18 16v4',
    person: 'M12 4a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM5 20c1-4 4-6 7-6s6 2 7 6',
    leaf: 'M5 19C5 10 10 5 20 4c-1 10-6 15-15 15zM5 19l8-8',
    bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
    lock: 'M6 11h12v9H6zM8 11V8a4 4 0 118 0v3',
    vol: 'M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11',
    ok: 'M5 12l5 5L20 7',
    flame: 'M12 3c1 3 5 5 5 10a5 5 0 01-10 0c0-2 1-3.5 2-4.5.5 2 1.5 3 3 3-1-3 0-6 0-8.5z',
    snow: 'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9'
  };
  const fill = $derived(name === 'play' || name === 'pause');
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'}
  stroke-width={stroke} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={P[name] ?? ''} /></svg>
