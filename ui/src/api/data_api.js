// Helper module: aggregation and anonymized export API for collected activity events
// This script can be loaded via importScripts() or as an ES module

export function getAggregatedData(events, cfg) {
  // produce per-domain aggregates: visit_count, total_time_ms, avg_time_ms, click_count, max_scroll, topKeywords, categories
  const perDomain = Object.create(null);

  for (const e of events) {
    const d = e.domain || 'unknown';
    if (!perDomain[d]) perDomain[d] = {visit_count: 0, total_time_ms: 0, dwell_count: 0, click_count: 0, max_scroll: 0, keyword_counts: Object.create(null), categories: Object.create(null)};
    const bucket = perDomain[d];

    if (e.type === 'navigation' || e.type === 'load' || e.type === 'title') bucket.visit_count++;
    if (e.type === 'dwell' && typeof e.duration_ms === 'number') { bucket.total_time_ms += e.duration_ms; bucket.dwell_count++; }
    if (e.type === 'interaction') {
      if (e.interactionType === 'click') bucket.click_count++;
      if (e.interactionType === 'scroll' && typeof e.maxScrollPercent === 'number') bucket.max_scroll = Math.max(bucket.max_scroll, e.maxScrollPercent);
    }
    if (e.keywords && Array.isArray(e.keywords)) {
      for (const k of e.keywords) bucket.keyword_counts[k] = (bucket.keyword_counts[k] || 0) + 1;
    }
    if (e.category) bucket.categories[e.category] = (bucket.categories[e.category] || 0) + 1;
  }

  // finalize: compute averages and top keywords
  const result = {byDomain: {}};
  const topK = (cfg && cfg.topKeywords) || 10;
  for (const d of Object.keys(perDomain)) {
    const b = perDomain[d];
    const avg = b.dwell_count > 0 ? Math.round(b.total_time_ms / b.dwell_count) : 0;
    const kws = Object.entries(b.keyword_counts).sort((a,b) => b[1]-a[1]).slice(0, topK).map(p => ({keyword: p[0], count: p[1]}));
    result.byDomain[d] = {
      visit_count: b.visit_count,
      total_time_ms: b.total_time_ms,
      avg_dwell_ms: avg,
      click_count: b.click_count,
      max_scroll_percent: b.max_scroll,
      topKeywords: kws,
      categories: b.categories
    };
  }

  // also provide some overall summary metrics (aggregated across domains)
  const overall = {totalDomains: Object.keys(result.byDomain).length, totalEvents: events.length};
  return {summary: overall, domains: result.byDomain};
}

// For backward compatibility with importScripts in background.js
if (typeof self !== 'undefined' && typeof self.importScripts === 'function') {
  self.getAggregatedData = getAggregatedData;
}

// Default export for ES modules
export default getAggregatedData;
