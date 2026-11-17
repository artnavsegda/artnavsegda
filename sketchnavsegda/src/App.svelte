<script lang="ts">
  import ShaderHero from './lib/ShaderHero.svelte';

  const works = [
    { n: '01', title: 'Chrome Noise', tag: 'WebGL / Shader', year: '2026' },
    { n: '02', title: 'Soft Machine', tag: 'Svelte / Motion', year: '2025' },
    { n: '03', title: 'Type System', tag: 'Brand / Type', year: '2025' },
    { n: '04', title: 'Grid Abuse', tag: 'Editorial / Web', year: '2024' }
  ];

  const principles = [
    {
      n: '01',
      title: 'No gradients',
      body: 'Flat color, hard edges, honest surfaces. Depth is earned with type and grid — not with blur.'
    },
    {
      n: '02',
      title: 'No templates',
      body: 'Every layout starts from a blank frame and a loud idea. If it looks familiar, it is broken.'
    },
    {
      n: '03',
      title: 'Only structure',
      body: 'Borders, rules, numbers. The skeleton is the design. Decoration is a symptom of doubt.'
    }
  ];

  const marqueeItems = [
    'No templates',
    'No gradients',
    'Only structure',
    'Open for commissions'
  ];
</script>

<svelte:head>
  <meta
    name="description"
    content="SNAVSEGDA — brutalist web studio. Svelte 5, TypeScript, Tailwind, custom WebGL shaders."
  />
</svelte:head>

<header class="sticky top-0 z-50 border-b-4 border-ink bg-paper">
  <div class="flex h-16 items-stretch justify-between">
    <a href="#top" class="flex items-center px-6 font-display text-lg tracking-tight uppercase">
      Snavsegda<span class="text-[0.5em] align-super">®</span>
    </a>

    <nav class="hidden h-full items-stretch md:flex" aria-label="Main">
      <a
        href="#index"
        class="flex items-center border-l-4 border-ink px-6 text-[11px] tracking-[0.25em] uppercase transition-colors hover:bg-ink hover:text-paper"
      >
        Index
      </a>
      <a
        href="#manifesto"
        class="flex items-center border-l-4 border-ink px-6 text-[11px] tracking-[0.25em] uppercase transition-colors hover:bg-ink hover:text-paper"
      >
        Manifesto
      </a>
      <a
        href="#contact"
        class="flex items-center border-l-4 border-ink bg-ink px-6 text-[11px] tracking-[0.25em] text-paper uppercase transition-colors hover:bg-acid hover:text-ink"
      >
        Hire us ↗
      </a>
    </nav>
  </div>
</header>

