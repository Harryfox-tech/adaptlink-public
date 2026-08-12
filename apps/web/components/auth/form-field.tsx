import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-white/85">{label}</label>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-white/45">{hint}</p> : null}
    </div>
  );
}

export function AuthInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} />;
}

export function AuthTextarea(props: React.ComponentProps<typeof Textarea>) {
  return <Textarea {...props} />;
}
