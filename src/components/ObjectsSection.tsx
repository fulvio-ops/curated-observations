import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

type Obj = {
  fingerprint: string;
  source?: string;
  title: string;
  link: string;
  published_at: string;
  micro_judgment?: string | null;
};

export default function ObjectsSection() {
  const [items, setItems] = useState<Obj[]>([]);

  useEffect(() => {
    const url = `${import.meta.env.BASE_URL}data/objects.json`;

    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  }, []);

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-semibold mb-6">Objects</h2>

        <div className="grid gap-4">
          {items.map((it) => (
            <Card key={it.fingerprint}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm opacity-70">{it.source || ""}</div>
                  <div className="text-sm opacity-70">
                    {new Date(it.published_at).toLocaleDateString()}
                  </div>
                </div>

                <a
                  href={it.link}
                  target="_blank"
                  rel="noreferrer"
                  className="block mt-2 text-lg font-medium hover:underline"
                >
                  {it.title}
                </a>

                {it.micro_judgment ? (
                  <div className="mt-2 text-sm opacity-80">{it.micro_judgment}</div>
                ) : null}
              </CardContent>
            </Card>
          ))}

          {items.length === 0 ? (
            <div className="opacity-70 text-sm">No objects yet.</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
