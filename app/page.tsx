'use client';

import { useState } from 'react';
import React, { FormEvent } from 'react';
import { objectives, vertical, audience } from './options';

interface LandingPageRequirement {
  [key: string]: any; // Ideally, specify a more precise type instead of any
}

interface LandingPageContent {
  landingPageRequirements: LandingPageRequirement[];
}


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
  // const [landingPageContent, setLandingPageContent] = useState({landingPageRequirements:[]});
  const [landingPageContent, setLandingPageContent] = useState<LandingPageContent | null>(null);
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
    setLandingPageContent({landingPageRequirements:[]});
  
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
  
    try {
      const res = await fetch('/api/chatGpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const result = await res.json();
      
      console.log("result from chatGpt API >>> ", result)
      const LandingPageContent = JSON.parse(result.choices[0]?.message.content).LandingPageContent;
      console.log("LandingPageContent >>> ", LandingPageContent);
      setLandingPageContent(LandingPageContent);

    } catch (error) {
      console.error("Error submitting to ChatGPT:", error);
    }    

    setIsLoading(false);
  };

  const handleTextChange = (sectionIndex: number, key: string, value: any) => {
    // Ensure landingPageContent is not null
    if (!landingPageContent) return;
  
    // Deep clone or create a new updated object in an immutable way
    const updatedContent: LandingPageContent = {
      ...landingPageContent,
      landingPageRequirements: landingPageContent.landingPageRequirements.map((requirement, index) =>
        index === sectionIndex ? { ...requirement, [key]: value } : requirement
      ),
    };
  
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

      {landingPageContent?.landingPageRequirements && (
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
