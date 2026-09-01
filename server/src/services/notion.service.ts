import { createChildLogger } from '@/utils/logger';
import { AppError } from '@/errors';

const logger = createChildLogger('notion');
const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';
const MAX_DEPTH = 4;

interface NotionRichText {
  plain_text?: string;
  href?: string | null;
  annotations?: { bold?: boolean; italic?: boolean; code?: boolean; strikethrough?: boolean };
}

interface NotionBlock {
  id?: string;
  type: string;
  has_children?: boolean;
  [key: string]: unknown;
}

export const extractPageId = (url: string): string | null => {
  const cleaned = String(url || '').replace(/-/g, '');
  const m = cleaned.match(/([a-f0-9]{32})/i);
  return m ? m[1] : null;
};

const richTextToMarkdown = (rt: NotionRichText[] = []): string => {
  return rt
    .map((t) => {
      let text = t.plain_text || '';
      const a = t.annotations || {};
      if (t.href) text = `[${text}](${t.href})`;
      if (a.code) text = `\`${text}\``;
      if (a.bold) text = `**${text}**`;
      if (a.italic) text = `*${text}*`;
      if (a.strikethrough) text = `~~${text}~~`;
      return text;
    })
    .join('');
};

const fetchNotion = async (path: string, token: string): Promise<Record<string, unknown>> => {
  const res = await fetch(`${NOTION_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
    },
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new AppError('Your Notion integration token is invalid or lacks access to this page.', 400, {
        code: 'NOTION_AUTH',
      });
    }
    if (res.status === 404) {
      throw new AppError('This Notion page was not found, or it is not shared with your integration.', 404, {
        code: 'NOTION_NOT_FOUND',
      });
    }
    const body = await res.json().catch(() => ({}));
    const message = (body as { message?: string }).message;
    throw new AppError(message ? `Notion API error: ${message}` : `Notion API error (${res.status})`, 502, {
      code: 'NOTION_API_ERROR',
    });
  }

  return res.json() as Promise<Record<string, unknown>>;
};

const fetchBlockChildren = async (token: string, blockId: string): Promise<NotionBlock[]> => {
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams({ page_size: '100' });
    if (cursor) params.set('start_cursor', cursor);
    const data = await fetchNotion(`/blocks/${blockId}/children?${params}`, token) as {
      results?: NotionBlock[];
      has_more?: boolean;
      next_cursor?: string | null;
    };
    blocks.push(...(data.results || []));
    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return blocks;
};

const blockToMarkdown = async (token: string, block: NotionBlock, depth = 0): Promise<string> => {
  const type = block.type;
  const data = (block[type] as Record<string, unknown>) || {};
  const richText = richTextToMarkdown(data.rich_text as NotionRichText[]);

  let out = '';
  switch (type) {
    case 'heading_1':
      out = `# ${richText}`;
      break;
    case 'heading_2':
      out = `## ${richText}`;
      break;
    case 'heading_3':
      out = `### ${richText}`;
      break;
    case 'bulleted_list_item':
      out = `- ${richText}`;
      break;
    case 'numbered_list_item':
      out = `1. ${richText}`;
      break;
    case 'to_do':
      out = `- [${data.checked ? 'x' : ' '}] ${richText}`;
      break;
    case 'quote':
    case 'callout':
      out = `> ${richText}`;
      break;
    case 'divider':
      out = '---';
      break;
    case 'code': {
      const code = ((data.rich_text as NotionRichText[]) || []).map((t) => t.plain_text || '').join('');
      const lang = (data.language as string) || '';
      out = `\`\`\`${lang}\n${code}\n\`\`\``;
      break;
    }
    case 'image': {
      const file = data.file as { url?: string } | undefined;
      const external = data.external as { url?: string } | undefined;
      const src = file?.url || external?.url;
      out = src ? `![image](${src})` : '';
      break;
    }
    case 'bookmark': {
      const url = (data.url as string) || richText;
      const caption = ((data.caption as NotionRichText[]) || []).map((t) => t.plain_text || '').join('') || url;
      out = url ? `[${caption}](${url})` : '';
      break;
    }
    case 'table': {
      const children = block.has_children ? await fetchBlockChildren(token, block.id as string) : [];
      const rows = children
        .filter((c) => c.type === 'table_row')
        .map((c) => {
          const cells = ((c.table_row as { cells?: NotionRichText[][] })?.cells) || [];
          return cells.map((cell) => richTextToMarkdown(cell).replace(/\|/g, '\\|'));
        });
      if (rows.length) {
        const width = Math.max(...rows.map((r) => r.length));
        const pad = (r: string[]) => `${r.join(' | ')}${width > r.length ? ' |'.repeat(width - r.length) : ''}`;
        out = [
          `| ${pad(rows[0])} |`,
          `|${rows[0].map(() => ' --- ').join('|')}|`,
          ...rows.slice(1).map((r) => `| ${pad(r)} |`),
        ].join('\n');
      }
      break;
    }
    case 'child_page':
    case 'child_database':
    case 'unsupported':
      out = '';
      break;
    default:
      out = richText;
      break;
  }

  // Nested children (lists, toggles, paragraphs with children)
  if (block.has_children && !['table', 'child_page', 'child_database'].includes(type) && depth < MAX_DEPTH) {
    const children = await fetchBlockChildren(token, block.id as string);
    const childTexts = (
      await Promise.all(children.map((c) => blockToMarkdown(token, c, depth + 1)))
    ).filter(Boolean);
    if (childTexts.length) {
      const joined = childTexts.join('\n');
      const nested = ['bulleted_list_item', 'numbered_list_item', 'to_do', 'toggle'].includes(type)
        ? joined
            .split('\n')
            .map((l) => `  ${l}`)
            .join('\n')
        : joined;
      out = out ? `${out}\n${nested}` : nested;
    }
  }

  return out.trim();
};

const extractTitle = (page: Record<string, unknown>): string | null => {
  const properties = (page.properties as Record<string, unknown>) || {};
  for (const prop of Object.values(properties)) {
    const title = (prop as { title?: NotionRichText[] })?.title;
    if (Array.isArray(title) && title.length && title[0]?.plain_text) {
      return title[0].plain_text;
    }
  }
  return null;
};

export const importNotionPage = async (
  token: string,
  url: string
): Promise<{ title: string; markdown: string }> => {
  const pageId = extractPageId(url);
  if (!pageId) {
    throw new AppError("That doesn't look like a Notion page link.", 400, { code: 'INVALID_NOTION_URL' });
  }

  logger.info({ pageId }, 'Notion import started');

  let title = 'Notion page';
  try {
    const page = await fetchNotion(`/pages/${pageId}`, token);
    title = extractTitle(page as Record<string, unknown>) || title;
  } catch (err) {
    if (err instanceof AppError) throw err;
  }

  const blocks = await fetchBlockChildren(token, pageId);
  const parts = (
    await Promise.all(blocks.map((b) => blockToMarkdown(token, b, 0)))
  ).filter(Boolean);

  const markdown = parts.join('\n\n').trim();
  if (!markdown) {
    throw new AppError('This Notion page has no content to import.', 422, { code: 'NOTION_EMPTY' });
  }

  logger.info({ pageId, chars: markdown.length }, 'Notion import complete');
  return { title, markdown };
};
