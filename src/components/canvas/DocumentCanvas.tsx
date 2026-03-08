import ReactMarkdown from "react-markdown";

export default function DocumentCanvas({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="rounded-lg bg-surface-2 h-6 w-3/4" />
        <div className="rounded-lg bg-surface-2 h-4 w-full" />
        <div className="rounded-lg bg-surface-2 h-4 w-5/6" />
        <div className="rounded-lg bg-surface-2 h-4 w-full" />
      </div>
    );
  }

  return (
    <div className="prose prose-invert prose-sm max-w-none [&_p]:my-1.5 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-surface-2 [&_pre]:p-3 [&_pre]:rounded-xl [&_strong]:text-foreground [&_blockquote]:border-l-primary [&_blockquote]:text-muted-foreground">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
