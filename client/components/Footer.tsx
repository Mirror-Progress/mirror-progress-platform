/* ------------------------------------------------------------------ */
/* components/Footer.tsx                                              */
/* ------------------------------------------------------------------ */
import React, {
  useRef, MutableRefObject,
} from 'react';
import {
  capabilityBuckets, icons, paragraphs, termsConditions, policyText,
} from '../constants';
import { FooterBtn }  from './';
import { useGSAP }    from '@gsap/react';
import gsap           from 'gsap';
import AccountMenu from './AccountMenu';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../hooks/useTheme';

interface SocialProps {
  src: string; href: string; sr: string;
  colour?: string; size?: string;
}
const Social: React.FC<SocialProps> = ({
  src,
  href,
  sr,
  colour = 'oklch(27.7% 0.046 192.524)',
  size   = 'w-6 h-6',
}) => (
  <a
    href={href}
    target="_blank" rel="noopener noreferrer"
    aria-label={sr}
    className="inline-flex items-center group"
  >
    <span
      className={`${size} transition-opacity group-hover:opacity-80`}
      style={{
        backgroundColor: colour,
        WebkitMask: `url(${src}) no-repeat center / contain`,
        mask:        `url(${src}) no-repeat center / contain`,
      }}
    />
  </a>
);

