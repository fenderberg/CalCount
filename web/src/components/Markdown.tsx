import { Fragment, type ReactNode } from 'react';

/**
 * Minimal, dependency-free renderer for the constrained markdown the AI
 * produces: headings (#, ##, ###), bullet lists (-, *), bold (**x**) and
 * italic (_x_ / *x*) inline. Anything else is shown as plain text.
 */
export function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks = parseBlocks(text);
  return (
    <div className={className}>
      {blocks.map((block, index) => (
        <Block key={index} block={block} first={index === 0} />
      ))}
    </div>
  );
}

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'paragraph'; lines: string[] };

function parseBlocks(text: string): Block[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'paragraph', lines: paragraph });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ type: 'list', items: list });
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (line.trim() === '') {
      flushParagraph();
      flushList();
    } else if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] });
    } else if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
    } else {
      flushList();
      paragraph.push(line.trim());
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

function Block({ block, first }: { block: Block; first: boolean }) {
  const top = first ? '' : 'mt-3';
  if (block.type === 'heading') {
    const size = block.level === 1 ? 'text-base' : 'text-sm';
    return (
      <p className={`${first ? '' : 'mt-4'} ${size} font-extrabold text-ink`}>
        <Inline text={block.text} />
      </p>
    );
  }
  if (block.type === 'list') {
    return (
      <ul className={`${top} space-y-1`}>
        {block.items.map((item, index) => (
          <li key={index} className="flex gap-2">
            <span aria-hidden className="mt-[2px] shrink-0">
              •
            </span>
            <span>
              <Inline text={item} />
            </span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p className={top}>
      {block.lines.map((line, index) => (
        <Fragment key={index}>
          {index > 0 && <br />}
          <Inline text={line} />
        </Fragment>
      ))}
    </p>
  );
}

function Inline({ text }: { text: string }): ReactNode {
  // Split on **bold**, then _italic_ / *italic* within each remaining segment.
  const nodes: ReactNode[] = [];
  const boldRe = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  while ((match = boldRe.exec(text)) !== null) {
    if (match.index > last) nodes.push(<Italic key={key++} text={text.slice(last, match.index)} />);
    nodes.push(
      <strong key={key++} className="font-bold text-ink">
        <Italic text={match[1]} />
      </strong>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(<Italic key={key++} text={text.slice(last)} />);
  return <>{nodes}</>;
}

function Italic({ text }: { text: string }): ReactNode {
  const italicRe = /(?:_([^_]+)_|(?<![*\w])\*([^*]+)\*(?!\*))/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  while ((match = italicRe.exec(text)) !== null) {
    if (match.index > last) nodes.push(<Fragment key={key++}>{text.slice(last, match.index)}</Fragment>);
    nodes.push(<em key={key++}>{match[1] ?? match[2]}</em>);
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(<Fragment key={key++}>{text.slice(last)}</Fragment>);
  return <>{nodes}</>;
}
