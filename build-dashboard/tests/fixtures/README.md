# Fixture builds

`builds/` is a builds dir, laid out as the loader writes it (`loader/docs/build-record.md`).

**Real records**, from captures on 2026-10-04 against a throwaway Elasticsearch 8.5 on `:19200`.
Paths under the session scratchpad became `/scratch`, and the host became `build-host`.

| Build | What |
|---|---|
| `20261004T090148Z-all-6000` | `all.sh` on `loader/test_data/input` (pango-test), with every step |
| `20261004T090254Z-all-3002` | `all.sh` on copies of the January pango-1 and pango-2 inputs: 12.5 min |
| `20261004T093157Z-report-5ca6`, `…093209Z-report-bae4` | `data_report --backfill` over the January outputs, dated 2026-01-25 |

**Synthetic records**, derived from the full-data capture's records: times shifted, fields edited.

| Build | What |
|---|---|
| `20261004T100000Z-all-5e0b` | Killed: pango-2's index_es still says running, last written about 4 h before `FIXTURE_NOW` |
| `20261004T110000Z-all-f41d` | Failed: pango-2's index_es lost 3 documents, and verify never ran |
| `20261004T123000Z-all-9c2e` | NCBI trouble: two failed batches, 200 PMIDs without articles, 15 % fewer annotations |
| `20261004T135700Z-all-7a10` | Running: pango-1's clean_annotations last wrote 5 s before `FIXTURE_NOW` |

`FIXTURE_NOW` is 2026-10-04T14:00:00Z (`tests/mocks/api.ts`). Read with the real clock, the running
and killed builds may look different.

`make_fixtures.py` writes all of them from the real records. Its docstring has the command; it
needs the capture folders, so keep them if the record format may change. After a format change,
recapture rather than editing these files by hand.
