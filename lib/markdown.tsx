import React from 'react'

// Tiny, safe lesson formatter. Everything is rendered as React text (never raw HTML), so it cannot inject markup.
function inline(s: string, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g
  let last = 0, m: RegExpExecArray | null, i = 0
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index))
    const t = m[0], k = `${key}-${i++}`
    if (t.startsWith('**')) out.push(<strong key={k}>{t.slice(2, -2)}</strong>)
    else if (t.startsWith('`')) out.push(<code key={k}>{t.slice(1, -1)}</code>)
    else if (t.startsWith('[')) { const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(t)!; out.push(<a key={k} href={mm[2]} target="_blank" rel="noopener noreferrer nofollow">{mm[1]}</a>) }
    else out.push(<em key={k}>{t.slice(1, -1)}</em>)
    last = m.index + t.length
  }
  if (last < s.length) out.push(s.slice(last))
  return out
}

export function Formatted({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/)
  return (
    <div className="lesson-body">
      {blocks.map((b, i) => {
        const lines = b.split('\n'), k = `b${i}`
        if (/^#{1,3}\s/.test(b)) { const lvl = b.match(/^#+/)![0].length; const c = inline(b.replace(/^#+\s*/, ''), k); return lvl === 1 ? <h2 key={k}>{c}</h2> : <h3 key={k}>{c}</h3> }
        if (lines.every(l => /^\s*[-*]\s+/.test(l))) return <ul key={k}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-*]\s+/, ''), `${k}${j}`)}</li>)}</ul>
        if (lines.every(l => /^\s*\d+[.)]\s+/.test(l))) return <ol key={k}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*\d+[.)]\s+/, ''), `${k}${j}`)}</li>)}</ol>
        if (lines.every(l => /^>\s?/.test(l))) return <blockquote key={k}>{inline(lines.map(l => l.replace(/^>\s?/, '')).join(' '), k)}</blockquote>
        return <p key={k}>{lines.map((l, j) => <React.Fragment key={j}>{j > 0 && <br />}{inline(l, `${k}${j}`)}</React.Fragment>)}</p>
      })}
    </div>
  )
}
