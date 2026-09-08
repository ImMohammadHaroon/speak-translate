const steps = [
  {
    title: "Capture the room",
    body: "Drop an audio file or record live in the browser. Meetings, interviews, lectures, voice notes.",
    image: "/landing/mic-linen.jpg",
    alt: "Close-up of a microphone on olive linen",
  },
  {
    title: "Read it in both languages",
    body: "You get the original transcript beside a fluent English version, with the spoken language named.",
    image: "/landing/hero-desk.jpg",
    alt: "Desk with recorder and handwritten notes on linen",
  },
  {
    title: "Keep what matters",
    body: "Summaries, action items, and a chat that already knows the recording. History stays on your account.",
    image: "/landing/listener.jpg",
    alt: "Person listening with headphones in a quiet olive-toned study",
  },
];

export function WorkflowStack() {
  return (
    <section id="how-it-works" className="scroll-mt-16">
      <div className="mx-auto max-w-[1400px] px-4 pt-20 md:px-8 md:pt-28">
        <h2 className="max-w-[16ch] font-serif text-3xl font-medium leading-[1.15] tracking-tight md:text-5xl">
          From voice to notes you can act on.
        </h2>
      </div>

      <div className="relative mt-10 md:mt-16">
        {steps.map((step) => (
          <article
            key={step.title}
            className="flex min-h-0 items-center bg-background px-4 py-10 md:sticky md:top-16 md:min-h-[calc(100dvh-4rem)] md:px-8 md:py-16"
          >
            <div className="mx-auto grid w-full max-w-[1400px] items-center gap-8 overflow-hidden rounded-[var(--radius)] border border-border bg-card shadow-lg md:grid-cols-12 md:gap-0">
              <div className="px-6 py-8 md:col-span-5 md:px-12 md:py-16">
                <h3 className="font-serif text-3xl font-medium leading-[1.15] md:text-4xl">{step.title}</h3>
                <p className="mt-4 max-w-[36ch] text-base leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
              <div className="md:col-span-7">
                <img
                  src={step.image}
                  alt={step.alt}
                  width={1400}
                  height={900}
                  className="h-56 w-full object-cover md:h-[min(70dvh,36rem)]"
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
