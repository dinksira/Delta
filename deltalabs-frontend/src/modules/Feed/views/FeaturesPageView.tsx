import { Card, CardDescription, CardHeader, CardTitle, Typography } from "@/components/theme";

const featureCards = [
  { title: "School", description: "Studio-quality text-to-speech with emotional nuance and support for over 140+ languages." },
  { title: "Course", description: "Studio-quality text-to-speech with emotional nuance and support for over 140+ languages." },
  { title: "Online Competition", description: "Studio-quality text-to-speech with emotional nuance and support for over 140+ languages." },
  { title: "Tutorial", description: "Studio-quality text-to-speech with emotional nuance and support for over 140+ languages." },
  { title: "R&D", description: "Studio-quality text-to-speech with emotional nuance and support for over 140+ languages." },
  { title: "Laboratory", description: "Studio-quality text-to-speech with emotional nuance and support for over 140+ languages." },
  { title: "Certification", description: "Studio-quality text-to-speech with emotional nuance and support for over 140+ languages." },
  { title: "Chatroom", description: "Studio-quality text-to-speech with emotional nuance and support for over 140+ languages." },
] as const;

/** Authorized-only features screen placeholder aligned to EPIC-A route policy. */
export function FeaturesPageView() {
  return (
    <div className="flex flex-col gap-8 py-4">
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-xl border border-features-card-border bg-features-card-icon-bg px-5 py-2">
          <Typography as="span" variant="label">
            Features
          </Typography>
        </div>
      </div>

      <section className="space-y-2 text-center">
        <Typography as="h1" variant="h1">
          Learn. Build. Experiment.
        </Typography>
        <Typography variant="body" className="text-text-secondary">
          Access high-fidelity academic tools, collaborative research spaces, and a global network
          of specialized teams.
        </Typography>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {featureCards.map((card) => (
          <Card
            key={card.title}
            className="h-full border-features-card-border bg-features-card-surface transition-colors hover:border-features-card-hover-border"
          >
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </div>
  );
}
