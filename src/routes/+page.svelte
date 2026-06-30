<script lang="ts">
  import type { PageData } from './$types';
  import { onMount } from 'svelte';

  export let data: PageData | undefined = undefined;
  export let params = {};

  const c = (key: string, fallback = '') => (data?.content?.[key] as string) ?? fallback;

  // Profile photo — set via admin panel upload
  $: profilePhoto    = c('profile_photo_url');
  $: heroQuote       = c('hero_quote',          '"I build the systems that automate operations, minimise risk, and scale retail businesses."');
  $: heroBio1        = c('hero_bio_1',          'From a customer relations executive in India to managing multi-million dollar retail enterprises as a CEO in Saudi Arabia, my career is defined by driving real-world growth.');
  $: heroBio2        = c('hero_bio_2',          "By teaching myself full-stack application development, progressive web apps, and API frameworks, I don't just manage businesses — I build the exact infrastructure, automations, and modern tools required to eliminate human error and secure enterprise margins.");
  $: footerCopyright = c('footer_copyright',    '© 2026 Yousafali M.K. All Rights Reserved.');
  $: whatsappNumber  = c('whatsapp_number');
  $: heroTagline     = c('hero_tagline',         'Retail Enterprise Operations × Autonomous Systems');
  $: heroCvBtn       = c('hero_button_cv',       'Read My Full Background / CV');
  $: navButton       = c('nav_button',           'Request a Meeting / Partnership');
  $: photoName       = c('photo_name',           'Yousafali M.K.');
  $: photoSubtitle   = c('photo_subtitle',       'CEO · Urban Market, Jizan · Est. 2023');
  $: hudBadge1       = c('hud_badge_1',          'OPS: ACTIVE');
  $: hudBadge2       = c('hud_badge_2',          'SYSTEMS: ONLINE');
  $: hudLabel        = c('hud_label',            'RETAIL TREND INDEX — LIVE');
  $: secTimelineLabel   = c('section_timeline_label',   'Career Journey');
  $: secTimelineHeading = c('section_timeline_heading', 'Executive Leadership Timeline');
  $: secCapsLabel       = c('section_caps_label',       'Expertise');
  $: secCapsHeading     = c('section_caps_heading',     'Personal Capabilities Matrix');
  $: secCapsCat1        = c('section_caps_cat1',        'Enterprise Management & Strategy');
  $: secCapsCat2        = c('section_caps_cat2',        'Self-Taught Systems Execution');
  $: secLangLabel       = c('section_lang_label',       'Communication');
  $: secLangHeading     = c('section_lang_heading',     'Language Proficiency');
  $: secContactLabel    = c('section_contact_label',    'Direct Contact');
  $: secContactHeading  = c('section_contact_heading',  'Reach Out Privately');
  $: secContactDesc     = c('section_contact_desc',     'If you are an executive, investor, or recruiter looking to discuss potential partnerships, operational advisory roles, or leadership opportunities, please leave your brief details below.');
  $: pageTitle          = c('page_title',               'Yousafali M.K. — Executive Profile');
  $: pageDescription    = c('page_description',         'Personal executive profile of Yousafali M.K. — Retail enterprise operations leader, CEO, and self-taught systems builder.');

  type CapEntry = { category: string; skill_text: string; };
  $: capabilitiesList = (data?.capabilities ?? []) as CapEntry[];
  $: capsCat1 = capabilitiesList.filter(s => s.category === secCapsCat1).map(s => s.skill_text);
  $: capsCat2 = capabilitiesList.filter(s => s.category === secCapsCat2).map(s => s.skill_text);

  type Language = { name: string; native_name: string; can_read: boolean; can_write: boolean; can_speak: boolean; can_understand: boolean; label_read: string; label_write: string; label_speak: string; label_understand: string; };
  $: languages = (data?.languages ?? []) as Language[];

  let formName = '';
  let formCountry = '';
  let formWhatsapp = '';
  let formEmail = '';
  let formMessage = '';
  let formStatus: 'idle' | 'sending' | 'sent' | 'error' = 'idle';

  // Searchable country dropdown state
  let countrySearch = '';
  let countryOpen = false;
  let countryInputEl: HTMLInputElement;

  const countries = [
    { group: '— Featured —', options: [
      'India'
    ]},
    { group: '— Gulf Countries —', options: [
      'Saudi Arabia','United Arab Emirates','Kuwait','Qatar','Bahrain','Oman'
    ]},
    { group: '— South Asia —', options: [
      'Bangladesh','Sri Lanka','Nepal'
    ]},
    { group: '— East Asia —', options: [
      'China','Japan','South Korea','Taiwan','Hong Kong'
    ]},
    { group: '— South-East Asia —', options: [
      'Malaysia','Singapore','Indonesia','Philippines','Thailand','Vietnam'
    ]},
    { group: '— Europe —', options: [
      'United Kingdom','Germany','France','Italy','Spain','Netherlands',
      'Sweden','Norway','Denmark','Finland','Switzerland','Belgium',
      'Austria','Poland','Portugal','Ireland'
    ]},
    { group: '— Americas —', options: [
      'United States','Canada','Mexico','Brazil','Argentina'
    ]},
    { group: '— Middle East & Africa —', options: [
      'Egypt','Jordan','Lebanon','Turkey','Iran','Iraq','Israel',
      'Nigeria','South Africa','Kenya','Ethiopia','Ghana'
    ]},
    { group: '— Oceania —', options: [
      'Australia','New Zealand'
    ]},
    { group: '— Other —', options: [
      'Other'
    ]}
  ];

  const allCountryOptions = countries.flatMap(g => g.options);

  $: filteredGroups = countrySearch.trim() === ''
    ? countries
    : countries.map(g => ({
        ...g,
        options: g.options.filter(o => o.toLowerCase().includes(countrySearch.toLowerCase()))
      })).filter(g => g.options.length > 0);

  function selectCountry(name: string) {
    formCountry = name;
    countrySearch = '';
    countryOpen = false;
  }

  function onCountryKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { countryOpen = false; countrySearch = ''; }
  }

  // Mobile nav
  let menuOpen = false;
  const navLinks = [
    { href: '#profile',      label: 'Executive Profile' },
    { href: '#timeline',     label: 'Career Timeline' },
    { href: '#capabilities', label: 'Personal Capabilities' },
    { href: '#languages',    label: 'Languages' },
    { href: '#contact',      label: 'Get In Touch' }
  ];

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    formStatus = 'sending';
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          country: formCountry,
          email: formEmail,
          whatsapp: formWhatsapp || null,
          message: formMessage
        })
      });
      if (!res.ok) throw new Error('Failed to send');
      formStatus = 'sent';
    } catch {
      formStatus = 'error';
      setTimeout(() => (formStatus = 'idle'), 4000);
    }
  }

  // Career timeline from database (managed via admin panel)
  type TimelineEntry = { id: string; period: string; title: string; org: string; location: string; description: string; };
  $: timeline = (data?.timeline ?? []) as TimelineEntry[];
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
</svelte:head>

