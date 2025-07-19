// pages/api/work.ts
import type { NextApiRequest, NextApiResponse } from 'next';

/* ------------------------------------------------------------- */
/*  Notion secrets – hard-coded for now (swap to env later)      */
/* ------------------------------------------------------------- */
const NOTION_TOKEN = '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';
const NOTION_DB_ID = '1e02b063-3af6-8013-a92a-d35724757891';
const NOTION_VER   = '2022-06-28';

/* ------------------------------------------------------------- */
/*  API handler                                                  */
/* ------------------------------------------------------------- */
/* …imports & secrets unchanged … */

export default async function handler(
    _req: NextApiRequest,
    res : NextApiResponse,
  ) {
    try {
      const notionRes = await fetch(
        `https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`,
        {
          method : 'POST',
          headers: {
            Authorization   : `Bearer ${NOTION_TOKEN}`,
            'Content-Type'  : 'application/json',
            'Notion-Version': NOTION_VER,
          },
          body: JSON.stringify({ page_size: 100 }),
        },
      );
  
      if (!notionRes.ok) {
        const txt = await notionRes.text();
        console.error('❌ Notion error\n', txt);
        return res.status(502).json({ error: 'notion', detail: txt });
      }
  
      const { results } = (await notionRes.json()) as { results: any[] };
  
      const items = results
        .map((page) => {
          const props = page.properties;
          const title = props?.Title?.title?.[0]?.plain_text;
          const body  = props?.Body?.rich_text?.map((t: any) => t.plain_text).join('') ?? '';
          const kind  = props?.['Work Type']?.multi_select?.[0]?.name;
  
          /* --------- collect images (any Files prop) --------------- */
          const images: string[] = [];
          for (const val of Object.values(props)) {
            if ((val as any).type === 'files') {
              (val as any).files.forEach((f: any) => {
                const url = f.type === 'file' ? f.file.url : f.external?.url;
                if (url) images.push(url);
              });
            }
          }
  
          if (!title || !kind) return null;
  
          return {
            /*  ✅ use the *whole* page-id (sans dashes) – 32 chars is fine */
            id     : page.id.replace(/-/g, ''),
            title,
            kind,
            excerpt: body.slice(0, 120) + (body.length > 120 ? '…' : ''),
            body,
            images,
          };
        })
        .filter(Boolean);
  
      return res.status(200).json(items);
    } catch (err) {
      console.error('💥 /api/work failed', err);
      return res.status(500).json({ error: 'internal' });
    }
  }
  