import type { WindowId } from '@site/src/data/home';
import type { ComponentType, ReactNode } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import { AgentsModal } from '@site/src/components/AgentsModal';
import { InstallPanel } from '@site/src/components/home/InstallPanel';
import { OverviewPanel } from '@site/src/components/home/OverviewPanel';
import { RailTip } from '@site/src/components/home/RailTip';
import { UsagePanel } from '@site/src/components/home/UsagePanel';
import { PaperModal } from '@site/src/components/PaperModal';
import { ParticleWaveField } from '@site/src/components/ParticleWaveField';
import { PartnersModal } from '@site/src/components/PartnersModal';
import {
  ALL_AGENTS,
  BACKGROUNDS,
  FEATURE,
  PHASE_STEPS,
  RAILS,
  STEP_ICONS,
  TABS,
} from '@site/src/data/home';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { FaBook, FaStar } from 'react-icons/fa6';
import { GoHeartFill } from 'react-icons/go';
import { LuMenu, LuX } from 'react-icons/lu';

const Home = (): ReactNode => {
  const [active, setActive] = useState<WindowId>('overview');
  const [selected, setSelected] = useState<string>('claude');
  const [usageStep, setUsageStep] = useState(0);
  const [modeIndex, setModeIndex] = useState(0);
  const [typedDone, setTypedDone] = useState(false);
  const [paperOpen, setPaperOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [partnersOpen, setPartnersOpen] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<WindowId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState<{ left: number; width: number } | null>(
    null
  );

  useLayoutEffect(() => {
    const measure = () => {
      const el = tabRefs.current[hoveredTab ?? active];
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
    };

    measure();

    const nav = navRef.current;
    if (!nav) return;

    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    nav.addEventListener('scroll', measure, { passive: true });

    return () => {
      observer.disconnect();
      nav.removeEventListener('scroll', measure);
    };
  }, [hoveredTab, active]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('partners') || window.location.hash === '#partners')
      setPartnersOpen(true);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    const onPointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [menuOpen]);

  const goToStep = useCallback((index: number) => {
    setTypedDone(false);
    setModeIndex(0);
    setUsageStep(index);
  }, []);

  const selectMode = useCallback((index: number) => {
    setTypedDone(false);
    setModeIndex(index);
  }, []);

  const goToTab = (id: WindowId) => {
    if (id === 'usage') {
      setTypedDone(false);
      setUsageStep(0);
      setModeIndex(0);
    }

    setActive(id);
    contentRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openInstall = useCallback(() => goToTab('install'), []);
  const openPaper = useCallback(() => setPaperOpen(true), []);
  const openAgents = useCallback(() => setAgentsOpen(true), []);
  const markTyped = useCallback(() => setTypedDone(true), []);

  const feature = FEATURE[active];

  const headerLinks: {
    label: string;
    Icon: ComponentType;
    href?: string;
    onClick?: () => void;
  }[] = [
    { label: 'Docs', Icon: FaBook, href: '/docs' },
    {
      label: 'GitHub',
      Icon: FaStar,
      href: 'https://github.com/wellwelwel/blue-spec',
    },
    {
      label: 'Support',
      Icon: GoHeartFill,
      onClick: () => setPartnersOpen(true),
    },
  ];

  const headerLinkClass =
    'inline-flex items-center gap-[9px] pl-4 pr-[18px] py-[9px] rounded-xl border border-line bg-card text-ink text-[14px] font-semibold tracking-[-0.01em] no-underline cursor-pointer transition-[background-color,border-color] duration-200 ease-out hover:bg-card-hover hover:border-accent/50 [&>svg]:size-4 [&>svg]:text-[#0088ff]';

  return (
    <div className='bs-canvas relative min-h-screen m-0 antialiased text-ink bg-[#050a18] font-sans'>
      <Head>
        <title>
          SDH: Blue Spec — Security-Driven Hardening for AI-built software
        </title>
        <html className='bs-canvas-html' lang='en' />
        <body className='bs-canvas-body' />
        <meta
          name='description'
          content='Blue Spec helps your AI agent make a project more secure. You point it at your code, and the agent figures out what your system actually does, then guides you through the security work that matters for it.'
        />
        <link rel='canonical' href='https://bluespec.weslley.io/' />
        <meta property='og:type' content='website' />
        <meta property='og:url' content='https://bluespec.weslley.io/' />
        <meta
          property='og:title'
          content='SDH: Blue Spec — Security-Driven Hardening for AI-built software'
        />
        <meta
          property='og:description'
          content='Blue Spec helps your AI agent make a project more secure. Point it at your code, and it guides you through the security work that matters for it.'
        />
        <meta
          property='og:image'
          content='https://bluespec.weslley.io/img/og.png'
        />
        <meta
          name='twitter:title'
          content='SDH: Blue Spec — Security-Driven Hardening'
        />
        <meta
          name='twitter:description'
          content='Blue Spec helps your AI agent make a project more secure. Point it at your code, and it guides you through the security work that matters for it.'
        />
        <meta
          name='twitter:image'
          content='https://bluespec.weslley.io/img/og.png'
        />
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        />
        <link
          href='https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=Inter:wght@400;500;600;700&family=Ubuntu+Mono:wght@400;700&display=swap'
          rel='stylesheet'
        />
        <script type='application/ld+json'>
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Blue Spec',
            url: 'https://bluespec.weslley.io',
            description:
              'Blue Spec helps your AI agent make a project more secure. You point it at your code, and the agent figures out what your system actually does, then guides you through the security work that matters for it.',
          })}
        </script>
      </Head>

      <div
        className='fixed inset-0 z-0 overflow-hidden bg-[#050a18]'
        aria-hidden
      >
        {TABS.map((tab) => (
          <img
            key={tab.id}
            className={`absolute top-1/2 left-1/2 z-0 w-[130%] h-[130%] min-w-[130vh] object-cover object-center -translate-x-1/2 -translate-y-1/2 [filter:blur(34px)_brightness(0.95)_saturate(1.05)] transition-opacity duration-700 ease-out ${
              active === tab.id ? 'opacity-15' : 'opacity-0'
            }`}
            src='/img/bg-1.png'
            alt=''
          />
        ))}
        <BrowserOnly>
          {() => (
            <ParticleWaveField className='absolute inset-0 z-[1] w-full h-full opacity-55 mix-blend-screen' />
          )}
        </BrowserOnly>
        <div className='absolute inset-0 z-[2] [background:radial-gradient(120%_120%_at_50%_38%,transparent_48%,rgba(4,8,22,0.55)_100%)]' />
      </div>

      <main className='relative z-[2] min-h-screen flex items-center justify-center p-[clamp(16px,4vw,64px)] max-[600px]:p-0 max-[600px]:items-stretch'>
        <section className='w-full max-w-[1240px] rounded-[28px] border border-[#0c155c] bg-glass overflow-hidden [backdrop-filter:blur(40px)_saturate(120%)] [-webkit-backdrop-filter:blur(40px)_saturate(120%)] [box-shadow:inset_0_1px_0_0_rgba(255,255,255,0.08),0_40px_120px_-40px_rgba(10,11,13,0.7)] max-[600px]:max-w-none max-[600px]:min-h-screen max-[600px]:[min-height:100dvh] max-[600px]:rounded-none max-[600px]:border-0 max-[600px]:flex max-[600px]:flex-col max-[600px]:overflow-visible max-[600px]:[backdrop-filter:none] max-[600px]:[-webkit-backdrop-filter:none]'>
          <header className='grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-[clamp(22px,3vw,38px)] py-[clamp(18px,2.4vw,28px)] border-b border-[#0c155c] max-[920px]:flex max-[920px]:flex-wrap max-[920px]:justify-between max-[920px]:pb-3.5 max-[600px]:sticky max-[600px]:top-0 max-[600px]:z-30 max-[600px]:border-b max-[600px]:bg-[rgba(5,10,24,0.82)] max-[600px]:[backdrop-filter:blur(16px)_saturate(140%)] max-[600px]:[-webkit-backdrop-filter:blur(16px)_saturate(140%)]'>
            <div className='flex items-center gap-[18px] min-w-0'>
              <span
                className='flex items-center gap-2 max-[920px]:hidden'
                aria-hidden
              >
                <span className='size-3 rounded-full bg-accent' />
                <span className='size-3 rounded-full bg-accent opacity-55' />
                <span className='size-3 rounded-full bg-accent opacity-25' />
              </span>
              <button
                type='button'
                onClick={() => goToTab('overview')}
                aria-label='Blue Spec, back to overview'
                className='inline-flex items-center gap-2 font-display text-[clamp(18px,1.8vw,23px)] font-extrabold tracking-[-0.02em] leading-none cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4'
              >
                <span>
                  SDH
                  <span className='text-[#2092ff]'>:</span> Blue Spec
                </span>
              </button>
            </div>

            <nav
              ref={navRef}
              className='relative flex items-center gap-1 rounded-xl border border-line bg-card p-1 max-[920px]:order-3 max-[920px]:w-full'
              aria-label='Windows'
              onMouseLeave={() => setHoveredTab(null)}
            >
              {pill && (
                <span
                  className='absolute top-1 bottom-1 rounded-lg border border-accent/50 bg-accent/15 transition-[left,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none'
                  style={{ left: pill.left, width: pill.width }}
                  aria-hidden
                />
              )}
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  type='button'
                  aria-current={active === tab.id ? 'page' : undefined}
                  onClick={() => goToTab(tab.id)}
                  onMouseEnter={() => setHoveredTab(tab.id)}
                  className={`relative z-[1] inline-flex items-center justify-center gap-1.5 px-3.5 py-[7px] rounded-lg text-[14px] font-bold tracking-[-0.01em] whitespace-nowrap cursor-pointer transition-colors duration-200 hover:text-ink max-[920px]:flex-1 ${
                    active === tab.id
                      ? 'text-ink'
                      : 'text-[rgba(233,237,247,0.7)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <div
              ref={menuRef}
              className='relative flex items-center justify-end gap-1.5 max-[920px]:justify-center'
            >
              <div className='flex items-center gap-1.5 max-[920px]:hidden'>
                {headerLinks.map(({ label, Icon, href, onClick }) =>
                  href ? (
                    <Link key={label} className={headerLinkClass} to={href}>
                      <Icon aria-hidden />
                      {label}
                    </Link>
                  ) : (
                    <button
                      key={label}
                      type='button'
                      onClick={onClick}
                      className={headerLinkClass}
                    >
                      <Icon aria-hidden />
                      {label}
                    </button>
                  )
                )}
              </div>

              <button
                type='button'
                aria-label='Menu'
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className='relative hidden size-10 items-center justify-center rounded-xl border border-line bg-card text-ink transition-[background-color,border-color] duration-200 ease-out hover:bg-card-hover hover:border-accent/50 max-[920px]:inline-flex'
              >
                <LuMenu
                  aria-hidden
                  className={`absolute size-[18px] transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                    menuOpen
                      ? 'opacity-0 scale-[0.25] blur-[4px]'
                      : 'opacity-100 scale-100 blur-0'
                  }`}
                />
                <LuX
                  aria-hidden
                  className={`absolute size-[18px] transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                    menuOpen
                      ? 'opacity-100 scale-100 blur-0'
                      : 'opacity-0 scale-[0.25] blur-[4px]'
                  }`}
                />
              </button>

              {menuOpen && (
                <div className='bs-menu-pop absolute top-[calc(100%+8px)] right-0 z-[20] flex w-[200px] flex-col gap-1 rounded-2xl border border-line bg-[rgba(10,15,31,0.92)] p-1.5 [backdrop-filter:blur(16px)_saturate(150%)] [-webkit-backdrop-filter:blur(16px)_saturate(150%)] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.08),0_20px_48px_-16px_rgba(0,0,0,0.6)] min-[921px]:hidden'>
                  {headerLinks.map(({ label, Icon, href, onClick }) =>
                    href ? (
                      <Link
                        key={label}
                        className='inline-flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[14px] font-semibold tracking-[-0.01em] no-underline text-ink transition-colors duration-200 ease-out hover:bg-white/[0.06] [&>svg]:size-[18px] [&>svg]:text-[#0088ff]'
                        to={href}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Icon aria-hidden />
                        {label}
                      </Link>
                    ) : (
                      <button
                        key={label}
                        type='button'
                        onClick={() => {
                          onClick?.();
                          setMenuOpen(false);
                        }}
                        className='inline-flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[14px] font-semibold tracking-[-0.01em] text-ink transition-colors duration-200 ease-out hover:bg-white/[0.06] [&>svg]:size-[18px] [&>svg]:text-[#0088ff]'
                      >
                        <Icon aria-hidden />
                        {label}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </header>

          <div className='grid grid-cols-[56px_1fr] max-[600px]:grid-cols-[1fr] max-[600px]:flex-1'>
            <nav
              className='relative z-20 border-r border-[#0c155c] max-[600px]:border-r-0 max-[600px]:border max-[600px]:border-[#0c155c] max-[600px]:order-3 max-[600px]:fixed max-[600px]:bottom-[calc(16px+env(safe-area-inset-bottom))] max-[600px]:left-1/2 max-[600px]:-translate-x-1/2 max-[600px]:z-20 max-[600px]:w-auto max-[600px]:rounded-full max-[600px]:bg-[rgba(12,16,28,0.42)] max-[600px]:[backdrop-filter:blur(10px)_saturate(140%)] max-[600px]:[-webkit-backdrop-filter:blur(10px)_saturate(140%)] max-[600px]:[box-shadow:0_8px_30px_-6px_rgba(0,0,0,0.55)]'
              aria-label='Sections'
            >
              <div
                key={active}
                className='bs-fade-in flex flex-col items-center gap-[26px] py-[clamp(24px,3vw,36px)] max-[600px]:flex-row max-[600px]:justify-center max-[600px]:gap-9 max-[600px]:px-7 max-[600px]:py-3.5'
              >
                {active === 'usage'
                  ? PHASE_STEPS.map((step, index) => {
                      const Icon = STEP_ICONS[index];

                      return (
                        <RailTip key={step.phase.title} tip={step.phase.title}>
                          <button
                            type='button'
                            onClick={() => goToStep(index)}
                            className={`relative flex items-center justify-center size-[22px] border-0 bg-none cursor-pointer transition-colors duration-200 ease-out [&>svg]:size-[19px] hover:text-ink after:absolute after:top-1/2 after:left-1/2 after:size-10 after:-translate-x-1/2 after:-translate-y-1/2 ${
                              index === usageStep
                                ? 'bs-rail__item--active text-ink'
                                : 'text-[#515664]'
                            }`}
                            aria-label={`${step.phase.title} (step ${index + 1} of ${PHASE_STEPS.length})`}
                            aria-current={
                              index === usageStep ? 'step' : undefined
                            }
                          >
                            <Icon aria-hidden />
                          </button>
                        </RailTip>
                      );
                    })
                  : RAILS[active].map((item) => {
                      const railItemClass = `relative flex items-center justify-center size-[22px] border-0 bg-none cursor-pointer transition-colors duration-200 ease-out [&>svg]:size-[19px] hover:text-ink after:absolute after:top-1/2 after:left-1/2 after:size-10 after:-translate-x-1/2 after:-translate-y-1/2 ${
                        item.active
                          ? 'bs-rail__item--active text-ink'
                          : 'text-[#515664]'
                      }`;

                      if (item.href)
                        return (
                          <RailTip key={item.label} tip={item.tip}>
                            <a
                              href={item.href}
                              target='_blank'
                              rel='noreferrer'
                              className={railItemClass}
                              aria-label={item.label}
                            >
                              <item.Icon aria-hidden />
                            </a>
                          </RailTip>
                        );

                      return (
                        <RailTip key={item.label} tip={item.tip}>
                          <button
                            type='button'
                            onClick={
                              item.action === 'paper'
                                ? () => setPaperOpen(true)
                                : item.action === 'agents'
                                  ? () => setAgentsOpen(true)
                                  : item.action === 'partners'
                                    ? () => setPartnersOpen(true)
                                    : undefined
                            }
                            className={railItemClass}
                            aria-label={item.label}
                            aria-current={item.active ? 'page' : undefined}
                          >
                            <item.Icon aria-hidden />
                          </button>
                        </RailTip>
                      );
                    })}
              </div>
            </nav>

            <div className='grid grid-cols-[1.15fr_0.85fr] gap-[clamp(20px,2.6vw,38px)] p-[clamp(22px,3vw,38px)] max-[920px]:grid-cols-[1fr] max-[600px]:pt-3 max-[600px]:pb-[calc(104px+env(safe-area-inset-bottom))]'>
              <div
                ref={contentRef}
                className='bs-flow flex flex-col min-w-0 h-[var(--bs-window-h)] overflow-y-auto max-[920px]:h-auto max-[920px]:overflow-visible'
              >
                <div
                  key={active}
                  className='bs-fade-in flex flex-col min-w-0 h-full max-[920px]:h-auto'
                >
                  {active === 'overview' && (
                    <OverviewPanel
                      onInstall={openInstall}
                      onOpenPaper={openPaper}
                    />
                  )}

                  {active === 'install' && (
                    <InstallPanel
                      selected={selected}
                      onSelect={setSelected}
                      onOpenAgents={openAgents}
                    />
                  )}

                  {active === 'usage' && (
                    <UsagePanel
                      usageStep={usageStep}
                      modeIndex={modeIndex}
                      typedDone={typedDone}
                      onSelectMode={selectMode}
                      onStep={goToStep}
                      onTyped={markTyped}
                    />
                  )}
                </div>
              </div>

              <aside className='relative flex flex-col justify-between h-[var(--bs-window-h)] rounded-[20px] overflow-hidden p-[clamp(22px,2.4vw,32px)] isolate max-[920px]:h-auto max-[920px]:min-h-[420px] max-[920px]:order-first max-[600px]:min-h-[340px]'>
                {TABS.map((tab) => (
                  <img
                    key={tab.id}
                    className={`absolute inset-0 -z-[2] w-full h-full object-cover object-[50%_70%] [filter:contrast(1.04)_saturate(1.08)] transition-opacity duration-700 ease-out ${
                      active === tab.id ? 'opacity-25' : 'opacity-0'
                    }`}
                    src={BACKGROUNDS[tab.id]}
                    alt=''
                  />
                ))}
                <div className='absolute inset-0 -z-[3] [background:linear-gradient(180deg,#0a1a4a_0%,#050d2c_60%,#03081c_100%)]' />
                <div className='absolute inset-0 -z-[1] [background:linear-gradient(180deg,rgba(4,9,28,0.42)_0%,rgba(4,9,28,0.05)_32%,rgba(4,9,28,0.2)_58%,rgba(3,7,22,0.82)_100%)]' />

                <div
                  key={`top-${active}`}
                  className='bs-fade-in flex flex-col items-start gap-3.5'
                >
                  <span className='inline-flex items-center px-3.5 py-[7px] rounded-md bg-accent font-mono text-[12px] tracking-[0.075em] uppercase text-ink'>
                    <span className='size-[6px] rounded-full bg-white mr-[9px]' />
                    {feature.chip}
                  </span>
                  <p className='text-[clamp(14px,1.35vw,16px)] font-normal leading-[1.55] tracking-[-0.01em] text-[rgba(233, 237, 247,0.92)] [text-shadow:0_1px_12px_rgba(0,0,0,0.45)]'>
                    {feature.kicker}
                  </p>
                </div>

                <div
                  key={`title-${active}`}
                  className='bs-fade-in flex flex-col gap-[10px]'
                >
                  <span className='font-mono text-[12px] tracking-[0.18em] uppercase text-[rgba(233, 237, 247,0.62)]'>
                    {feature.eyebrow}
                  </span>
                  <h1 className='font-display font-black text-[clamp(32px,4.4vw,48px)] leading-[1.5] tracking-[-0.02em] m-0'>
                    <span className='text-accent mr-2 [-webkit-text-stroke:0.04em_var(--color-accent)]'>
                      /
                    </span>
                    {feature.title}
                  </h1>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <PaperModal open={paperOpen} onClose={() => setPaperOpen(false)} />
      <AgentsModal
        open={agentsOpen}
        agents={ALL_AGENTS}
        onSelect={setSelected}
        onClose={() => setAgentsOpen(false)}
      />
      <PartnersModal
        open={partnersOpen}
        onClose={() => setPartnersOpen(false)}
      />
    </div>
  );
};

export default Home;
