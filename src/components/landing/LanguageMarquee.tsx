const languages = [
  "Arabic",
  "Spanish",
  "French",
  "Japanese",
  "Mandarin",
  "Hindi",
  "Portuguese",
  "German",
  "Korean",
  "Urdu",
  "Turkish",
  "Russian",
  "Italian",
  "Bengali",
];

export function LanguageMarquee() {
  const loop = [...languages, ...languages];

  return (
    <section aria-label="Languages we transcribe" className="border-y border-border bg-muted/60">
      <div className="overflow-hidden py-4">
        <div className="lang-marquee flex w-max gap-10 px-6">
          {loop.map((lang, i) => (
            <span
              key={`${lang}-${i}`}
              className="font-serif text-xl text-foreground/80 md:text-2xl"
              aria-hidden={i >= languages.length}
            >
              {lang}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
