declare namespace Cloudflare {
  interface Env {
    ATLAS_PUSH_PRIVATE_KEY?: string;
    ATLAS_PUSH_PUBLIC_KEY?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ATLAS_OWNER_EMAIL?: string;
    ATLAS_WORKSHOP_EMAILS?: string;
    ATLAS_POLICY_UPDATE_KEY?: string;
    ATLAS_CONCORDE_UPDATE_KEY?: string;
    ATLAS_AVIATION_CONTENT_KEY?: string;
    ATLAS_AVIATION_HISTORY_KEY?: string;
    ATLAS_AVIATION_FLIGHT_SPAN_KEY?: string;
    ATLAS_AVIATION_SERVICE_SPAN_KEY?: string;
    ATLAS_AVIATION_READY_KEY?: string;
    ATLAS_AVIATION_ALBUMS_KEY?: string;
    ATLAS_CHEESES_IMPORT_KEY?: string;
    ATLAS_CHEESES_COMPLETION_KEY?: string;
    ATLAS_CATHOLIC_IMPORT_KEY?: string;
    ATLAS_GEOGRAPHY_IMPORT_KEY?: string;
    ATLAS_HISTORY_IMPORT_KEY?: string;
    ATLAS_AVIATION_COMPLETION_KEY?: string;
  }
}

declare module 'pngjs' { export const PNG: any; }
