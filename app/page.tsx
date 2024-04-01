'use client';

import { useState } from 'react';
import React, { FormEvent } from 'react';
import { objectives, vertical, audience } from './options';

require('dotenv').config();

export default function Home() {
  const [url, setUrl] = useState('');
  const [variables, setVariables] = useState({
    url: '', 
    title: '', 
    description: '',
    objectives: '',
    audience: '',
    vertical: ''
  });
  const [chatGptResponse, setChatGptResponse] = useState(null);
  const [landingPageContent, setLandingPageContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // const [prompt, setPrompt] = useState('');

  const handleScrapeSubmit = async (event: { preventDefault: () => void; }) => {
    event.preventDefault();
    setIsLoading(true);
    // Call the scrape API

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      const title = data.metaTags.find((tag: { name: string; }) => tag.name === 'og:title')?.content || data.title;
      const description = data.metaTags.find((tag: { name: string; }) => tag.name === 'description')?.content;
      const og_description = data.metaTags.find((tag: { name: string; }) => tag.name === 'og:xdescription')?.content;
      setVariables({
        ...variables,
        url,
        title,
        description: og_description || description
      });
    } catch (error) {
      console.error("Failed to scrape the URL", error);
    }

    setIsLoading(false);
  };

  const handleChatGptSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    // setPrompt('');
    // setChatGptResponse(null);
    setLandingPageContent(null);
  
    const formData = new FormData(event.currentTarget);
    const formProps: { [key: string]: FormDataEntryValue } = Object.fromEntries(formData);
  
    const data = {
      ...variables,
      url: formProps.url?.toString() || variables.url,
      title: formProps.title?.toString() || variables.title,
      description: formProps.description?.toString() || variables.description,
      objectives: formProps.objectives?.toString() || variables.objectives,
      audience: formProps.audience?.toString() || variables.audience,
      vertical: formProps.vertical?.toString() || variables.vertical,
    };
  
    console.log(data); 

    try {
      const promptResponse = await fetch('/prompt.txt');
      if (!promptResponse.ok) {
        throw new Error(`Error fetching prompt: ${promptResponse.statusText}`);
      }
      const promptText = await promptResponse.text();
      let prompt = promptText
        .replaceAll("[url]", data.url)
        .replaceAll("[description]", data.description)
        .replaceAll("[objectives]", data.objectives)
        .replaceAll("[audience]", data.audience)
        .replaceAll("[vertical]", data.vertical)

      console.log(prompt);
      // setPrompt(prompt);

      // const apiKey = process.env.OPENAI_API_KEY; 
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Use your actual OpenAI API key here, and ensure it's kept secure
          // 'Authorization': `Bearer ${apiKey}`,
          // 'Authorization': `Bearer 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`,
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
        // Handling HTTP errors
        throw new Error(`HTTP error! status: ${response.status}`);
      } else {
        const result = await response.json();
        console.log("result", result)
        const LandingPageContent = JSON.parse(result.choices[0]?.message.content).LandingPageContent;
        console.log("LandingPageContent", LandingPageContent);
        // setChatGptResponse(content);
        setLandingPageContent(LandingPageContent);
        // return data; // This will be the JSON response from the OpenAI API
      }

    } catch (error) {
      console.error("Failed to process with ChatGPT", error);
    }

    setIsLoading(false);
  };

  const handleTextChange = (sectionIndex: string | number, key: string | number, value: any) => {
    // Create a copy of the landingPageContent
    const updatedContent = { ...landingPageContent };
    
    // Update the specific field in the section
    updatedContent.landingPageRequirements[sectionIndex][key] = value;
    
    // Set the updated object back to state
    setLandingPageContent(updatedContent);
  };

  return (
    <div>
      <form onSubmit={handleScrapeSubmit}>
        <label htmlFor="url">URL:</label>
        <input
          type="text"
          id="url"
          name="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit">Scrape</button>
      </form>

      {variables.title && (
        <form onSubmit={handleChatGptSubmit}>
          <div className="field">
            <label htmlFor="title">Advertiser:</label>
            <input
              type="text"
              id="title"
              name="title"
              value={variables.title}
              onChange={(e) => setVariables({ ...variables, title: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              name="description"
              value={variables.description}
              onChange={(e) => setVariables({ ...variables, description: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="description">Campaign Objectives:</label>
            <select
              id="objectives"
              name="objectives"
              className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              defaultValue=""
              onChange={(e) => setVariables({ ...variables, objectives: e.target.value })}
              >
              {objectives.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="description">Target Audience:</label>
            <select
              id="audience"
              name="audience"
              className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              defaultValue=""
              onChange={(e) => setVariables({ ...variables, audience: e.target.value })}
              >
              {audience.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="description">Business Vertical:</label>
            <select
              id="vertical"
              name="vertical"
              className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              defaultValue=""
              onChange={(e) => setVariables({ ...variables, vertical: e.target.value })}
              >
              {vertical.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div> 
          <button type="submit">Submit to ChatGPT</button>
        </form>
      )}

      {isLoading && <p>Loading...</p>}

      {landingPageContent && (
        <div>
          <h2>ChatGPT Response:</h2>
          <textarea>{JSON.stringify(landingPageContent)}</textarea>
          <form>
          {/* // landingPageContent.landingPageRequirements.map((section) =>  */}

          {
          landingPageContent.landingPageRequirements.map((section, index) => (
            <section key={section.sectionName}>
              <div><h3>{section.sectionName}</h3></div>
              <div className="field">
                <label htmlFor="textHeadline">Headline:</label>
                <textarea
                  id="textHeadline"
                  name="textHeadline"
                  value={section.textHeadline}
                  onChange={(e) => handleTextChange(index, 'textHeadline', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="secondaryHeadline">Secondary Headline:</label>
                <textarea
                  id="secondaryHeadline"
                  name="secondaryHeadline"
                  value={section.secondaryHeadline}
                  onChange={(e) => handleTextChange(index, 'secondaryHeadline', e.target.value)}
                />
              </div>
            </section>
          ))
          }
          </form>
           
        </div>
      )}
    </div>
  );
}
