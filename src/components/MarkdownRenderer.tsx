import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert prose-purple max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                className="rounded-lg"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className="bg-purple-900/30 text-purple-300 px-1 py-0.5 rounded text-sm" {...props}>
                {children}
              </code>
            );
          },
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-white mb-6 border-b border-purple-500/30 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold text-purple-300 mb-4 mt-8">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-medium text-purple-400 mb-3 mt-6">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-gray-300 mb-4 leading-relaxed">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-2">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-300">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-400 my-4">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong className="text-purple-300 font-semibold">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="text-purple-400 italic">
              {children}
            </em>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-gray-600 rounded-lg">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-purple-900/30 text-purple-300 px-4 py-2 border border-gray-600 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="text-gray-300 px-4 py-2 border border-gray-600">
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