<main>
  <section id="top" class="grid border-b-4 border-ink lg:grid-cols-12">
    <div class="flex flex-col justify-between gap-12 p-6 md:p-10 lg:col-span-7">
      <div class="flex flex-col gap-10">
        <p class="flex items-center gap-3 text-[11px] tracking-[0.3em] uppercase">
          <span class="inline-block h-3 w-3 border-2 border-ink bg-acid"></span>
          001 — WebGL Studio
        </p>

        <h1
          class="font-display text-[clamp(3.5rem,9vw,9.5rem)] leading-[0.82] tracking-[-0.02em] uppercase"
        >
          Make<br />It<br />Loud<span class="text-acid">.</span>
        </h1>

        <p class="max-w-md text-sm leading-relaxed md:text-base">
          Brutalist interfaces, fragment shaders, zero decoration. Built with Svelte 5, TypeScript
          and Three.js — live in the browser.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-5 pb-2">
        <a
          href="#contact"
          class="translate-x-0 translate-y-0 bg-ink px-8 py-4 text-[11px] tracking-[0.25em] text-paper uppercase shadow-[10px_10px_0_0_#FFE600] transition-all duration-150 hover:translate-x-[5px] hover:translate-y-[5px] hover:shadow-[5px_5px_0_0_#FFE600]"
        >
          Start a project ↗
        </a>
        <a
          href="#index"
          class="border-4 border-ink px-8 py-4 text-[11px] tracking-[0.25em] uppercase transition-colors hover:bg-ink hover:text-paper"
        >
          See index
        </a>
      </div>
    </div>

    <div class="flex border-t-4 border-ink p-4 md:p-6 lg:col-span-5 lg:border-t-0 lg:border-l-4">
      <div
        class="relative min-h-[380px] w-full border-4 border-ink bg-paper shadow-[12px_12px_0_0_#111111] lg:min-h-[560px]"
      >
        <ShaderHero />
        <span
          class="pointer-events-none absolute top-0 left-0 border-r-4 border-b-4 border-ink bg-paper px-3 py-1 text-[10px] tracking-[0.25em] uppercase"
        >
          Fragment // Shader
        </span>
        <span
          class="pointer-events-none absolute right-0 bottom-0 border-t-4 border-l-4 border-ink bg-paper px-3 py-1 text-[10px] tracking-[0.25em] uppercase"
        >
          Live · WebGL2
        </span>
      </div>
    </div>
  </section>

  <div class="overflow-hidden border-b-4 border-ink bg-ink text-paper">
    <div
      class="flex w-max animate-[marquee_22s_linear_infinite] py-3 text-[11px] tracking-[0.35em] uppercase"
    >
      {#each [0, 1] as copy (copy)}
        <div class="flex shrink-0 items-center" aria-hidden={copy === 1}>
          {#each marqueeItems as item, i (i)}
            <span class="px-6">{item}</span>
            <span class="text-acid">★</span>
          {/each}
        </div>
      {/each}
    </div>
  </div>

  <section id="index" class="scroll-mt-16 border-b-4 border-ink">
    <div class="flex flex-wrap items-end justify-between gap-4 border-b-4 border-ink p-6 md:p-10">
      <h2 class="font-display text-5xl uppercase leading-none md:text-6xl">Index</h2>
      <p class="text-[11px] tracking-[0.3em] uppercase">Selected work — 2024/2026</p>
    </div>

    {#each works as work (work.n)}
      <a
        href="#contact"
        class="group grid grid-cols-12 items-center gap-4 border-b-4 border-ink px-6 py-7 transition-colors last:border-b-0 hover:bg-ink hover:text-paper md:px-10"
      >
        <span class="col-span-2 text-[11px] tracking-[0.3em] md:col-span-1">{work.n}</span>
        <span
          class="col-span-10 font-display text-2xl uppercase leading-none md:col-span-6 md:text-4xl"
        >
          {work.title}
        </span>
        <span class="col-span-8 text-[11px] tracking-[0.2em] uppercase md:col-span-3">
          {work.tag}
        </span>
        <span
          class="col-span-4 flex items-center justify-end gap-4 text-[11px] tracking-[0.3em] md:col-span-2"
        >
          {work.year}
          <span class="text-lg leading-none transition-transform group-hover:translate-x-1">↗</span>
        </span>
      </a>
    {/each}
  </section>

  <section id="manifesto" class="scroll-mt-16 border-b-4 border-ink bg-acid">
    <div
      class="flex flex-wrap items-end justify-between gap-4 border-b-4 border-ink p-6 md:p-10"
    >
      <h2 class="font-display text-5xl uppercase leading-none md:text-6xl">Manifesto</h2>
      <p class="text-[11px] tracking-[0.3em] uppercase">Read before hiring</p>
    </div>

    <div class="grid md:grid-cols-3">
      {#each principles as p (p.n)}
        <div
          class="border-b-4 border-ink p-6 last:border-b-0 md:border-b-0 md:border-l-4 md:p-10 md:first:border-l-0"
        >
          <span class="text-[11px] tracking-[0.3em]">{p.n}</span>
          <h3 class="mt-4 font-display text-3xl uppercase leading-none">{p.title}</h3>
          <p class="mt-4 text-sm leading-relaxed">{p.body}</p>
        </div>
      {/each}
    </div>
  </section>

  <footer id="contact" class="scroll-mt-16 bg-paper p-6 md:p-10">
    <a href="mailto:hey@snavsegda.studio" class="block">
      <h2
        class="font-display text-[clamp(3rem,12vw,11rem)] leading-[0.8] tracking-[-0.03em] uppercase"
      >
        Snavsegda<span class="text-acid">®</span>
      </h2>
    </a>

    <div
      class="mt-10 flex flex-wrap items-center justify-between gap-6 border-t-4 border-ink pt-6 text-[11px] tracking-[0.25em] uppercase"
    >
      <div class="flex flex-wrap gap-2">
        <a
          href="mailto:hey@snavsegda.studio"
          class="px-2 py-1 transition-colors hover:bg-ink hover:text-paper"
          >Email</a
        >
        <a href="#top" class="px-2 py-1 transition-colors hover:bg-ink hover:text-paper"
          >Instagram</a
        >
        <a href="#top" class="px-2 py-1 transition-colors hover:bg-ink hover:text-paper">Github</a>
      </div>
      <p>© 2026 — Svelte 5 · TypeScript · Three.js</p>
    </div>
  </footer>
</main>
