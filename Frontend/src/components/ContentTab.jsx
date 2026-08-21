import React from 'react';
import { AlignLeft, Hash, BookOpen, Search, Code, CheckCircle2 } from 'lucide-react';

export default function ContentTab({ data }) {
  if (!data) return null;

  const { checks = {} } = data;
  const content = checks.content || {};
  const headings = content.headings || { counts: {}, list: [] };
  const structure = content.structure || {};
  const kw = content.keywordMatch;
  const regex = content.regexMatch;
  const css = content.cssSelectorResult;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Metrics */}
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-box-label">Word Count</div>
          <div className="stat-box-value">{content.wordCount || 0}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Estimated Reading Time</div>
          <div className="stat-box-value">{content.readingTimeMinutes || 1} min</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Paragraphs (p)</div>
          <div className="stat-box-value">{structure.paragraphs || 0}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Total Headings</div>
          <div className="stat-box-value">{structure.totalHeadings || 0}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Forms & Inputs</div>
          <div className="stat-box-value">{(structure.forms || 0)} / {(structure.inputs || 0)}</div>
        </div>
      </div>

      {/* Headings Hierarchy (H1 - H6) */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Hash size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>Heading Structure & Distribution (H1 - H6)</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
            <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-tertiary)' }}>H1: {headings.counts?.h1 || 0}</span>
            <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-tertiary)' }}>H2: {headings.counts?.h2 || 0}</span>
            <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-tertiary)' }}>H3: {headings.counts?.h3 || 0}</span>
          </div>
        </div>

        {headings.list && headings.list.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
            {headings.list.map((h, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tertiary)',
                  fontSize: '13px'
                }}
              >
                <span
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: h.level === 'h1' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    color: h.level === 'h1' ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px'
                  }}
                >
                  {h.level.toUpperCase()}
                </span>
                <span style={{ color: 'var(--text-primary)' }}>{h.text}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            No heading elements (H1 - H6) found in the page markup.
          </p>
        )}
      </div>

      {/* Keyword & Custom Matchers */}
      {(kw || regex || css) && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Search size={18} style={{ color: 'var(--accent-cyan)' }} />
              <span>Keyword & Selector Query Results</span>
            </div>
          </div>

          {kw && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                Keyword Query: "{kw.keyword}" — {kw.found ? `Found (${kw.count} occurrences)` : 'Not Found'}
              </div>
              {kw.snippets?.map((snip, i) => (
                <div key={i} style={{ padding: '6px 10px', background: 'var(--bg-tertiary)', borderRadius: '4px', fontSize: '12px', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  {snip}
                </div>
              ))}
            </div>
          )}

          {regex && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                Regex Query: <code>{regex.pattern}</code> — {regex.found ? `Matched (${regex.count} times)` : 'No matches'}
              </div>
            </div>
          )}

          {css && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                CSS Selector: <code>{css.selector}</code> — {css.matchCount} matched elements
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
