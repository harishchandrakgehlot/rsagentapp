'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileCode2,
  ExternalLink,
  Download,
  Copy,
  Check,
  Send,
  Terminal,
  Layers,
  ChevronRight,
  Globe,
  BookOpen,
  Sparkles,
} from 'lucide-react';


interface EndpointParam {
  name: string;
  in: string;
  required?: boolean;
  type?: string;
  example?: string;
  description?: string;
}

interface EndpointSpec {
  id: string;
  method: 'GET' | 'POST' | 'DELETE' | 'PUT';
  path: string;
  summary: string;
  description: string;
  docsUrl: string;
  parameters?: EndpointParam[];
  requestBodyTemplate?: Record<string, unknown>;
  requestBodyTextExample?: Record<string, unknown>;
  responses?: Array<{
    status: number;
    description: string;
    example?: Record<string, unknown>;
  }>;
}

interface CategorySpec {
  id: string;
  name: string;
  description: string;
  endpoints: EndpointSpec[];
}

interface OpenApiData {
  specVersion: string;
  title: string;
  version: string;
  description: string;
  repository: {
    url: string;
    rawYamlUrl: string;
    license: string;
    maintainedBy: string;
  };
  activeConfiguration: {
    graphApiVersion: string;
    phoneNumberId: string;
    businessAccountId: string;
    businessPhone: string;
    hasToken: boolean;
    tokenMasked: string;
  };
  categories: CategorySpec[];
}

