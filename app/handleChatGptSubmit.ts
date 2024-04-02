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

      const apiKey = process.env.OPENAI_API_KEY; 
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Use your actual OpenAI API key here, and ensure it's kept secure
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