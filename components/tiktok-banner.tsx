'use client';

export function TikTokBanner() {
  return (
    <div className="bg-negro py-2.5 px-4 border-b border-vino/30">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5 text-vino"
        >
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.10z" />
        </svg>
        <span className="text-gray-300 text-sm hidden sm:inline font-medium">
          ¡Síguenos en TikTok!
        </span>
        <a
          href="https://www.tiktok.com/@www.tiktok.com.catalina"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-vino text-negro px-4 py-1.5 rounded-full font-bold text-xs hover:bg-vino-light transition-colors shadow-sm"
        >
          <span>Joyería Catalina</span>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M19 15l-6 6-1.5-1.5L14 17H5V5h1.5l5.5 5.5L10 13l6-6z" />
          </svg>
        </a>
      </div>
    </div>
  );
}