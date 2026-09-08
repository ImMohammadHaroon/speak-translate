const quotes = [
  {
    text: "I record interviews in Urdu and need English notes the same afternoon. This does that in one place.",
    name: "Amina R.",
    role: "Documentary producer",
  },
  {
    text: "Lectures stay useful after class. I upload the audio and leave with a transcript I can search.",
    name: "Daniel Cho",
    role: "Graduate researcher",
  },
];

export function Audience() {
  return (
    <section className="px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto grid max-w-[1400px] items-stretch gap-8 lg:grid-cols-12">
        <div className="overflow-hidden rounded-[var(--radius)] lg:col-span-7">
          <img
            src="/landing/listener.jpg"
            alt="Listener wearing headphones at a wooden desk in a quiet olive-toned study"
            width={1600}
            height={900}
            className="h-full min-h-[20rem] w-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-center gap-10 lg:col-span-5">
          <h2 className="font-serif text-3xl font-medium leading-[1.15] tracking-tight md:text-4xl">
            Made for people who listen for a living.
          </h2>
          {quotes.map((quote) => (
            <blockquote key={quote.name} className="border-l-2 border-primary pl-5">
              <p className="max-w-[42ch] text-base leading-relaxed text-foreground">“{quote.text}”</p>
              <footer className="mt-3 text-sm text-muted-foreground">
                {quote.name}, {quote.role}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
