import { Mic, Upload, Languages, FileAudio, MessageSquare } from "lucide-react";

const features = [
  {
    title: "Upload any audio",
    body: "Send a file from your desk. We transcribe the spoken language as it is.",
    icon: Upload,
    className: "md:col-span-2 md:min-h-[22rem]",
    visual: "image" as const,
  },
  {
    title: "Record live",
    body: "No file? Speak in the browser and process the take when you stop.",
    icon: Mic,
    className: "md:col-span-2",
    visual: "primary" as const,
  },
  {
    title: "Original transcript",
    body: "Keep the source wording, including names and terms as spoken.",
    icon: FileAudio,
    className: "md:col-span-1",
    visual: "plain" as const,
  },
  {
    title: "English translation",
    body: "A fluent English pass sits beside the original, or a cleanup if it was already English.",
    icon: Languages,
    className: "md:col-span-1",
    visual: "secondary" as const,
  },
  {
    title: "Chat the recording",
    body: "Ask for action items, tone, or a recap. The chat already has the transcript.",
    icon: MessageSquare,
    className: "md:col-span-2",
    visual: "muted" as const,
  },
];

const visualClass = {
  image: "relative overflow-hidden bg-card",
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  muted: "bg-muted",
  plain: "bg-card",
};

export function FeatureBento() {
  return (
    <section id="features" className="scroll-mt-16 px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-[1400px]">
        <h2 className="max-w-[18ch] font-serif text-3xl font-medium leading-[1.15] tracking-tight md:text-5xl">
          What you get from every file.
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className={`flex min-h-[14rem] flex-col justify-between rounded-[var(--radius)] border border-border p-6 shadow-sm md:min-h-[16rem] ${visualClass[feature.visual]} ${feature.className}`}
              >
                {feature.visual === "image" && (
                  <img
                    src="/landing/mic-linen.jpg"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                {feature.visual === "image" && (
                  <div className="absolute inset-0 bg-gradient-to-t from-background/92 via-background/45 to-background/10" />
                )}
                <Icon className={`relative h-5 w-5 ${feature.visual === "primary" ? "text-primary-foreground" : "text-primary"}`} />
                <div className="relative mt-8">
                  <h3 className="font-serif text-2xl font-medium leading-snug">{feature.title}</h3>
                  <p
                    className={`mt-2 max-w-[36ch] text-sm leading-relaxed ${
                      feature.visual === "primary"
                        ? "text-primary-foreground/85"
                        : feature.visual === "image"
                          ? "text-foreground/80"
                          : "text-muted-foreground"
                    }`}
                  >
                    {feature.body}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
