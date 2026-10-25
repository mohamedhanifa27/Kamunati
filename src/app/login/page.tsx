'use client';

import React, { useState, useEffect, useLayoutEffect, useRef, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useTransitionRouter } from 'next-view-transitions';
import { Loader2 } from 'lucide-react';
import { CloudIntroLogo } from '@/components/ui/CloudIntroLogo';
import './login.css';

const STEAM_PATHS = [
  'M 651,262 L 641,267 L 622,286 L 611,302 L 600,328 L 598,337 L 598,354 L 603,372 L 610,387 L 623,405 L 641,424 L 654,448 L 658,466 L 658,482 L 653,503 L 644,522 L 646,530 L 648,532 L 653,533 L 657,532 L 671,521 L 685,506 L 695,492 L 706,468 L 708,447 L 704,426 L 694,403 L 681,385 L 661,362 L 650,340 L 647,324 L 648,304 L 653,286 L 660,271 L 659,266 L 656,263 Z',
  'M 918,254 L 914,254 L 907,257 L 898,264 L 883,280 L 869,304 L 864,326 L 865,342 L 868,353 L 877,371 L 893,394 L 899,409 L 902,422 L 901,448 L 896,464 L 887,483 L 888,492 L 893,496 L 898,496 L 902,494 L 914,483 L 933,461 L 942,448 L 948,436 L 953,416 L 952,403 L 945,381 L 936,364 L 921,341 L 914,322 L 913,295 L 916,281 L 923,265 L 923,259 Z',
  'M 779,180 L 770,182 L 759,189 L 743,202 L 732,214 L 720,232 L 715,243 L 710,258 L 708,270 L 709,291 L 713,305 L 721,322 L 730,336 L 752,360 L 767,381 L 778,408 L 781,424 L 780,451 L 774,473 L 764,495 L 764,504 L 769,509 L 775,509 L 786,502 L 812,477 L 820,467 L 835,437 L 839,412 L 836,387 L 832,374 L 824,357 L 810,336 L 783,304 L 773,286 L 769,275 L 766,257 L 767,236 L 773,215 L 785,192 L 785,186 Z',
];

