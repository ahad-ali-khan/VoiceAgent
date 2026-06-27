# VoiceAgent

You speak. It figures out what to do and does it.

VoiceAgent takes your voice input, classifies what kind of task you're 
asking for, picks the right tools, and executes them one step at a time, 
showing its reasoning as it works. No typing, no configuring, no picking 
a mode manually. Just talk.

## Demo

[Live demo](https://voiceagent.vercel.app)

![VoiceAgent demo](./demo.gif)

## What it can do

Depending on what you say, the agent routes itself into one of three modes:

**Web search** — ask for information, recent news, research summaries, 
anything that needs live data. The agent searches, reads, and comes back 
with a structured answer.

**File analysis** — upload a document and ask questions about it by 
voice. The agent reads the file and answers based on its contents.

**Multi-step planning** — give it a goal. It breaks the goal into 
subtasks, works through each one, and gives you a complete plan with 
reasoning at every step.

The mode is chosen automatically based on what you ask. You don't pick it.

## How to use it

You need a free Gemini API key from aistudio.google.com. When you open 
the app for the first time it will ask for it. Paste it in, and that is 
the only setup you will ever do.

After that: hit the mic, speak your task, hit the mic again to stop. 
Watch the agent work.

## Running locally

```bash
git clone https://github.com/YOURUSERNAME/voiceagent
cd voiceagent
npm install
npm run dev
```

Open http://localhost:5173 in Chrome or Edge. Firefox does not support 
the Web Speech API so it will not work there.

## Browser support

Chrome and Edge work fully. Safari works with some limitations. 
Firefox is not supported due to missing Web Speech API implementation.

## File analysis limitations

Files are read client-side as plain text. Supported formats are .txt, 
.md, .json, and .csv up to 2MB. Scanned PDFs and .docx files are not 
supported.

## Tech

React, TypeScript, Tailwind CSS, Vite, Gemini 2.5 Flash, 
Web Speech API

## Deploying

Connect the repo to Vercel. No environment variables needed since 
the API key is handled client-side by the user. It deploys as a 
static site.