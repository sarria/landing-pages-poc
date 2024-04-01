import { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';

// interface DataResponse {
//   title: string;
//   description: string | null;
// }

export type DataResponse = {
	url?: string | null;
  title?: string | null;
  metaTags?: Array<{
    name?: string | null;
    content?: string | null;
  }> | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DataResponse | { error: string }>
) {
  if (req.method === 'POST') {
    const { url } = req.body;

    if (typeof url !== 'string') {
      res.status(400).json({ error: 'URL must be a string' });
      return;
    }

    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const title = await page.title();

      // Function to scroll to the bottom of the page
      // await autoScroll(page);		
    
      // Extract meta tags information
      const metaTags = await page.evaluate(() => {
        const tags = Array.from(document.getElementsByTagName('meta'));
        return tags.map(tag => {
            return {
              name: tag.getAttribute('name') || tag.getAttribute('property') || null,
              content: tag.getAttribute('content'),
            };
        })
        .filter(tag => tag.name); // Filter out tags without name and property
      });	


      await browser.close();

      res.status(200).json({
        url,
        title,
        metaTags
      });
    } catch (error) {
      console.error('Error fetching page data:', error);
      res.status(500).json({ error: "Failed to fetch the URL" });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
