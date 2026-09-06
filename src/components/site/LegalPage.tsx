import { AdminManagedNote, PageHero, PublicPage } from "@/components/site/PublicPage";

export function LegalPage({
  eyebrow,
  title,
  sections,
}: {
  eyebrow: string;
  title: string;
  sections: { heading: string; body: string }[];
}) {
  return (
    <PublicPage>
      <PageHero eyebrow={eyebrow} title={title} />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="space-y-10">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-xl font-semibold text-primary">{s.heading}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>
        <AdminManagedNote>
          This policy text is placeholder wording drafted for the platform. Have it reviewed by your
          legal advisor and replaced with your final approved copy before going live.
        </AdminManagedNote>
      </div>
    </PublicPage>
  );
}