export default function AdminOpenApiPage() {
  const [data, setData] = useState<OpenApiData | null>(null);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('send_message');
  const [activeCodeLang, setActiveCodeLang] = useState<'curl' | 'js' | 'python' | 'node'>('curl');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live try endpoint tester state
  const [liveTesting, setLiveTesting] = useState(false);
  const [liveTestResponse, setLiveTestResponse] = useState<{
    status: number;
    data: unknown;
    timeMs: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/meta/openapi')
      .then(res => res.json())
      .then(resData => {
        if (resData.success && resData.openApi) {
          setData(resData.openApi);
        }
      })
      .catch(() => {});
  }, []);


  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Find currently selected endpoint
  const currentCategory = data?.categories.find(c =>
    c.endpoints.some(e => e.id === selectedEndpointId)
  );
  const currentEndpoint = currentCategory?.endpoints.find(
    e => e.id === selectedEndpointId
  ) || data?.categories[0]?.endpoints[0];

  // Helper to build code snippets with active user credentials
  const generateSnippet = (lang: 'curl' | 'js' | 'python' | 'node', endpoint: EndpointSpec) => {
    const phoneId = data?.activeConfiguration.phoneNumberId || '1387005294491815';
    const wabaId = data?.activeConfiguration.businessAccountId || '2150898739182078';
    const version = data?.activeConfiguration.graphApiVersion || 'v25.0';
    const token = data?.activeConfiguration.tokenMasked || '<YOUR_META_ACCESS_TOKEN>';

    const resolvedPath = endpoint.path
      .replace('{phone_number_id}', phoneId)
      .replace('{waba_id}', wabaId)
      .replace('{template_name}', 'royal_services_notification');

    const url = `https://graph.facebook.com/${version}${resolvedPath}`;
    const bodyStr = JSON.stringify(endpoint.requestBodyTemplate || {}, null, 2);

    switch (lang) {
      case 'curl':
        if (endpoint.method === 'GET' || endpoint.method === 'DELETE') {
          return `curl -X ${endpoint.method} \\
  "${url}" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json"`;
        }
        return `curl -X POST \\
  "${url}" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '${bodyStr}'`;

      case 'js':
        if (endpoint.method === 'GET' || endpoint.method === 'DELETE') {
          return `const response = await fetch("${url}", {
  method: "${endpoint.method}",
  headers: {
    "Authorization": "Bearer ${token}",
    "Content-Type": "application/json"
  }
});
const data = await response.json();
console.log(data);`;
        }
        return `const response = await fetch("${url}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${token}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(${bodyStr})
});
const data = await response.json();
console.log(data);`;

      case 'python':
        if (endpoint.method === 'GET' || endpoint.method === 'DELETE') {
          return `import requests

url = "${url}"
headers = {
    "Authorization": "Bearer ${token}",
    "Content-Type": "application/json"
}

response = requests.${endpoint.method.toLowerCase()}(url, headers=headers)
print(response.json())`;
        }
        return `import requests

url = "${url}"
headers = {
    "Authorization": "Bearer ${token}",
    "Content-Type": "application/json"
}
payload = ${bodyStr.replace(/true/g, 'True').replace(/false/g, 'False')}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;

      case 'node':
        return `import axios from 'axios';

const url = '${url}';
const config = {
  headers: {
    Authorization: 'Bearer ${token}',
    'Content-Type': 'application/json',
  },
};

${endpoint.method === 'POST' ? `const payload = ${bodyStr};\nconst response = await axios.post(url, payload, config);` : `const response = await axios.${endpoint.method.toLowerCase()}(url, config);`}
console.log(response.data);`;
    }
  };

  const handleTestEndpointLive = async () => {
    if (!currentEndpoint) return;
    setLiveTesting(true);
    setLiveTestResponse(null);
    const start = performance.now();

    try {
      if (currentEndpoint.id === 'list_templates') {
        const res = await fetch('/api/whatsapp/templates');
        const json = await res.json();
        setLiveTestResponse({
          status: res.status,
          data: json,
          timeMs: Math.round(performance.now() - start),
        });
      } else if (currentEndpoint.id === 'get_phone_info') {
        const res = await fetch('/api/whatsapp/numbers');
        const json = await res.json();
        setLiveTestResponse({
          status: res.status,
          data: json,
          timeMs: Math.round(performance.now() - start),
        });
      } else {
        // Run test call to /api/whatsapp/test
        const res = await fetch('/api/whatsapp/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: data?.activeConfiguration.businessPhone || '919819143222',
            mode: 'template',
            templateName: 'royal_services_notification',
          }),
        });
        const json = await res.json();
        setLiveTestResponse({
          status: res.status,
          data: json,
          timeMs: Math.round(performance.now() - start),
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error executing request';
      setLiveTestResponse({
        status: 500,
        data: { error: msg },
        timeMs: Math.round(performance.now() - start),
      });
    } finally {
      setLiveTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-800 rounded-xl">
              <FileCode2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Meta WhatsApp OpenAPI Explorer
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official OpenAPI 3.0 specification for Meta WhatsApp Business Messaging API, sourced from{' '}
            <a
              href="https://github.com/facebook/openapi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-semibold"
            >
              facebook/openapi.git
            </a>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="https://github.com/facebook/openapi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>facebook/openapi GitHub</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          <a
            href="https://raw.githubusercontent.com/facebook/openapi/main/business-messaging-api_v23.0.yaml"
            target="_blank"
            rel="noopener noreferrer"
            download="meta-business-messaging-api.yaml"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Download OpenAPI YAML (1.09 MB)</span>
          </a>

          <Link
            href="/admin/templates"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Templates & Schedule</span>
          </Link>
        </div>
      </div>

      {/* Active System Credentials Badge Card */}
      {data && (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Active System Meta Configuration (Auto-populated in API examples):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-400 block font-medium">PHONE NUMBER ID</span>
              <span className="font-mono font-bold text-slate-800">
                {data.activeConfiguration.phoneNumberId}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-400 block font-medium">WABA ACCOUNT ID</span>
              <span className="font-mono font-bold text-slate-800">
                {data.activeConfiguration.businessAccountId}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-400 block font-medium">SENDER PHONE</span>
              <span className="font-mono font-bold text-slate-800">
                +{data.activeConfiguration.businessPhone}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-400 block font-medium">API VERSION</span>
              <span className="font-mono font-bold text-emerald-700">
                {data.activeConfiguration.graphApiVersion}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Categories & Endpoints */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                API Endpoints
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                OpenAPI 3.0
              </span>
            </div>

            {data?.categories.map(cat => (
              <div key={cat.id} className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block px-1">
                  {cat.name}
                </span>

                <div className="space-y-1">
                  {cat.endpoints.map(ep => {
                    const isSelected = ep.id === selectedEndpointId;
                    return (
                      <button
                        key={ep.id}
                        type="button"
                        onClick={() => {
                          setSelectedEndpointId(ep.id);
                          setLiveTestResponse(null);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-blue-50 text-blue-950 font-bold border border-blue-300 shadow-xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-mono ${
                              ep.method === 'POST'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ep.method === 'GET'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {ep.method}
                          </span>
                          <span className="truncate">{ep.summary}</span>
                        </div>
                        <ChevronRight
                          className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-300'}`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* GitHub Spec Info Box */}
          <div className="p-3.5 bg-slate-900 text-slate-300 rounded-2xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Specification Source</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Meta officially maintains and generates this OpenAPI definition for external SDK generators and partner integrations.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px]">
              <span className="font-mono text-slate-400">v23.0 / v25.0</span>
              <a
                href="https://github.com/facebook/openapi/blob/main/business-messaging-api_v23.0.yaml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold"
              >
                <span>View on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Main Panel: Endpoint Details, Parameters & Code Samples */}
        <div className="lg:col-span-8">
          {currentEndpoint ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-6">
              {/* Endpoint Header */}
              <div className="space-y-2 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-md uppercase font-mono ${
                      currentEndpoint.method === 'POST'
                        ? 'bg-emerald-100 text-emerald-800'
                        : currentEndpoint.method === 'GET'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {currentEndpoint.method}
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg break-all">
                    https://graph.facebook.com/{data?.activeConfiguration.graphApiVersion || 'v25.0'}
                    {currentEndpoint.path}
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {currentEndpoint.summary}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {currentEndpoint.description}
                </p>

                {currentEndpoint.docsUrl && (
                  <a
                    href={currentEndpoint.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold"
                  >
                    <span>View Official Meta Documentation</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Parameters Table */}
              {currentEndpoint.parameters && currentEndpoint.parameters.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Parameters
                  </span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">In</th>
                          <th className="py-2 px-3">Required</th>
                          <th className="py-2 px-3">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentEndpoint.parameters.map(p => (
                          <tr key={p.name} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-mono font-semibold text-slate-800">
                              {p.name}
                            </td>
                            <td className="py-2 px-3 text-slate-500">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                {p.in}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              {p.required ? (
                                <span className="text-rose-600 font-bold text-[10px]">Yes</span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">No</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-600 text-[11px]">
                              {p.description || `Example: ${p.example}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Code Snippets Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Code Generator
                  </span>

                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                    {(['curl', 'js', 'python', 'node'] as const).map(lang => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setActiveCodeLang(lang)}
                        className={`px-2 py-0.5 rounded-md font-semibold uppercase text-[10px] transition-colors ${
                          activeCodeLang === lang
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {lang === 'js' ? 'Fetch' : lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative group">
                  <pre className="p-3.5 bg-slate-950 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                    {generateSnippet(activeCodeLang, currentEndpoint)}
                  </pre>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(generateSnippet(activeCodeLang, currentEndpoint), 'code_snippet')
                    }
                    className="absolute top-2.5 right-2.5 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors flex items-center gap-1 opacity-90 group-hover:opacity-100"
                    title="Copy code snippet"
                  >
                    {copiedKey === 'code_snippet' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Interactive Try Live Endpoint */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-600" />
                    Live Endpoint Execution Console
                  </span>

                  <button
                    type="button"
                    onClick={handleTestEndpointLive}
                    disabled={liveTesting}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                  >
                    <Send className={`w-3 h-3 ${liveTesting ? 'animate-spin' : ''}`} />
                    <span>{liveTesting ? 'Calling Meta Graph API...' : 'Execute Live Request'}</span>
                  </button>
                </div>

                {liveTestResponse && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] px-1">
                      <span className="font-semibold text-slate-700">
                        HTTP Status: <strong className={liveTestResponse.status === 200 ? 'text-emerald-600' : 'text-rose-600'}>{liveTestResponse.status}</strong>
                      </span>
                      <span className="text-slate-400 font-mono">{liveTestResponse.timeMs}ms</span>
                    </div>

                    <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto max-h-64">
                      {JSON.stringify(liveTestResponse.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
              Select an endpoint from the left menu to view its specification.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