const BODY_PATH =
  'M 1218,754 L 1214,753 L 1126,804 L 1062,837 L 1062,834 L 1071,822 L 1082,801 L 1088,784 L 1092,766 L 1092,731 L 1087,710 L 1083,700 L 1073,682 L 1057,664 L 1045,656 L 1026,649 L 1024,647 L 1022,632 L 1011,606 L 995,583 L 978,566 L 959,552 L 939,542 L 918,535 L 890,530 L 866,530 L 834,536 L 810,545 L 791,555 L 766,574 L 747,595 L 731,620 L 712,600 L 691,585 L 666,573 L 649,568 L 629,565 L 593,566 L 570,571 L 544,581 L 526,591 L 507,605 L 482,632 L 470,651 L 459,676 L 454,698 L 454,722 L 434,736 L 420,750 L 410,763 L 396,788 L 387,816 L 384,843 L 385,860 L 388,875 L 394,893 L 404,912 L 419,931 L 432,942 L 452,954 L 435,972 L 422,991 L 412,1012 L 405,1034 L 402,1051 L 402,1078 L 405,1097 L 414,1124 L 429,1150 L 442,1165 L 461,1181 L 481,1192 L 506,1200 L 536,1203 L 561,1199 L 585,1190 L 592,1199 L 604,1210 L 629,1225 L 646,1231 L 666,1235 L 693,1235 L 728,1226 L 759,1211 L 787,1191 L 812,1164 L 824,1175 L 842,1187 L 867,1197 L 884,1200 L 906,1200 L 924,1197 L 943,1191 L 967,1179 L 981,1169 L 992,1158 L 1003,1143 L 1010,1141 L 1027,1132 L 1047,1117 L 1061,1102 L 1076,1076 L 1084,1051 L 1087,1033 L 1087,997 L 1187,1060 L 1215,1076 L 1218,1073 L 1219,1069 Z M 953,612 L 967,628 L 975,644 L 974,649 L 962,654 L 959,657 L 958,666 L 963,670 L 978,671 L 992,675 L 1013,687 L 1027,701 L 1034,711 L 1041,728 L 1044,742 L 1044,760 L 1039,782 L 1030,800 L 1019,814 L 1005,827 L 990,837 L 967,847 L 947,852 L 939,858 L 937,863 L 938,869 L 942,874 L 976,888 L 999,904 L 1014,919 L 1024,932 L 1038,960 L 1042,981 L 1042,1004 L 1039,1024 L 1030,1049 L 1023,1062 L 1013,1076 L 993,1095 L 977,1104 L 970,1114 L 962,1122 L 949,1131 L 930,1140 L 915,1144 L 897,1146 L 882,1145 L 854,1138 L 838,1130 L 830,1124 L 831,1100 L 826,1072 L 820,1059 L 815,1055 L 809,1055 L 805,1057 L 801,1064 L 801,1080 L 795,1099 L 788,1112 L 776,1129 L 757,1148 L 738,1161 L 713,1172 L 688,1177 L 662,1176 L 635,1167 L 621,1158 L 611,1148 L 604,1135 L 600,1132 L 575,1145 L 562,1149 L 547,1151 L 528,1150 L 519,1148 L 498,1139 L 488,1132 L 476,1120 L 463,1099 L 456,1074 L 456,1044 L 464,1016 L 477,993 L 495,974 L 515,960 L 537,951 L 545,949 L 547,951 L 544,965 L 544,978 L 548,998 L 555,1014 L 567,1030 L 577,1039 L 594,1049 L 608,1054 L 631,1057 L 647,1056 L 673,1049 L 700,1033 L 707,1027 L 718,1013 L 718,1008 L 715,1004 L 708,1004 L 696,1011 L 674,1018 L 648,1018 L 625,1010 L 613,1001 L 606,993 L 597,977 L 593,963 L 593,939 L 599,919 L 604,909 L 617,890 L 617,886 L 614,882 L 607,881 L 576,900 L 557,909 L 535,915 L 512,916 L 496,913 L 477,905 L 466,897 L 457,888 L 447,873 L 441,858 L 438,841 L 439,822 L 444,803 L 452,786 L 462,772 L 483,753 L 498,745 L 501,745 L 504,742 L 502,718 L 506,697 L 515,677 L 526,662 L 538,650 L 555,638 L 585,625 L 605,621 L 631,621 L 651,625 L 665,630 L 682,640 L 703,660 L 711,672 L 718,687 L 723,706 L 724,721 L 727,725 L 733,725 L 741,718 L 747,708 L 753,681 L 758,666 L 769,644 L 780,629 L 794,615 L 811,603 L 832,593 L 850,588 L 863,586 L 892,586 L 922,593 L 941,603 Z M 995,985 L 988,983 L 981,988 L 974,1008 L 960,1029 L 948,1041 L 934,1051 L 922,1057 L 904,1063 L 902,1065 L 903,1073 L 907,1077 L 916,1082 L 937,1085 L 951,1082 L 963,1076 L 974,1068 L 983,1059 L 991,1047 L 996,1037 L 1000,1024 L 1001,1000 Z M 585,696 L 570,698 L 561,702 L 551,709 L 536,725 L 527,743 L 524,755 L 524,767 L 528,782 L 538,798 L 545,804 L 553,808 L 557,808 L 561,805 L 561,799 L 555,788 L 552,776 L 552,760 L 554,751 L 566,727 L 574,718 L 589,706 L 590,700 Z M 871,689 L 854,694 L 843,701 L 834,710 L 824,730 L 822,747 L 823,754 L 829,769 L 840,782 L 850,788 L 859,791 L 880,792 L 896,787 L 903,783 L 914,773 L 919,766 L 925,752 L 926,735 L 923,723 L 918,713 L 909,702 L 895,693 L 880,689 Z';

