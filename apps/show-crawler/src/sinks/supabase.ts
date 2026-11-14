import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { BreedJudgement, DogResult, DogTarget, ShowEvent } from '../core/model';
import type { Sink } from '../core/sink';

const PAGE = 1000;

export function createSupabase(url: string, serviceRoleKey: string): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Linha de `crawl_events` correspondente a um evento (sem as colunas de controle). */
export function eventRow(event: ShowEvent, seenAt: string) {
  return {
    source: event.source,
    source_event_id: event.sourceEventId,
    name: event.name,
    event_date: event.date,
    city: event.city,
    state: event.state,
    country: event.country,
    has_results: event.hasResults,
    registration_open: event.registrationOpen,
    last_seen_at: seenAt,
  };
}

export function judgementRow(eventId: string, j: BreedJudgement) {
  return {
    event_id: eventId,
    source_show_id: j.sourceShowId,
    show_name: j.showName,
    breed_id: j.breedId,
    breed_name: j.breedName,
    judge: j.judge,
    dogs_present: j.dogsPresent,
  };
}

export function resultRow(judgementId: string, r: DogResult) {
  return {
    judgement_id: judgementId,
    registration_number: r.registrationNumber,
    dog_name: r.dogName,
    catalog_number: r.catalogNumber,
    sex: r.sex,
    class_code: r.classCode,
    placement: r.placement,
    awards_raw: r.awardsRaw,
    awards: r.awards,
    sex_awards: r.sexAwards,
    breed_awards: r.breedAwards,
    points: r.points,
  };
}

/** Grava nas tabelas `crawl_*` do Supabase do sistema de gestão (migração 0012). */
export class SupabaseSink implements Sink {
  readonly label = 'Supabase (tabelas crawl_*)';

  constructor(private readonly db: SupabaseClient) {}

  async saveEvents(events: ShowEvent[]): Promise<void> {
    const seenAt = new Date().toISOString();
    for (let i = 0; i < events.length; i += 500) {
      const rows = events.slice(i, i + 500).map((e) => eventRow(e, seenAt));
      const { error } = await this.db
        .from('crawl_events')
        .upsert(rows, { onConflict: 'source,source_event_id' });
      if (error) throw new Error(`crawl_events: ${error.message}`);
    }
  }

  async saveJudgements(event: ShowEvent, judgements: BreedJudgement[]): Promise<void> {
    const { data: row, error: upsertError } = await this.db
      .from('crawl_events')
      // Zera a marca de coleta antes de trocar os dados: se algo falhar no meio, o evento
      // volta a ser coletado na próxima execução em vez de ficar com dados pela metade.
      .upsert(
        { ...eventRow(event, new Date().toISOString()), results_collected_at: null },
        { onConflict: 'source,source_event_id' },
      )
      .select('id')
      .single();
    if (upsertError) throw new Error(`crawl_events: ${upsertError.message}`);
    const eventId = (row as { id: string }).id;

    const { error: deleteError } = await this.db
      .from('crawl_judgements')
      .delete()
      .eq('event_id', eventId);
    if (deleteError) throw new Error(`crawl_judgements: ${deleteError.message}`);

    for (const j of judgements) {
      const { data: inserted, error: insertError } = await this.db
        .from('crawl_judgements')
        .insert(judgementRow(eventId, j))
        .select('id')
        .single();
      if (insertError) throw new Error(`crawl_judgements: ${insertError.message}`);
      const judgementId = (inserted as { id: string }).id;

      if (j.results.length > 0) {
        const { error: resultsError } = await this.db
          .from('crawl_results')
          .insert(j.results.map((r) => resultRow(judgementId, r)));
        if (resultsError) throw new Error(`crawl_results: ${resultsError.message}`);
      }
    }

    const { error: markError } = await this.db
      .from('crawl_events')
      .update({ results_collected_at: new Date().toISOString() })
      .eq('id', eventId);
    if (markError) throw new Error(`crawl_events: ${markError.message}`);
  }

  async collectedEventIds(source: string): Promise<Set<string>> {
    const ids = new Set<string>();
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await this.db
        .from('crawl_events')
        .select('source_event_id')
        .eq('source', source)
        .not('results_collected_at', 'is', null)
        .order('source_event_id')
        .range(from, from + PAGE - 1);
      if (error) throw new Error(`crawl_events: ${error.message}`);
      for (const r of data ?? []) ids.add((r as { source_event_id: string }).source_event_id);
      if (!data || data.length < PAGE) return ids;
    }
  }
}

/** Cães cadastrados no sistema de gestão que têm número de registro ou nome registrado. */
export async function loadSupabaseTargets(db: SupabaseClient): Promise<DogTarget[]> {
  const { data, error } = await db.from('dogs').select('registration_number, registered_name');
  if (error) throw new Error(`dogs: ${error.message}`);
  return ((data ?? []) as { registration_number: string | null; registered_name: string | null }[])
    .map((d) => ({ registrationNumber: d.registration_number, registeredName: d.registered_name }))
    .filter((t) => t.registrationNumber?.trim() || t.registeredName?.trim());
}
