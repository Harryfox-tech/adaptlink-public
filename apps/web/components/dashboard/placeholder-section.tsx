import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PlaceholderSection({
  title,
  description,
  embedded = false,
}: {
  title: string;
  description: string;
  embedded?: boolean;
}) {
  const content = (
    <>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-quantum text-sm text-white/55">{description}</p>
      </CardContent>
    </>
  );

  if (embedded) return <>{content}</>;

  return <Card>{content}</Card>;
}
