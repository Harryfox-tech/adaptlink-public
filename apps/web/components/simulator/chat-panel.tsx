import { SimulationMessage } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ChatPanel({ title, messages }: { title: string; messages: SimulationMessage[] }) {
  return (
    <Card className="h-full border-cyan-500/20 bg-slate-950/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
      <CardHeader className="border-b border-white/[0.06] pb-3">
        <CardTitle className="font-mono text-sm uppercase tracking-wider text-cyan-100/90">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[90%] rounded-xl px-3 py-2.5 text-sm leading-relaxed",
                message.role === "user"
                  ? "ml-auto border border-cyan-400/25 bg-gradient-to-br from-cyan-500/25 to-blue-600/10 text-white shadow-[0_0_18px_rgba(34,211,238,0.15)]"
                  : "border border-white/10 bg-white/[0.06] text-white/82",
              )}
            >
              {message.content}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
