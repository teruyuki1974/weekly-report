"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-body space-y-3 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold border-b border-zinc-200 dark:border-zinc-700 pb-1 mt-4 mb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold border-b border-zinc-200 dark:border-zinc-700 pb-1 mt-3 mb-2 text-indigo-600 dark:text-indigo-400">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mt-2 mb-1">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1 my-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1 my-2">
              {children}
            </ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-zinc-100 dark:bg-zinc-800 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded text-xs font-mono">
                {children}
              </code>
            ) : (
              <pre className="bg-zinc-900 text-zinc-100 p-3 rounded-md overflow-x-auto my-2 text-xs font-mono">
                <code>{children}</code>
              </pre>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-500 pl-3 italic text-zinc-600 dark:text-zinc-400 my-2">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700 border border-zinc-200 dark:border-zinc-700">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-left text-xs font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-1.5 text-xs border-t border-zinc-200 dark:border-zinc-700">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
