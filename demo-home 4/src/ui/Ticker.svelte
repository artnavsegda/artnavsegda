<script lang="ts">
  import { home } from '../client/store.svelte';
  import { house } from '../core/house';
  import { fmtT, lightsOn, pluralPeople } from '../client/derive.svelte';
  import { S } from '../media/state.svelte';

  // Бегущая строка тренда «Брутализм»: состояние дома одной лентой, как новостная строка.
  const sec = { disarmed: 'охрана снята', perimeter: 'периметр под охраной', full: 'дом под охраной' } as Record<string, string>;
  const items = $derived.by(() => {
    const s = home.s; if (!s) return [];
    const ppl = Object.values(s.presence).reduce((a, n) => a + (n ? 1 : 0), 0);
    const playing = Object.values(S.src).filter(x => x.playing && x.content).map(x => `играет «${x.content!.title}»`);
    const t = new Date();
    return [house.name, `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`, ppl ? `дома ${pluralPeople(ppl)}` : 'дома никого',
      `свет: ${lightsOn()}`, `${fmtT(s.outside)}° снаружи`, sec[s.security.mode] ?? '', ...playing].filter(Boolean);
  });
</script>

<div class="tk" aria-label="Состояние дома" role="marquee">
  <div class="run">{#each [0, 1] as k}<span aria-hidden={k === 1}>{#each items as it}<b>{it}</b><i>✱</i>{/each}</span>{/each}</div>
</div>

<style>
  .tk { position: sticky; top: 0; z-index: 15; overflow: hidden; height: 30px; display: flex; align-items: center; background: var(--accent); color: var(--on-accent); border-bottom: 2px solid var(--ink, #000);
    font: 600 12px/1 var(--font-ui); text-transform: uppercase; letter-spacing: .08em; padding-top: env(safe-area-inset-top, 0px); box-sizing: content-box; }
  .run { display: flex; width: max-content; animation: run 38s linear infinite; }
  .run span { display: flex; flex: none; }
  b { font-weight: 600; padding: 0 14px; white-space: nowrap; } i { font-style: normal; }
  @keyframes run { to { transform: translateX(-50%); } }
  @media (prefers-reduced-motion: reduce) { .run { animation: none; } }
</style>