/* ------------------------------------------------------------------ */
const Footer: React.FC = () => {
  const { theme } = useTheme();

  /* ── modal refs & helpers ─────────────────────────────────────── */
  const termsRef  = useRef<HTMLDivElement>(null);
  const policyRef = useRef<HTMLDivElement>(null);

  const toggle = (r: MutableRefObject<HTMLDivElement | null>, on: boolean) => {
    if (r.current) r.current.style.display = on ? 'flex' : '';
    document.body.style.overflow = on ? 'hidden' : '';
  };

  /* ── entrance fade-in ─────────────────────────────────────────── */
  useGSAP(() => {
    const mobile = window.innerWidth < 768;
    gsap.to('#wait_footer', {
      opacity: 1, y: 0, duration: 0.8, stagger: 0.1,
      scrollTrigger: {
        trigger: '#Footer',
        start: 'top 60%',
        end:   mobile ? 'bottom bottom' : 'bottom top',
        toggleActions: 'play none none reverse',
      },
    });
  }, []);

  /* ---------------------------------------------------------------- */
  return (
    <footer
      id="Footer"
      className="theme-footer-gradient relative flex h-screen w-full flex-col basic-pd pb-[10px]"
    >
      {/* ================= MAIN GRID ================= */}
      <div
        id="wait_footer"
        className="opacity-0 translate-y-8 grid grid-cols-[auto_1fr] flex-1 max-md:grid-cols-1"
      >
        {/* ▸ Logo */}
        <div className="pt-[16px]">
          <img
            src={theme === 'light' ? icons.black.path : icons.white.path}
            alt={theme === 'light' ? icons.black.name : icons.white.name}
            className="w-[46px]"
          />
        </div>

        {/* ▸ Centred content column */}
        <div
          className="pt-[128px] pr-[53px] max-md:pr-0
                     flex flex-col items-center justify-between
                     w-full max-w-[750px] text-center justify-self-center"
        >
          {/* copy · chips · buttons */}
          <div className="flex flex-col items-center gap-[64px] lg:gap-[20px] xl:gap-[64px]">
            <p className="max-w-[600px] font-dmSans text-[24px] font-extralight leading-110 tracking-m3p text-[color:var(--theme-brand-ink)] max-md:text-[16px]">
              {paragraphs.footer}
            </p>

            {/* desktop chips */}
            <div className="my-[15px] max-md:hidden">
              <div className="grid grid-cols-2 gap-[7px]">
                {capabilityBuckets.map((capability) => (
                  <div
                    key={capability.id}
                    className="theme-marketing-card flex min-h-[105px] max-w-[220px] items-end rounded-[20px] px-[14px] py-[16px] text-left"
                  >
                    <p className="font-dmSans text-[15px] leading-110 tracking-m3p text-[color:var(--theme-page-text)]">
                      {capability.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* buttons + desktop socials */}
            <div className="flex min-w-[160px] flex-col items-center gap-[16px]">
              <ThemeToggle />
              <FooterBtn text="Get in Touch" href="#contact" />
              <FooterBtn text="What We do"   href="#capabilities" />
              <AccountMenu className="mt-[2px]" />

              <div className="flex-row gap-[16px] mt-[48px] hidden max-md:flex" />
              <div className="flex flex-row gap-[16px] mt-[48px] max-md:hidden">
                <Social
                  src="/images/instagram.svg"
                  href="https://www.instagram.com/mirror.progress/"
                  sr="Instagram"
                  colour={theme === 'light' ? 'var(--theme-brand-ink)' : '#ffffff'}
                  size="w-8 h-8"
                />
                <Social
                  src="/images/linkedin.svg"
                  href="https://www.linkedin.com/company/mirror-progress/"
                  sr="LinkedIn"
                  colour={theme === 'light' ? 'var(--theme-brand-ink)' : '#ffffff'}
                  size="w-6 h-6"
                />
              </div>
            </div>
          </div>

          {/* -------- desktop legal row -------- */}
          <div
            className="mt-[48px] flex w-full items-center justify-center gap-[24px] font-diatype text-[12px] uppercase text-[color:var(--theme-brand-ink)] max-md:hidden"
          >
            {/* links cluster (left of copyright) */}
            <div className="flex flex-row gap-[24px]">
              <button onClick={() => toggle(termsRef, true)}  className="hover-effect">Terms</button>
              <button onClick={() => toggle(policyRef, true)} className="hover-effect">Privacy</button>
            </div>

            {/* copyright */}
            <span>
              ©&nbsp;2025&nbsp;Mirror&nbsp;Progress&nbsp;Global&nbsp;Inc&nbsp;·&nbsp;All&nbsp;rights&nbsp;reserved
            </span>
          </div>
        </div>
      </div>

      {/* ============== MOBILE DOCK ============== */}
      <div className="hidden max-md:flex w-full justify-between px-[16px] pb-[24px]">
        <div className="flex flex-row gap-[24px]">
          <Social
            src="/images/instagram.svg" href="https://www.instagram.com/mirror.progress/"
            sr="Instagram" colour={theme === 'light' ? 'var(--theme-brand-ink)' : '#ffffff'} size="w-5 h-5"
          />
          <Social
            src="/images/linkedin.svg"  href="https://www.linkedin.com/company/mirror-progress/"
            sr="LinkedIn"  colour={theme === 'light' ? 'var(--theme-brand-ink)' : '#ffffff'} size="w-6 h-6"
          />
        </div>
        <div className="flex flex-row gap-[24px]">
          <button onClick={() => toggle(termsRef, true)}  className="hover-effect text-[12px] font-diatype uppercase text-[color:var(--theme-brand-ink)]">Terms</button>
          <button onClick={() => toggle(policyRef, true)} className="hover-effect text-[12px] font-diatype uppercase text-[color:var(--theme-brand-ink)]">Privacy</button>
        </div>
      </div>

      {/* ===================== TERMS MODAL ======================= */}
      <div
        ref={termsRef}
        className="theme-modal-overlay fixed inset-0 hidden h-screen basic-pd justify-center backdrop-blur-lg"
      >
        <div className="w-full overflow-y-scroll scrollbar-hide flex justify-center">
          <div className="md:max-w-[464px] max-md:max-w-full max-md:px-[40px]">
            <h2 className="font-dmSans text-[80px] max-md:text-[40px] font-light tracking-m2p pt-[180px]">
              Terms & Conditions
            </h2>
            <h3 className="font-diatype text-[14px] uppercase mt-[64px] mb-[40px]">
              Effective&nbsp;Date:&nbsp;January&nbsp;1&nbsp;2025
            </h3>

            {/* full copy */}
            <div className="pb-[30px]">
              {termsConditions.map(t => (
                <div key={t.id} className="font-dmSans text-[17px] max-md:text-[12px] leading-120 mb-[30px]">
                  <h4 className="mb-[8px]">{t.title}</h4>
                  <p>{t.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={() => toggle(termsRef, false)}
          className="theme-secondary-button absolute h-[36px] rounded-[24px] px-[24px] py-[8px] font-inter text-[14px] md:right-[22%] md:top-[188px] max-md:right-[40px] max-md:top-[40px]"
        >
          Close
        </button>
      </div>

      {/* ===================== PRIVACY MODAL ===================== */}
      <div
        ref={policyRef}
        className="theme-modal-overlay fixed inset-0 hidden h-screen basic-pd justify-center backdrop-blur-lg"
      >
        <div className="w-full overflow-y-scroll scrollbar-hide flex justify-center">
          <div className="md:max-w-[464px] max-md:max-w-full max-md:px-[40px]">
            <h2 className="font-dmSans text-[80px] max-md:text-[40px] font-light tracking-m2p pt-[180px]">
              Privacy&nbsp;Policy
            </h2>
            <h3 className="font-diatype text-[14px] uppercase mt-[64px] mb-[40px]">
              Effective&nbsp;Date:&nbsp;January&nbsp;1&nbsp;2025
            </h3>

            {/* full copy */}
            <div className="pb-[30px]">
              {policyText.map(section => (
                <div key={section.id} className="font-dmSans text-[17px] max-md:text-[12px] leading-120 mb-[30px]">
                  <h4 className="mb-[8px]">{section.title}</h4>
                  <p>{section.text}</p>

                  {section.items && (
                    <ul className="pl-[35px] list-disc">
                      {section.items.map(item => (
                        <li key={item.id}>{item.text}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={() => toggle(policyRef, false)}
          className="theme-secondary-button absolute h-[36px] rounded-[24px] px-[24px] py-[8px] font-inter text-[14px] md:right-[22%] md:top-[188px] max-md:right-[40px] max-md:top-[40px]"
        >
          Close
        </button>
      </div>
    </footer>
  );
};

export default Footer;
