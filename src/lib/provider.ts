import { anthropic } from "@ai-sdk/anthropic";
import {
  LanguageModelV1,
  LanguageModelV1StreamPart,
  LanguageModelV1Message,
} from "@ai-sdk/provider";

const MODEL = "claude-haiku-4-5";

export class MockLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = "v1" as const;
  readonly provider = "mock";
  readonly modelId: string;
  readonly defaultObjectGenerationMode = "tool" as const;

  constructor(modelId: string) {
    this.modelId = modelId;
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractUserPrompt(messages: LanguageModelV1Message[]): string {
    // Find the last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === "user") {
        const content = message.content;
        if (Array.isArray(content)) {
          // Extract text from content parts
          const textParts = content
            .filter((part: any) => part.type === "text")
            .map((part: any) => part.text);
          return textParts.join(" ");
        } else if (typeof content === "string") {
          return content;
        }
      }
    }
    return "";
  }

  private getLastToolResult(messages: LanguageModelV1Message[]): any {
    // Find the last tool message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "tool") {
        const content = messages[i].content;
        if (Array.isArray(content) && content.length > 0) {
          return content[0];
        }
      }
    }
    return null;
  }

  private async *generateMockStream(
    messages: LanguageModelV1Message[],
    userPrompt: string
  ): AsyncGenerator<LanguageModelV1StreamPart> {
    // Count tool messages to determine which step we're on
    const toolMessageCount = messages.filter((m) => m.role === "tool").length;

    // Determine component type from the original user prompt
    const promptLower = userPrompt.toLowerCase();
    let componentType = "counter";
    let componentName = "Counter";

    if (promptLower.includes("form")) {
      componentType = "form";
      componentName = "ContactForm";
    } else if (promptLower.includes("testimonial")) {
      componentType = "testimonial";
      componentName = "Testimonial";
    } else if (promptLower.includes("card")) {
      componentType = "card";
      componentName = "Card";
    }

    // Step 1: Create component file
    if (toolMessageCount === 1) {
      const text = `I'll create a ${componentName} component for you.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_1`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: `/components/${componentName}.jsx`,
          file_text: this.getComponentCode(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 2: Enhance component
    if (toolMessageCount === 2) {
      const text = `Now let me enhance the component with better styling.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_2`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "str_replace",
          path: `/components/${componentName}.jsx`,
          old_str: this.getOldStringForReplace(componentType),
          new_str: this.getNewStringForReplace(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 3: Create App.jsx
    if (toolMessageCount === 0) {
      const text = `This is a static response. You can place an Anthropic API key in the .env file to use the Anthropic API for component generation. Let me create an App.jsx file to display the component.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(15);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_3`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: "/App.jsx",
          file_text: this.getAppCode(componentName),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 4: Final summary (no tool call)
    if (toolMessageCount >= 3) {
      const text = `Perfect! I've created:

1. **${componentName}.jsx** - A fully-featured ${componentType} component
2. **App.jsx** - The main app file that displays the component

The component is now ready to use. You can see the preview on the right side of the screen.`;

      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(30);
      }

      yield {
        type: "finish",
        finishReason: "stop",
        usage: {
          promptTokens: 50,
          completionTokens: 50,
        },
      };
      return;
    }
  }

  private getComponentCode(componentType: string): string {
    switch (componentType) {
      case "form":
        return `import React, { useState } from 'react';

const ContactForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="bg-zinc-950 rounded-2xl p-10 text-center border border-zinc-800">
        <div className="text-5xl mb-4">✦</div>
        <h3 className="text-xl font-bold text-white mb-2">Message received</h3>
        <p className="text-zinc-400 text-sm">We'll get back to you within 24 hours.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800">
      <div className="px-8 pt-8 pb-6 border-b border-zinc-800">
        <h2 className="text-2xl font-black text-white">Get in touch</h2>
        <p className="text-zinc-400 text-sm mt-1">We read every message.</p>
      </div>
      <form onSubmit={handleSubmit} className="p-8 space-y-5">
        <div>
          <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-2">Name</label>
          <input
            type="text" name="name" value={formData.name} onChange={handleChange} required
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-2">Email</label>
          <input
            type="email" name="email" value={formData.email} onChange={handleChange} required
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-2">Message</label>
          <textarea
            name="message" value={formData.message} onChange={handleChange} required rows={4}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
            placeholder="What's on your mind?"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Send message
        </button>
      </form>
    </div>
  );
};

export default ContactForm;`;

      case "testimonial":
        return `import React from 'react';

const Testimonial = ({
  quote = "This product completely changed how our team ships. The speed and clarity it brings to our workflow is unlike anything we've used before.",
  author = "Sarah Chen",
  role = "Head of Product",
  company = "Vercel",
  rating = 5,
}) => {
  return (
    <div className="relative bg-slate-950 rounded-2xl p-8 overflow-hidden">
      <div className="absolute top-4 right-6 text-9xl font-black text-slate-800 leading-none select-none">"</div>
      <div className="flex gap-1 mb-6">
        {Array.from({ length: rating }).map((_, i) => (
          <span key={i} className="text-amber-400 text-xl">★</span>
        ))}
      </div>
      <blockquote className="text-xl font-light text-slate-100 leading-relaxed mb-8 relative z-10">
        {quote}
      </blockquote>
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {author.charAt(0)}
        </div>
        <div>
          <div className="text-slate-100 font-semibold">{author}</div>
          <div className="text-slate-400 text-sm">{role} · {company}</div>
        </div>
      </div>
    </div>
  );
};

export default Testimonial;`;

      case "card":
        return `import React from 'react';

const Card = ({
  title = "Ship faster than ever",
  description = "A modern workflow built for teams that move quickly. From prototype to production in minutes.",
  tag = "New",
  actions
}) => {
  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
      <div className="h-1.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
      <div className="p-7">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-fuchsia-400 mb-4">{tag}</span>
        <h3 className="text-2xl font-black text-white mb-3 leading-tight">{title}</h3>
        <p className="text-zinc-400 leading-relaxed mb-6">{description}</p>
        {actions && <div>{actions}</div>}
      </div>
    </div>
  );
};

export default Card;`;

      default:
        return `import { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center bg-zinc-950 rounded-2xl p-10 border border-zinc-800">
      <span className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-6">Counter</span>
      <div className="text-8xl font-black text-white tabular-nums mb-8 leading-none">{count}</div>
      <div className="flex gap-3">
        <button
          onClick={() => setCount(c => c - 1)}
          className="w-12 h-12 rounded-full border border-zinc-700 text-zinc-300 text-xl font-bold hover:border-zinc-400 hover:text-white transition-colors"
        >
          −
        </button>
        <button
          onClick={() => setCount(0)}
          className="px-5 h-12 rounded-full border border-zinc-700 text-zinc-400 text-sm font-medium hover:border-zinc-400 hover:text-white transition-colors"
        >
          Reset
        </button>
        <button
          onClick={() => setCount(c => c + 1)}
          className="w-12 h-12 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xl font-bold transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default Counter;`;
    }
  }

  private getOldStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "    setSent(true);";
      case "testimonial":
        return "        {Array.from({ length: rating }).map((_, i) => (";
      case "card":
        return '        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-fuchsia-400 mb-4">{tag}</span>';
      default:
        return '          Reset';
    }
  }

  private getNewStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "    setSent(true);\n    setFormData({ name: '', email: '', message: '' });";
      case "testimonial":
        return "        {Array.from({ length: rating }).map((_, i) => (";
      case "card":
        return '        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-fuchsia-400 mb-4">{tag}</span>';
      default:
        return '          Reset';
    }
  }

  private getAppCode(componentName: string): string {
    if (componentName === "Card") {
      return `import Card from '@/components/Card';

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <Card
          actions={
            <button className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm">
              Get started
            </button>
          }
        />
      </div>
    </div>
  );
}`;
    }

    if (componentName === "Testimonial") {
      return `import Testimonial from '@/components/Testimonial';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <Testimonial />
      </div>
    </div>
  );
}`;
    }

    return `import ${componentName} from '@/components/${componentName}';

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <${componentName} />
      </div>
    </div>
  );
}`;
  }

  async doGenerate(
    options: Parameters<LanguageModelV1["doGenerate"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doGenerate"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);

    // Collect all stream parts
    const parts: LanguageModelV1StreamPart[] = [];
    for await (const part of this.generateMockStream(
      options.prompt,
      userPrompt
    )) {
      parts.push(part);
    }

    // Build response from parts
    const textParts = parts
      .filter((p) => p.type === "text-delta")
      .map((p) => (p as any).textDelta)
      .join("");

    const toolCalls = parts
      .filter((p) => p.type === "tool-call")
      .map((p) => ({
        toolCallType: "function" as const,
        toolCallId: (p as any).toolCallId,
        toolName: (p as any).toolName,
        args: (p as any).args,
      }));

    // Get finish reason from finish part
    const finishPart = parts.find((p) => p.type === "finish") as any;
    const finishReason = finishPart?.finishReason || "stop";

    return {
      text: textParts,
      toolCalls,
      finishReason: finishReason as any,
      usage: {
        promptTokens: 100,
        completionTokens: 200,
      },
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {
          maxTokens: options.maxTokens,
          temperature: options.temperature,
        },
      },
    };
  }

  async doStream(
    options: Parameters<LanguageModelV1["doStream"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doStream"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);
    const self = this;

    const stream = new ReadableStream<LanguageModelV1StreamPart>({
      async start(controller) {
        try {
          const generator = self.generateMockStream(options.prompt, userPrompt);
          for await (const chunk of generator) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return {
      stream,
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {},
      },
      rawResponse: { headers: {} },
    };
  }
}

export function getLanguageModel() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    console.log("No ANTHROPIC_API_KEY found, using mock provider");
    return new MockLanguageModel("mock-claude-sonnet-4-0");
  }

  return anthropic(MODEL);
}
