import { Construction } from 'lucide-react';

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="grid place-items-center py-20 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-paper-alt text-ink-muted">
          <Construction size={22} />
        </div>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Este módulo será implementado nas próximas fases do projeto.
        </p>
      </div>
    </div>
  );
}
