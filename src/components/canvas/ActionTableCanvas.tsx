import { parseMarkdownTable } from "@/lib/canvas-parser";

export default function ActionTableCanvas({ content }: { content: string }) {
  const { headers, rows } = parseMarkdownTable(content);

  if (rows.length === 0) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="rounded-xl bg-surface-2 h-8 w-full" />
        {[1,2,3].map(i => <div key={i} className="rounded-xl bg-surface-2 h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-micro">
        <thead>
          <tr className="bg-surface-2">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-t border-border hover:bg-surface-2/50 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
