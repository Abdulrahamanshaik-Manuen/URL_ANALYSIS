import React, { useState } from 'react';
import { Send, Terminal, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { testApiEndpoint } from '../Services/apiService';

export default function ApiTesterTab({ initialUrl = '' }) {
  const [apiUrl, setApiUrl] = useState(initialUrl || 'https://jsonplaceholder.typicode.com/todos/1');
  const [method, setMethod] = useState('GET');
  const [headersJson, setHeadersJson] = useState('{\n  "Content-Type": "application/json"\n}');
  const [bodyJson, setBodyJson] = useState('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleTest = async (e) => {
    e.preventDefault();
    if (!apiUrl.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      let parsedHeaders = {};
      if (headersJson.trim()) {
        try {
          parsedHeaders = JSON.parse(headersJson);
        } catch (e) {
          throw new Error('Invalid JSON in Headers field');
        }
      }

      let parsedBody = null;
      if (['POST', 'PUT', 'PATCH'].includes(method) && bodyJson.trim()) {
        try {
          parsedBody = JSON.parse(bodyJson);
        } catch (e) {
          throw new Error('Invalid JSON in Request Body field');
        }
      }

      const res = await testApiEndpoint(apiUrl, {
        method,
        headers: parsedHeaders,
        body: parsedBody
      });
      setResponse(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Send size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>Interactive REST API & Webhook Inspector</span>
          </div>
        </div>

        <form onSubmit={handleTest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="api-tester-form-row">
            <select
              className="form-control api-tester-method-select"
              style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
              <option value="HEAD">HEAD</option>
            </select>

            <input
              type="text"
              className="form-control api-tester-url-input"
              style={{ fontFamily: 'var(--font-mono)' }}
              placeholder="https://api.example.com/v1/resource"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />

            <button type="submit" className="btn-primary api-tester-send-btn" disabled={isLoading}>
              {isLoading ? <Loader2 size={16} className="spinner-icon" /> : <Send size={16} />}
              <span>Send Request</span>
            </button>
          </div>

          <div className="dashboard-grid" style={{ marginBottom: 0 }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Headers (JSON):
              </label>
              <textarea
                className="form-control"
                style={{ height: '100px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                value={headersJson}
                onChange={(e) => setHeadersJson(e.target.value)}
              />
            </div>

            {['POST', 'PUT', 'PATCH'].includes(method) && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Request Body (JSON):
                </label>
                <textarea
                  className="form-control"
                  style={{ height: '100px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                  value={bodyJson}
                  onChange={(e) => setBodyJson(e.target.value)}
                />
              </div>
            )}
          </div>
        </form>
      </div>

      {/* API Response Display */}
      {error && (
        <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '14px' }}>
            Request Error: {error}
          </div>
        </div>
      )}

      {response && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Terminal size={18} style={{ color: 'var(--success)' }} />
              <span>Response Result</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: (response.statusCode || 200) < 400 ? 'var(--success-bg)' : 'var(--danger-bg)',
                  color: (response.statusCode || 200) < 400 ? 'var(--success)' : 'var(--danger)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '12px'
                }}
              >
                {response.statusCode || 200} {response.statusText || 'OK'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {response.responseTimeMs || 0} ms
              </span>
            </div>
          </div>

          <pre className="code-block" style={{ maxHeight: '400px' }}>
            {JSON.stringify(response.data || response.body || response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
