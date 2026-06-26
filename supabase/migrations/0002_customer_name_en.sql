-- Bilingual customer names: optional English name alongside the primary name.
alter table customers add column if not exists name_en text;