const RAY_PATHS = [
  { d: 'M 325,509 L 278,563 L 389,644 L 420,664 L 407,638 L 379,591 L 343,537 L 329,513 Z', tx: '91px', ty: '61px' },
  { d: 'M 134,660 L 338,763 L 341,762 L 362,721 L 362,719 L 340,711 L 264,694 L 160,664 Z', tx: '105px', ty: '34px' },
  { d: 'M 361,1053 L 329,1063 L 177,1123 L 150,1137 L 195,1175 L 225,1152 L 332,1076 Z', tx: '101px', ty: '-43px' },
  { d: 'M 375,1138 L 373,1138 L 348,1156 L 288,1205 L 303,1234 Z', tx: '93px', ty: '-59px' },
  { d: 'M 1227,535 L 1215,533 L 1183,521 L 1167,563 L 1148,604 L 1122,653 L 1114,674 L 1238,540 Z', tx: '-86px', ty: '69px' },
  { d: 'M 1258,1041 L 1375,1104 L 1375,1057 L 1348,1052 Z', tx: '-104px', ty: '-36px' },
  { d: 'M 1415,773 L 1280,844 L 1258,858 L 1276,854 L 1377,818 Z', tx: '-109px', ty: '11px' },
  { d: 'M 1127,1099 L 1220,1201 L 1254,1236 L 1256,1236 L 1291,1200 L 1237,1165 Z', tx: '-89px', ty: '-64px' },
];