<!-- ─── Navigation ───────────────────────────────────────────── -->
<header class="sticky top-0 z-50 border-b border-white/[0.06] bg-[#080810]/90 backdrop-blur-xl">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

    <!-- Desktop nav -->
    <nav class="hidden md:flex items-center gap-8 text-xs text-[#8892a4] tracking-wide">
      {#each navLinks as link}
        <a href={link.href} class="hover:text-white transition-colors">{link.label}</a>
      {/each}
    </nav>

    <!-- Desktop CTA button -->
    <a
      href="#contact"
      class="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2a2a40] bg-[#0f0f1e] text-xs text-white hover:border-[#4a4a70] hover:bg-[#14142a] transition-all duration-200 tracking-wide"
    >
      {navButton}
    </a>

    <!-- Mobile: CTA + hamburger -->
    <div class="flex md:hidden items-center gap-3 w-full justify-between">
      <a
        href="#contact"
        on:click={() => menuOpen = false}
        class="inline-flex items-center px-3 py-2 rounded-lg border border-[#2a2a40] bg-[#0f0f1e] text-xs text-white hover:border-[#4a4a70] transition-colors"
      >
        {navButton}
      </a>
      <button
        on:click={() => menuOpen = !menuOpen}
        aria-label="Toggle navigation"
        class="p-2 rounded-lg text-[#8892a4] hover:text-white hover:bg-white/5 transition-colors"
      >
        {#if menuOpen}
          <!-- X icon -->
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        {:else}
          <!-- Hamburger icon -->
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        {/if}
      </button>
    </div>
  </div>

  <!-- Mobile dropdown menu -->
  {#if menuOpen}
    <div class="md:hidden border-t border-white/[0.06] bg-[#080810]/95 backdrop-blur-xl">
      <nav class="px-6 py-3 flex flex-col gap-1">
        {#each navLinks as link}
          <a
            href={link.href}
            on:click={() => menuOpen = false}
            class="py-3 text-sm text-[#8892a4] hover:text-white border-b border-white/[0.04] last:border-0 transition-colors"
          >
            {link.label}
          </a>
        {/each}
      </nav>
    </div>
  {/if}
</header>

<!-- ─── Hero / Profile Section ───────────────────────────────── -->
<section id="profile" class="relative min-h-[92vh] flex items-center overflow-hidden bg-[#07070e]">
  <!-- Subtle background gradient -->
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(30,30,80,0.5),transparent)]"></div>
  <!-- Fine grid -->
  <div class="absolute inset-0 opacity-20" style="background-image: linear-gradient(rgba(100,116,139,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.07) 1px, transparent 1px); background-size: 60px 60px;"></div>

  <div class="relative max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center w-full">

    <!-- LEFT: Profile Statement -->
    <div class="order-2 lg:order-1">
      <p class="text-xs font-mono tracking-[0.3em] text-[#4a9eff] uppercase mb-6">
        {heroTagline}
      </p>

      <h1 class="text-3xl md:text-4xl xl:text-5xl font-bold text-white leading-[1.15] mb-7 tracking-tight">
        {heroQuote}
      </h1>

      <div class="space-y-4 text-[#94a3b8] text-base leading-relaxed mb-10 max-w-xl">
        <p>{heroBio1}</p>
        <p>{heroBio2}</p>
      </div>

      <div class="flex flex-wrap gap-3">
        <a
          href="#timeline"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-[#07070e] text-sm font-semibold hover:bg-[#e2e8f0] transition-all duration-200"
        >
          {heroCvBtn}
        </a>
      </div>
    </div>

    <!-- RIGHT: Photo + HUD Frame -->
    <div class="order-1 lg:order-2 flex justify-center lg:justify-end">
      <div class="relative w-[340px] md:w-[400px]">

        <!-- Glow ring behind the frame -->
        <div class="absolute -inset-4 rounded-2xl bg-[radial-gradient(ellipse_at_center,rgba(74,158,255,0.12),transparent_70%)]"></div>

        <!-- Photo frame -->
        <div class="relative rounded-2xl overflow-hidden border border-[#2a2a40] bg-[#0d0d1a] shadow-2xl aspect-[3/4]">

          <!-- Placeholder state — replaced with real photo once uploaded via admin -->
          <div class="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0d0d1a] via-[#101020] to-[#0a0a14]">
            {#if profilePhoto}
              <img
                src={profilePhoto}
                alt="Yousafali M.K."
                class="w-full h-full object-cover object-top"
              />
            {:else}
              <div class="w-24 h-24 rounded-full border-2 border-dashed border-[#2a2a40] flex items-center justify-center mb-4">
                <svg class="w-10 h-10 text-[#2a2a40]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p class="text-[#3a3a5a] text-xs font-mono text-center px-6 leading-relaxed">
                Upload your photograph<br/>via the Admin Panel
              </p>
            {/if}
          </div>

          <!-- HUD overlay at bottom of photo -->
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#07070e] via-[#07070e]/80 to-transparent p-4">
            <!-- Live metrics strip -->
            <div class="flex gap-2 mb-3 overflow-hidden">
              {#each [hudBadge1, hudBadge2] as label}
                <span class="text-[9px] font-mono text-[#4a9eff] bg-[#4a9eff]/10 border border-[#4a9eff]/20 px-2 py-0.5 rounded whitespace-nowrap">{label}</span>
              {/each}
            </div>
            <!-- Sparkline bars -->
            <div class="flex items-end gap-0.5 h-8">
              {#each [40, 55, 35, 70, 50, 85, 60, 90, 75, 95, 65, 88] as h}
                <div class="flex-1 rounded-sm bg-[#4a9eff]/30" style="height: {h}%"></div>
              {/each}
            </div>
            <p class="text-[#4a9eff] font-mono text-[9px] mt-1.5 opacity-60 tracking-widest">{hudLabel}</p>
          </div>

          <!-- Corner scan lines -->
          <div class="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#4a9eff]/40 rounded-tl"></div>
          <div class="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#4a9eff]/40 rounded-tr"></div>
        </div>

        <!-- Name tag below photo -->
        <div class="mt-4 text-center">
          <p class="text-white font-semibold tracking-wide">{photoName}</p>
          <p class="text-[#8892a4] text-xs mt-0.5">{photoSubtitle}</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ─── Career Timeline ───────────────────────────────────────── -->
<section id="timeline" class="py-24 px-6 bg-[#080810]">
  <div class="max-w-4xl mx-auto">
    <div class="mb-16 text-center">
      <p class="text-[#4a9eff] font-mono text-xs tracking-[0.3em] uppercase mb-3">{secTimelineLabel}</p>
      <h2 class="text-3xl md:text-4xl font-bold text-white">{secTimelineHeading}</h2>
    </div>

    <div class="relative">
      <!-- Vertical line -->
      <div class="absolute left-[7px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#4a9eff]/40 via-[#4a9eff]/20 to-transparent md:-translate-x-px"></div>

      <div class="space-y-10">
        {#each timeline as job, i}
          <div class="relative flex flex-col md:flex-row gap-6 md:gap-0 {i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}">

            <!-- Timeline dot -->
            <div class="absolute left-0 md:left-1/2 top-1 md:top-4 w-3.5 h-3.5 rounded-full border-2 border-[#4a9eff] bg-[#07070e] md:-translate-x-1/2 z-10 {i === 0 ? 'shadow-[0_0_12px_rgba(74,158,255,0.6)]' : ''}"></div>

            <!-- Content card -->
          <div class="ml-8 md:ml-0 md:w-[calc(50%-2rem)] {i % 2 === 0 ? 'md:pr-8 md:text-right' : 'md:pl-8 md:text-left md:ml-auto'}">
              <div class="bg-[#0d0d1a] border border-[#1e1e30] rounded-xl p-5 hover:border-[#2a2a50] transition-colors duration-300">
                <p class="text-[#4a9eff] font-mono text-xs tracking-wider mb-1">{job.period}</p>
                <h3 class="text-white font-semibold text-base mb-0.5">{job.title}</h3>
                <p class="text-[#64748b] text-xs mb-3">
                  {job.org} &nbsp;·&nbsp; {job.location}
                </p>
                <p class="text-[#94a3b8] text-sm leading-relaxed">{job.description}</p>
              </div>
            </div>

          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

<!-- ─── Capabilities Matrix ───────────────────────────────────── -->
<section id="capabilities" class="py-24 px-6 bg-[#07070e] border-y border-[#1a1a2e]">
  <div class="max-w-5xl mx-auto">
    <div class="mb-16 text-center">
      <p class="text-[#4a9eff] font-mono text-xs tracking-[0.3em] uppercase mb-3">{secCapsLabel}</p>
      <h2 class="text-3xl md:text-4xl font-bold text-white">{secCapsHeading}</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

      <!-- Enterprise Management -->
      <div class="bg-[#0d0d1a] border border-[#1e1e30] rounded-2xl p-8 hover:border-[#2a2a50] transition-colors duration-300">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-9 h-9 rounded-lg bg-[#4a9eff]/10 border border-[#4a9eff]/20 flex items-center justify-center">
            <svg class="w-4 h-4 text-[#4a9eff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 class="text-white font-semibold text-lg">{secCapsCat1}</h3>
        </div>
        <ul class="space-y-3">
          {#each capsCat1 as skill}
            <li class="flex items-center gap-3 text-[#94a3b8] text-sm">
              <span class="w-1.5 h-1.5 rounded-full bg-[#4a9eff] flex-shrink-0"></span>
              {skill}
            </li>
          {/each}
        </ul>
      </div>

      <!-- Technical Self-Taught -->
      <div class="bg-[#0d0d1a] border border-[#1e1e30] rounded-2xl p-8 hover:border-[#2a2a50] transition-colors duration-300">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-9 h-9 rounded-lg bg-[#22d3ee]/10 border border-[#22d3ee]/20 flex items-center justify-center">
            <svg class="w-4 h-4 text-[#22d3ee]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h3 class="text-white font-semibold text-lg">{secCapsCat2}</h3>
        </div>
        <ul class="space-y-3">
          {#each capsCat2 as skill}
            <li class="flex items-center gap-3 text-[#94a3b8] text-sm">
              <span class="w-1.5 h-1.5 rounded-full bg-[#22d3ee] flex-shrink-0"></span>
              {skill}
            </li>
          {/each}
        </ul>
      </div>

    </div>
  </div>
</section>

<!-- ─── Languages Section ─────────────────────────────────────── -->
<section id="languages" class="py-24 px-6 bg-[#080810] border-t border-[#1a1a2e]">
  <div class="max-w-5xl mx-auto">
    <div class="mb-14 text-center">
      <p class="text-[#4a9eff] font-mono text-xs tracking-[0.3em] uppercase mb-3">{secLangLabel}</p>
      <h2 class="text-3xl md:text-4xl font-bold text-white">{secLangHeading}</h2>
    </div>

    <!-- Skill legend -->
    <div class="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-10">
      {#each [['Read','#4a9eff'],['Write','#22d3ee'],['Speak','#a78bfa'],['Understand','#34d399']] as [label, color]}
        <span class="flex items-center gap-1.5 text-xs text-[#8892a4]">
          <span class="w-2.5 h-2.5 rounded-full" style="background:{color}"></span>
          {label}
        </span>
      {/each}
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each languages as lang}
        <div class="bg-[#0d0d1a] border border-[#1e1e30] rounded-2xl p-5 hover:border-[#2a2a50] transition-colors duration-300">
          <!-- Language name -->
          <div class="mb-4">
            <p class="text-white font-semibold text-lg leading-tight">{lang.name}</p>
            {#if lang.native_name && lang.native_name !== lang.name}
              <p class="text-[#4a9eff] text-sm mt-0.5" style="font-family: serif;">{lang.native_name}</p>
            {/if}
          </div>

          <!-- Skills grid -->
          <div class="grid grid-cols-2 gap-y-2.5 gap-x-4">
            {#each [
              { label: lang.label_read,       key: lang.can_read,       color: '#4a9eff' },
              { label: lang.label_write,      key: lang.can_write,      color: '#22d3ee' },
              { label: lang.label_speak,      key: lang.can_speak,      color: '#a78bfa' },
              { label: lang.label_understand, key: lang.can_understand,  color: '#34d399' }
            ] as skill}
              <div class="flex items-center gap-2" dir="auto">
                {#if skill.key}
                  <svg class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="{skill.color}">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                {:else}
                  <svg class="w-3.5 h-3.5 flex-shrink-0 text-[#2a2a40]" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                {/if}
                <span class="text-xs" style="color: {skill.key ? skill.color : '#3a3a5a'}">{skill.label}</span>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- ─── Contact Section ───────────────────────────────────────── -->
<section id="contact" class="py-24 px-6 bg-[#080810]">
  <div class="max-w-2xl mx-auto">
    <div class="mb-12 text-center">
      <p class="text-[#4a9eff] font-mono text-xs tracking-[0.3em] uppercase mb-3">{secContactLabel}</p>
      <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">{secContactHeading}</h2>
      <p class="text-[#8892a4] text-sm leading-relaxed">{secContactDesc}</p>
    </div>

    {#if formStatus === 'sent'}
      <div class="rounded-2xl border border-green-500/20 bg-green-500/5 p-10 text-center">
        <div class="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p class="text-white font-semibold mb-1">Message Received</p>
        <p class="text-[#8892a4] text-sm">Thank you. I will respond to your enquiry privately.</p>
      </div>
    {:else}
      <form on:submit={handleSubmit} class="space-y-4">
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-[#8892a4] mb-1.5 tracking-wide" for="fname">Full Name</label>
            <input
              id="fname"
              type="text"
              bind:value={formName}
              required
              placeholder="Your full name"
              class="w-full bg-[#0d0d1a] border border-[#1e1e30] rounded-lg px-4 py-3 text-sm text-white placeholder-[#3a3a5a] focus:outline-none focus:border-[#4a9eff]/50 focus:bg-[#0f0f22] transition-colors"
            />
          </div>
          <div>
            <label class="block text-xs text-[#8892a4] mb-1.5 tracking-wide" for="fcountry-search">Country</label>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="relative" on:click|stopPropagation>

              <!-- Trigger button -->
              <button
                type="button"
                on:click={() => { countryOpen = !countryOpen; if (countryOpen) setTimeout(() => countryInputEl?.focus(), 50); }}
                class="w-full bg-[#0d0d1a] border border-[#1e1e30] rounded-lg px-4 py-3 text-sm text-left flex items-center justify-between
                       focus:outline-none focus:border-[#4a9eff]/50 transition-colors
                       {formCountry ? 'text-white' : 'text-[#3a3a5a]'}"
              >
                <span>{formCountry || 'Select your country'}</span>
                <svg class="w-4 h-4 text-[#3a3a5a] transition-transform {countryOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              <!-- Dropdown panel -->
              {#if countryOpen}
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div
                  class="absolute z-50 mt-1 w-full bg-[#0d0d1a] border border-[#2a2a40] rounded-xl shadow-2xl overflow-hidden"
                  on:click|stopPropagation
                >
                  <!-- Search input -->
                  <div class="p-2 border-b border-[#1e1e30]">
                    <input
                      bind:this={countryInputEl}
                      id="fcountry-search"
                      type="text"
                      bind:value={countrySearch}
                      on:keydown={onCountryKeydown}
                      placeholder="Type to search..."
                      class="w-full bg-[#111122] border border-[#2a2a40] rounded-lg px-3 py-2 text-sm text-white placeholder-[#3a3a5a] focus:outline-none focus:border-[#4a9eff]/50"
                    />
                  </div>

                  <!-- Options list -->
                  <ul class="max-h-56 overflow-y-auto py-1" role="listbox">
                    {#each filteredGroups as group}
                      <li class="px-3 py-1.5 text-[10px] text-[#4a4a6a] font-mono tracking-widest uppercase select-none">{group.group}</li>
                      {#each group.options as option}
                        <li
                          role="option"
                          aria-selected={formCountry === option}
                          on:click={() => selectCountry(option)}
                          class="px-4 py-2 text-sm cursor-pointer transition-colors
                                 {formCountry === option
                                   ? 'bg-[#4a9eff]/20 text-[#4a9eff]'
                                   : 'text-[#94a3b8] hover:bg-white/5 hover:text-white'}"
                        >
                          {option}
                        </li>
                      {/each}
                    {/each}
                    {#if filteredGroups.length === 0}
                      <li class="px-4 py-3 text-sm text-[#3a3a5a] text-center">No countries found</li>
                    {/if}
                  </ul>
                </div>

                <!-- Click outside to close -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div class="fixed inset-0 z-40" on:click={() => { countryOpen = false; countrySearch = ''; }} />
              {/if}

            </div>
          </div>
        </div>
        <div>
          <label class="block text-xs text-[#8892a4] mb-1.5 tracking-wide" for="femail">Email Address</label>
          <input
            id="femail"
            type="email"
            bind:value={formEmail}
            required
            placeholder="your@email.com"
            class="w-full bg-[#0d0d1a] border border-[#1e1e30] rounded-lg px-4 py-3 text-sm text-white placeholder-[#3a3a5a] focus:outline-none focus:border-[#4a9eff]/50 focus:bg-[#0f0f22] transition-colors"
          />
        </div>
        <div>
          <label class="block text-xs text-[#8892a4] mb-1.5 tracking-wide" for="fwhatsapp">
            WhatsApp Number <span class="text-[#3a3a5a] font-normal">(optional, with country code)</span>
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a9eff] text-sm select-none">+</span>
            <input
              id="fwhatsapp"
              type="tel"
              bind:value={formWhatsapp}
              placeholder=""
              class="w-full bg-[#0d0d1a] border border-[#1e1e30] rounded-lg pl-7 pr-4 py-3 text-sm text-white placeholder-[#3a3a5a] focus:outline-none focus:border-[#4a9eff]/50 focus:bg-[#0f0f22] transition-colors"
            />
          </div>
        </div>
        <div>
          <label class="block text-xs text-[#8892a4] mb-1.5 tracking-wide" for="fmessage">Message Body</label>
          <textarea
            id="fmessage"
            bind:value={formMessage}
            required
            rows="5"
            placeholder="Briefly describe the nature of your enquiry..."
            class="w-full bg-[#0d0d1a] border border-[#1e1e30] rounded-lg px-4 py-3 text-sm text-white placeholder-[#3a3a5a] focus:outline-none focus:border-[#4a9eff]/50 focus:bg-[#0f0f22] transition-colors resize-none"
          ></textarea>
        </div>
        <button
          type="submit"
          disabled={formStatus === 'sending'}
          class="w-full py-3.5 rounded-lg
            {formStatus === 'error' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#4a9eff] hover:bg-[#3a8eef]'}
            disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2"
        >
          {#if formStatus === 'sending'}
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Sending…
          {:else if formStatus === 'error'}
            ⚠ Failed to send — please try again
          {:else}
            Send Secure Message
          {/if}
        </button>
      </form>
    {/if}
  </div>
</section>

<!-- ─── Floating WhatsApp Button ─────────────────────────────── -->
{#if whatsappNumber}
  <a
    href="https://wa.me/{whatsappNumber}"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Chat on WhatsApp"
    class="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
    style="background: linear-gradient(135deg, #25d366, #128c7e);"
  >
    <!-- WhatsApp icon -->
    <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.507 3.933 1.395 5.61L0 24l6.59-1.376A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.488-5.19-1.344l-.373-.221-3.865.808.818-3.769-.24-.388A9.947 9.947 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
    <!-- Pulse ring -->
    <span class="absolute inset-0 rounded-full animate-ping opacity-30" style="background:#25d366"></span>
  </a>
{/if}

<!-- ─── Footer ────────────────────────────────────────────────── -->
<footer class="border-t border-[#1a1a2e] py-8 px-6 bg-[#07070e]">
  <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
    <p class="text-[#3a3a5a] text-xs font-mono">{footerCopyright}</p>
    <div class="flex items-center gap-6 text-xs text-[#3a3a5a]">
      <a href="#profile"      class="hover:text-[#8892a4] transition-colors">Profile</a>
      <a href="#timeline"     class="hover:text-[#8892a4] transition-colors">Timeline</a>
      <a href="#capabilities" class="hover:text-[#8892a4] transition-colors">Capabilities</a>        <a href="#languages"    class="hover:text-[#8892a4] transition-colors">Languages</a>      <a href="/admin/login"  class="hover:text-[#3a3a5a]/50 font-mono" tabindex="-1" aria-label="Admin">sys://admin</a>
    </div>
  </div>
</footer>
