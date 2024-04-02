import { NextApiRequest, NextApiResponse } from 'next';
// import chromium from 'chrome-aws-lambda';
// import puppeteer from 'puppeteer-core';
// import chromium from '@sparticuz/chromium'

// import chromium from '@sparticuz/chromium-min'
// import puppeteer from 'puppeteer-core'
const chromium = require('@sparticuz/chromium-min');
const puppeteer = require('puppeteer-core');

export type DataResponse = {
	url?: string | null;
  title?: string | null;
  metaTags?: Array<{
    name?: string | null;
    content?: string | null;
  }> | null;
};

const getBrowserOptions = async () => {
  console.log("process.platform", process.platform, chromium.headless)
  return process.env.ENVIRONMENT === 'local'
    ? {
        args: chromium.args,
        executablePath:
            process.platform === 'win32'
                ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
                : process.platform === 'linux'
                ? '/usr/bin/google-chrome'
                : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless: true, // This is already a boolean
      }
    : {
        args: chromium.args,
        executablePath: await chromium.executablePath(process.env.CHROMIUM_PATH),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,          
      }
}


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
      const browserOptions = await getBrowserOptions()
      const browser = await puppeteer.launch(browserOptions)
      const page = await browser.newPage();
      // await page.goto(url, { waitUntil: 'domcontentloaded' });
      // await page.goto(url, { waitUntil: 'networkidle2' });
      await page.goto(url, { waitUntil: 'networkidle0' });

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
      res.status(500).json({ error: "Failed to fetch the URL:\n" + (error as Error).message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
