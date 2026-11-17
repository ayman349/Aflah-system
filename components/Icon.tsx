const P: Record<string, string> = {
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  sun: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7 1.4-1.4M4.9 19.1l1.4-1.4m0-11.4L4.9 4.9m14.2 14.2-1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  chip: 'M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm3 5h4v4h-4z',
  shield: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6zm-3 9 2 2 4-4',
  wrench: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z',
  plug: 'M9 2v6m6-6v6M6 8h12v3a6 6 0 0 1-12 0zm6 9v5',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zm0 14a2 2 0 0 1 2-2h13',
  play: 'M8 5v14l11-7z',
  file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zm0 0v5h5M9 13h6m-6 4h6',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v10H6z',
  check: 'm5 12 5 5 9-10',
  users: 'M16 11a3 3 0 1 0-6 0 3 3 0 0 0 6 0zM4 20c0-3.3 3.6-5 8-5s8 1.7 8 5',
  cap: 'm2 9 10-5 10 5-10 5zm4 3v5c0 1.5 3 3 6 3s6-1.5 6-3v-5',
  cal: 'M6 4V2m12 2V2M4 6h16v15H4zm0 5h16',
  download: 'M12 3v12m0 0-4-4m4 4 4-4M5 21h14',
  search: 'm21 21-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  grid: 'M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z',
  edit: 'M4 20h4L19 9l-4-4L4 16zm9-13 4 4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9c0-3.3 3.6-5 8-5s8 1.7 8 5',
  tag: 'M3 12V4h8l10 10-8 8zm5-4h.01',
  cog: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7-3 2-1-2-4-2 .5a7 7 0 0 0-1.5-1L15 4h-4l-.5 2.5a7 7 0 0 0-1.5 1L7 7l-2 4 2 1a7 7 0 0 0 0 2l-2 1 2 4 2-.5a7 7 0 0 0 1.5 1L11 20h4l.5-2.5a7 7 0 0 0 1.5-1l2 .5 2-4-2-1a7 7 0 0 0 0-2z',
}
export default function Icon({ n, className = 'h-5 w-5', fill = false }: { n: keyof typeof P | string; className?: string; fill?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[n] ?? P.bolt} />
    </svg>
  )
}
