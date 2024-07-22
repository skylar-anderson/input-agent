import OpenAI from 'openai';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

console.log('background is running')

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'COUNT') {
    console.log('background has received a message from popup, and count is ', request?.count)
  }
})

const menuId = 'promptMenu';

chrome.contextMenus.create({
  id: menuId,
  title: 'Prompt GitHub Agent',
  contexts: ['selection']
});

const systemMessage:OpenAI.Chat.Completions.ChatCompletionMessageParam = {
  role: 'system',
  content: `
    This is not a conversation. Do NOT respond with a conversational tone. Instead, simply respond to the user message with the requested data or answer. Use incomplete sentences if necessary.
    
    # Example:
    Prompt: "handle of last committer to primer/design"
    Good answer: "@camertron"
    Bad answer: "The handle of the last committer to primer/design is camertron."
  `
}

import {
  runFunction,
  availableFunctions,
  FunctionName,
} from "./functions";

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = Object.keys(availableFunctions).map((f) => {
  return {
    type: "function",
    function: availableFunctions[f as FunctionName].meta,
  } as OpenAI.Chat.Completions.ChatCompletionTool;
});

const MODEL = 'gpt-4o';

function signatureFromArgs(args: Record<string, unknown>) {
  return Object.entries(args)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
}

async function streamCompletion(prompt:string, tabId:number, currentURL: string) {
  let context: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    systemMessage,
    {
      role: "user",
      content: `
        The user is currently looking at the following URL: ${currentURL}
        Prompt:
        ${prompt}
      `,
    },
  ];

  async function run() {
    const response = await openai.chat.completions.create({
      model: MODEL,
      stream: false,
      messages: context,
      tools,
      tool_choice: "auto",
    });
    const responseChoice = response.choices[0];
    const toolCalls = responseChoice.message.tool_calls;

    context.push(responseChoice.message);

    if (toolCalls?.length) {
      const toolCall = toolCalls[0];
      const args = JSON.parse(toolCall.function.arguments);
      const toolResult = await runFunction(toolCall.function.name, args);
      const signature = `${toolCall.function.name}(${signatureFromArgs(
        args,
      )})`;
      //hydrationSources.push(signature);
      context.push({
        role: "tool",
        content: JSON.stringify(toolResult),
        tool_call_id: toolCall.id,
      });

      return run();
    }
  }

  await run();
  const assistantResponse = context[context.length - 1].content as string;

  //stream.on('content', (text) => {
    chrome.tabs.sendMessage(tabId, {
      action: "replaceSelection",
      text: assistantResponse
    });
  //})
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === menuId && tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "executeFunctionAndReturnResult"}, async (response) => {
      console.log(response);
      const prompt = response.result as string;
      if (!tab || !tab.id) return;
      if (prompt) {
        streamCompletion(prompt, tab.id, tab.url || '');
      } else {
        console.log('No selection found. Select some text to prompt the GitHub Agent.');
      }
    });
  }
});
