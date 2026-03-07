import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap, Globe, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: <Zap className="w-8 h-8 text-accent" />,
    title: "Blazing Fast Retrieval",
    description: "Access your files instantly from anywhere with our decentralized hot storage network.",
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-accent" />,
    title: "Censorship-Resistant",
    description: "Data is erasure-coded and distributed globally, ensuring it's always available and immutable.",
  },
  {
    icon: <Globe className="w-8 h-8 text-accent" />,
    title: "Global & Reliable",
    description: "Enterprise-grade reliability with automatic data chunking and geo-redundancy.",
  },
];

export function Features() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((feature) => (
        <Card key={feature.title} className="bg-card/50 border-border/20 text-center p-6">
          <div className="mb-4 flex justify-center">{feature.icon}</div>
          <h3 className="text-lg font-headline font-semibold">{feature.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
        </Card>
      ))}
    </div>
  );
}
