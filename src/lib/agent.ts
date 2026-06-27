import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ThoughtStep {
  id: string;
  message: string;
  status: 'pending' | 'running' | 'success' | 'error';
  details?: string;
  timestamp: string;
}

export type AgentMode = 'Search' | 'File' | 'Multi-step';

export interface AgentOptions {
  apiKey: string;
  prompt: string;
  fileContent?: string;
  fileName?: string;
  onStep: (steps: ThoughtStep[]) => void;
  onModeSelected: (mode: AgentMode) => void;
  onResult: (result: string) => void;
}

// Generate unique ID for steps
const genId = () => Math.random().toString(36).substring(2, 9);

export async function runVoiceAgent(options: AgentOptions) {
  const { apiKey, prompt, fileContent, fileName, onStep, onModeSelected, onResult } = options;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const steps: ThoughtStep[] = [];
  
  const addStep = (message: string, status: ThoughtStep['status'] = 'running', details?: string) => {
    const newStep: ThoughtStep = {
      id: genId(),
      message,
      status,
      details,
      timestamp: new Date().toLocaleTimeString(),
    };
    steps.push(newStep);
    onStep([...steps]);
    return newStep.id;
  };

  const updateStep = (id: string, updates: Partial<ThoughtStep>) => {
    const idx = steps.findIndex(s => s.id === id);
    if (idx !== -1) {
      steps[idx] = { ...steps[idx], ...updates };
      onStep([...steps]);
    }
  };

  try {
    // Step 1: Classification & Intent Detection
    const classStepId = addStep('Classifying voice task...');
    
    // Formulate a quick classification request
    const classifierModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const classificationPrompt = `
      Analyze this user request: "${prompt}"
      The user may also have uploaded a file. File Uploaded: ${fileContent ? `Yes (Name: ${fileName})` : 'No'}.
      
      Classify this task into one of the following modes:
      1. "Search" - Web search and summarization (news, research, lookup, current events, facts).
      2. "File" - File analysis (questions about the uploaded file, summary of the file).
      3. "Multi-step" - Complex tasks requiring breaking down into parts (e.g. write a plan, create a schedule, multi-step brainstorm, math, logic).
      
      Respond only with this JSON structure:
      {
        "mode": "Search" | "File" | "Multi-step",
        "reasoning": "Brief explanation of why this mode was selected",
        "searchQuery": "If Search mode, specify the search query to use, else empty string",
        "subtasks": ["If Multi-step, list of 2-5 detailed subtasks, else empty array"]
      }
    `;

    const classificationResult = await classifierModel.generateContent(classificationPrompt);
    const classificationText = classificationResult.response.text();
    let classification: {
      mode: AgentMode;
      reasoning: string;
      searchQuery: string;
      subtasks: string[];
    };

    try {
      classification = JSON.parse(classificationText);
    } catch (e) {
      // Fallback
      classification = {
        mode: fileContent ? 'File' : 'Search',
        reasoning: 'Fallback classification due to JSON parsing error.',
        searchQuery: prompt,
        subtasks: []
      };
    }

    updateStep(classStepId, {
      status: 'success',
      details: classification.reasoning
    });

    // Notify UI of selected mode
    onModeSelected(classification.mode);
    addStep(`Mode Selected: ${classification.mode === 'File' ? 'File Analysis' : classification.mode === 'Search' ? 'Web Search & Summarize' : 'Multi-step Task Runner'}`, 'success');

    // Handle each mode
    if (classification.mode === 'Search') {
      const searchVal = classification.searchQuery || prompt;
      const searchStepId = addStep(`Searching for: "${searchVal}"...`);

      // Initialize Gemini with Search Grounding
      const agentModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        tools: [{ googleSearch: {} } as any] // Using Google Search Grounding tool
      });

      const response = await agentModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: `Answer this query using web search results: ${searchVal}` }] }]
      });

      updateStep(searchStepId, {
        status: 'success',
        details: 'Retrieved google search grounding results.'
      });

      const readStepId = addStep('Reading results and generating summary...');
      const responseText = response.response.text();
      
      // Extract grounding sources if available
      let groundingInfo = '';
      const groundingMetadata = response.response.candidates?.[0]?.groundingMetadata;
      if (groundingMetadata?.groundingChunks) {
        const chunks = groundingMetadata.groundingChunks;
        groundingInfo = '\n\n**Sources:**\n' + chunks
          .map((chunk: any, i: number) => {
            const title = chunk.web?.title || 'Grounding Source';
            const uri = chunk.web?.uri;
            return uri ? `[${i + 1}] [${title}](${uri})` : `[${i + 1}] ${title}`;
          })
          .join('\n');
      }

      updateStep(readStepId, {
        status: 'success'
      });

      onResult(responseText + groundingInfo);

    } else if (classification.mode === 'File') {
      if (!fileContent) {
        addStep('No file provided for File Analysis mode.', 'error');
        onResult('Please upload a file and ask your question again.');
        return;
      }

      const fileStepId = addStep(`Reading file: "${fileName}"...`);
      updateStep(fileStepId, {
        status: 'success',
        details: `Loaded ${fileContent.length} characters of content.`
      });

      const analysisStepId = addStep('Analyzing content and answering question...');
      
      const agentModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash'
      });

      const filePrompt = `
        You are analyzing the following file:
        --- FILE NAME: ${fileName} ---
        --- FILE CONTENT START ---
        ${fileContent}
        --- FILE CONTENT END ---
        
        Question: ${prompt}
        
        Provide a detailed and clean summary or answer to the question based on the content above.
      `;

      const response = await agentModel.generateContent(filePrompt);
      
      updateStep(analysisStepId, {
        status: 'success'
      });

      onResult(response.response.text());

    } else {
      // Multi-step task runner
      addStep('Creating execution plan...', 'success', `Plan:\n${classification.subtasks.map((t, idx) => `${idx + 1}. ${t}`).join('\n')}`);
      
      const subtaskResults: string[] = [];

      for (let i = 0; i < classification.subtasks.length; i++) {
        const subtask = classification.subtasks[i];
        const subStepId = addStep(`Executing subtask [${i + 1}/${classification.subtasks.length}]: ${subtask}...`);
        
        const agentModel = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash'
        });

        // Run subtask
        const subtaskPrompt = `
          Task: ${prompt}
          Current Subtask to run: ${subtask}
          Previous subtask context: ${subtaskResults.join('\n')}
          
          Execute this subtask and describe your findings or results.
        `;

        const response = await agentModel.generateContent(subtaskPrompt);
        const subtaskResult = response.response.text();
        subtaskResults.push(`Subtask [${i+1}] Result: ${subtaskResult}`);

        updateStep(subStepId, {
          status: 'success',
          details: subtaskResult.substring(0, 150) + (subtaskResult.length > 150 ? '...' : '')
        });
      }

      const consolidationStepId = addStep('Consolidating final results...', 'running');
      
      const agentModel = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash'
      });

      const finalPrompt = `
        You have executed a multi-step task for: "${prompt}"
        Here are the execution results of each subtask:
        ${subtaskResults.join('\n\n')}
        
        Synthesize these results into a beautiful, cohesive final summary/report that resolves the user's request fully.
      `;

      const response = await agentModel.generateContent(finalPrompt);
      
      updateStep(consolidationStepId, {
        status: 'success'
      });

      onResult(response.response.text());
    }

  } catch (err: any) {
    addStep(`Error: ${err.message || err}`, 'error');
    onResult(`An error occurred: ${err.message || 'Unknown error'}`);
  }
}
