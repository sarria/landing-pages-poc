import type { NextApiRequest, NextApiResponse } from 'next';
// import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

interface RequestData {
  url: string;
  description: string;
  objectives: string;
  audience: string;
  vertical: string;
}

interface ResponseData {
  choices?: Array<{ message: { content: string } }>;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === 'POST') {
    const data: RequestData = req.body;
	console.log("data:", data)
	let filePath = "";
	let prompt = "";

    try {
		// const promptResponse = await fetch('/prompt.txt');
		// if (!promptResponse.ok) {
		// 	throw new Error(`Error fetching prompt: ${promptResponse.statusText}`);
		// }
		// const promptText = await promptResponse.text();

		filePath = path.join(process.cwd(), 'public', 'prompt.txt');
		console.log("filePath:", filePath);
		const promptText = fs.readFileSync(filePath, 'utf8');

		prompt = promptText
			.replaceAll("[url]", data.url)
			.replaceAll("[description]", data.description)
			.replaceAll("[objectives]", data.objectives)
			.replaceAll("[audience]", data.audience)
			.replaceAll("[vertical]", data.vertical)

	} catch (error) {
		// console.error("Failed to process with ChatGPT", error);
		res.status(500).json({ error: "Error getting prompt.txt: " + filePath });
    }
	
	try {
		const apiKey = process.env.OPENAI_API_KEY;
		// console.log("apiKey", apiKey, process.env);
		console.log("prompt:", prompt);		
				
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: "gpt-4", // Specify the model you want to use
				messages: [
				{
					role: "user",
					content: prompt
				}
				],
				// temperature: 0.7, // Adjust for creativity
				// max_tokens: 256, // Adjust for length of completion
				// top_p: 1.0,
				// frequency_penalty: 0.0,
				// presence_penalty: 0.0,
			}),
		});
		
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		
		const result = await response.json();
		res.status(200).json(result);
    } catch (error) {
		res.status(500).json({ error: "Failed to process with ChatGPT: " + error.message });
    }
  } else {
	res.setHeader('Allow', ['POST']);
	res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