const SPARK_PATHS = [
  'M 1279,617 L 1274,635 L 1264,654 L 1250,668 L 1236,677 L 1219,685 L 1242,688 L 1257,696 L 1267,708 L 1273,720 L 1279,741 L 1285,717 L 1297,696 L 1314,682 L 1330,674 L 1333,674 L 1310,668 L 1303,664 L 1294,655 L 1285,637 Z',
  'M 278,879 L 272,901 L 262,918 L 253,927 L 243,934 L 220,945 L 239,948 L 256,956 L 263,963 L 270,974 L 279,1001 L 284,979 L 296,957 L 313,943 L 332,934 L 310,929 L 301,924 L 295,918 L 286,902 Z',
];

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function LoginForm() {
  const router = useTransitionRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<SVGSVGElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const logo = logoRef.current;
    const slot = slotRef.current;
    const panel = panelRef.current;
    const wrap = wrapRef.current;
    if (!logo || !slot || !panel || !wrap) return;

    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let done = false;
    let timer: NodeJS.Timeout;

    panel.setAttribute('inert', '');
    panel.setAttribute('aria-hidden', 'true');
    html.classList.add('intro');

    const introTransform = () => {
      const r = slot.getBoundingClientRect();
      const size = Math.min(window.innerWidth * 0.8, 520);
      const k = size / r.width;
      const dx = window.innerWidth / 2 - (r.left + r.width / 2);
      const dy = window.innerHeight / 2 - (r.top + r.height / 2);
      return `translate(${dx}px,${dy}px) scale(${k})`;
    };

    logo.style.transform = introTransform();

    const reveal = () => {
      panel.removeAttribute('inert');
      panel.removeAttribute('aria-hidden');
      panel.style.visibility = 'visible';
      const pAnim = panel.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: reduce ? 0 : 600, delay: reduce ? 0 : 450, easing: 'ease-out', fill: 'both' }
      );
      pAnim.onfinish = () => {
        panel.classList.add('revealed');
        panel.style.opacity = '1';
      };
    };

    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);

      const from = introTransform();
      logo.style.transform = 'none';
      const a = logo.animate(
        [{ transform: from }, { transform: 'none' }],
        { duration: reduce ? 0 : 950, easing: 'cubic-bezier(.7,0,.15,1)' }
      );
      reveal();
      a.onfinish = () => {
        html.classList.remove('intro');
      };
      if (reduce) html.classList.remove('intro');
    };

    const skip = () => {
      if (done) return;
      document.getAnimations().forEach((a) => {
        const effect = a.effect as any;
        if (effect?.target && logo.contains(effect.target as Node)) {
          a.finish();
        }
      });
      wrap.classList.add('still');
      finish();
    };

    const onResize = () => {
      if (!done) logo.style.transform = introTransform();
    };

    if (reduce) {
      wrap.classList.add('still');
      timer = setTimeout(finish, 700);
    } else {
      requestAnimationFrame(() => wrap.classList.add('play'));
      timer = setTimeout(finish, 2700);
    }

    window.addEventListener('resize', onResize);
    window.addEventListener('pointerdown', skip, { once: true });
    window.addEventListener('keydown', skip, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
      html.classList.remove('intro');
      html.style.overflow = prevOverflow;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMsg('');

    const em = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(em)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: em,
        password,
        callbackUrl,
      });

      if (res?.error) {
        setError('Invalid email or password.');
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = (provider: string) => {
    signIn(provider, { callbackUrl });
  };

  return (
    <div className="login-page-wrap" ref={wrapRef}>
      <main className="login-box">
        <div className="slot" ref={slotRef}>
          <svg
            className="logo-svg"
            id="logo"
            viewBox="124 170 1301 1076"
            role="img"
            aria-label="Cloud shaped like a film projector, with steam, rays and sparkles"
            ref={logoRef}
          >
            <g className="steam-group">
              {STEAM_PATHS.map((d, i) => (
                <path key={i} style={{ '--i': i } as React.CSSProperties} d={d} />
              ))}
            </g>
            <path className="body-part" fillRule="evenodd" d={BODY_PATH} />
            {RAY_PATHS.map((r, i) => (
              <path
                key={i}
                className="ray-part"
                style={{ '--i': i, '--tx': r.tx, '--ty': r.ty } as React.CSSProperties}
                d={r.d}
              />
            ))}
            {SPARK_PATHS.map((d, i) => (
              <path key={i} className="spark-part" style={{ '--i': i } as React.CSSProperties} d={d} />
            ))}
          </svg>
        </div>

        <div className="panel" id="panel" ref={panelRef}>
          <h1 className="login-title">Sign in</h1>
          <form onSubmit={handleSubmit} noValidate>
            <label className="field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
              />
            </label>
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign in'}
            </button>
            <p className={`login-msg ${error ? 'err' : ''}`} role="status" aria-live="polite">
              {error || statusMsg}
            </p>
          </form>

          <div className="oauth-divider">
            <div className="oauth-line"></div>
            <span>Or continue with</span>
            <div className="oauth-line"></div>
          </div>

          <div className="oauth-buttons">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              className="oauth-btn"
            >
              <svg className="oauth-icon" viewBox="0 0 24 24" width="18" height="18">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.7 1 4 3.5 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5 12 5z"/>
                <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9c-.3 1.4-1 2.5-2.2 3.3l3.6 2.8c2.1-1.9 3.2-4.7 3.2-8.1z"/>
                <path fill="#FBBC05" d="M5.8 14.1c-.2-.7-.3-1.4-.3-2.1s.1-1.4.3-2.1L2.1 7.1C1.4 8.6 1 10.2 1 12s.4 3.4 1.1 4.9l3.7-2.8z"/>
                <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5L2.1 16.9C4 20.5 7.7 23 12 23z"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('github')}
              className="oauth-btn"
            >
              <svg className="oauth-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>

          <div className="links">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setStatusMsg('Password reset is managed by the administrator.');
                setError('');
              }}
            >
              Forgot your password?
            </a>
            <span>
              New here?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setStatusMsg('Account registration is invite-only. Contact your administrator.');
                  setError('');
                }}
              >
                Create an account
              </a>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        /* [RECTIFICATION:BLURRED_LOADING_SCREEN] Blurred background instead of opaque black */
        <div 
          className="min-h-screen flex items-center justify-center select-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(80, 26, 150, 0.22) 0%, rgba(10, 10, 16, 0.45) 85%)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
          }}
        >
          <div className="il play drop-shadow-[0_0_35px_rgba(120,50,220,0.55)]" data-play="">
            <CloudIntroLogo size={100} />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
