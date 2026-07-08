import { useState } from 'react';
import { CheckCircle, XCircle, Loader2, RefreshCw, ExternalLink, Settings } from 'lucide-react';
import { useIntegrationStatus, useConfigureJira, useConfigureLinear, useLinearTeams } from '../hooks/useIntegrations';
import { useAuth } from '../context/AuthContext';

function StatusPill({ connected, user, error }: { connected: boolean; user?: string; error?: string }) {
  if (connected) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
        <CheckCircle className="w-3.5 h-3.5" />
        Connected{user ? ` as ${user}` : ''}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-400 border border-slate-600">
      <XCircle className="w-3.5 h-3.5" />
      {error ? 'Not configured' : 'Not connected'}
    </span>
  );
}

function WebhookUrl({ path, label }: { path: string; label: string }) {
  const base = window.location.origin.includes('localhost')
    ? 'https://your-app.vercel.app'
    : window.location.origin;
  const url = `${base}/api/v1/integrations/${path}`;
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label} Webhook URL</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-300 break-all">
          {url}
        </code>
        <button
          onClick={() => navigator.clipboard.writeText(url)}
          className="text-xs text-indigo-400 hover:text-indigo-300 whitespace-nowrap px-2 py-1 rounded border border-slate-700 hover:border-indigo-500 transition-colors"
        >
          Copy
        </button>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  const { isAdmin } = useAuth();
  const { data: status, isLoading: statusLoading, refetch } = useIntegrationStatus();
  const { data: linearTeams = [] } = useLinearTeams();
  const configureJira = useConfigureJira();
  const configureLinear = useConfigureLinear();

  const [jiraForm, setJiraForm] = useState({ domain: '', email: '', api_token: '', project_key: '', issue_type: 'Story' });
  const [linearForm, setLinearForm] = useState({ api_key: '', team_id: '' });
  const [jiraError, setJiraError] = useState('');
  const [linearError, setLinearError] = useState('');
  const [jiraSaved, setJiraSaved] = useState(false);
  const [linearSaved, setLinearSaved] = useState(false);

  const handleJiraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJiraError('');
    setJiraSaved(false);
    try {
      const result = await configureJira.mutateAsync(jiraForm);
      if (!result.connected) {
        setJiraError(result.error ?? 'Connection test failed after saving');
      } else {
        setJiraSaved(true);
        setJiraForm(f => ({ ...f, api_token: '' }));
      }
    } catch (err: unknown) {
      setJiraError((err as any)?.response?.data?.detail ?? 'Failed to save Jira config');
    }
  };

  const handleLinearSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinearError('');
    setLinearSaved(false);
    try {
      const result = await configureLinear.mutateAsync(linearForm);
      if (!result.connected) {
        setLinearError(result.error ?? 'Connection test failed after saving');
      } else {
        setLinearSaved(true);
        setLinearForm(f => ({ ...f, api_key: '' }));
      }
    } catch (err: unknown) {
      setLinearError((err as any)?.response?.data?.detail ?? 'Failed to save Linear config');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Integrations</h1>
          <p className="text-slate-500 mt-1">Connect Jira and Linear to sync requirements bidirectionally</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh status
        </button>
      </div>

      {/* Status overview */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h2 className="text-sm font-semibold text-slate-100 mb-4">Connection Status</h2>
        {statusLoading ? (
          <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Checking…</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700">
              <span className="text-sm font-medium text-slate-200">Jira</span>
              {status ? <StatusPill {...status.jira} /> : <span className="text-xs text-slate-500">—</span>}
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700">
              <span className="text-sm font-medium text-slate-200">Linear</span>
              {status ? <StatusPill {...status.linear} /> : <span className="text-xs text-slate-500">—</span>}
            </div>
          </div>
        )}
      </div>

      {/* Jira */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Settings className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Jira</h2>
            <p className="text-xs text-slate-500">Atlassian Jira Cloud</p>
          </div>
          <a
            href="https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            Get API token <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {!isAdmin ? (
          <p className="text-sm text-slate-500">Admin access required to configure integrations.</p>
        ) : (
          <form onSubmit={handleJiraSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Jira Domain</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder="yourcompany"
                    value={jiraForm.domain}
                    onChange={e => setJiraForm(f => ({ ...f, domain: e.target.value }))}
                    required
                    className="flex-1 px-3 py-2 text-sm border border-slate-700 rounded-l-lg bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <span className="px-2 py-2 text-xs text-slate-400 border border-l-0 border-slate-700 rounded-r-lg bg-slate-800">.atlassian.net</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={jiraForm.email}
                  onChange={e => setJiraForm(f => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-700 rounded-lg bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">API Token</label>
                <input
                  type="password"
                  placeholder="Enter token (leave blank to keep existing)"
                  value={jiraForm.api_token}
                  onChange={e => setJiraForm(f => ({ ...f, api_token: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-700 rounded-lg bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Project Key</label>
                <input
                  type="text"
                  placeholder="REQ"
                  value={jiraForm.project_key}
                  onChange={e => setJiraForm(f => ({ ...f, project_key: e.target.value.toUpperCase() }))}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-700 rounded-lg bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Issue Type</label>
                <select
                  value={jiraForm.issue_type}
                  onChange={e => setJiraForm(f => ({ ...f, issue_type: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-700 rounded-lg bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {['Story', 'Task', 'Bug', 'Epic'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {jiraError && <p className="text-xs text-red-400">{jiraError}</p>}
            {jiraSaved && <p className="text-xs text-green-400">Saved and connected successfully.</p>}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={configureJira.isPending}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {configureJira.isPending ? 'Saving & testing…' : 'Save & test connection'}
              </button>
            </div>
          </form>
        )}

        <WebhookUrl path="jira/webhook" label="Jira" />
      </div>

      {/* Linear */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Settings className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Linear</h2>
            <p className="text-xs text-slate-500">Linear.app issue tracking</p>
          </div>
          <a
            href="https://linear.app/settings/api"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            Get API key <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {!isAdmin ? (
          <p className="text-sm text-slate-500">Admin access required to configure integrations.</p>
        ) : (
          <form onSubmit={handleLinearSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">API Key</label>
                <input
                  type="password"
                  placeholder="lin_api_… (leave blank to keep existing)"
                  value={linearForm.api_key}
                  onChange={e => setLinearForm(f => ({ ...f, api_key: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-700 rounded-lg bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Team</label>
                {linearTeams.length > 0 ? (
                  <select
                    value={linearForm.team_id}
                    onChange={e => setLinearForm(f => ({ ...f, team_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-700 rounded-lg bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a team…</option>
                    {linearTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Team ID (save API key first to load teams)"
                    value={linearForm.team_id}
                    onChange={e => setLinearForm(f => ({ ...f, team_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-700 rounded-lg bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                )}
              </div>
            </div>

            {linearError && <p className="text-xs text-red-400">{linearError}</p>}
            {linearSaved && <p className="text-xs text-green-400">Saved and connected successfully.</p>}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={configureLinear.isPending}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {configureLinear.isPending ? 'Saving & testing…' : 'Save & test connection'}
              </button>
            </div>
          </form>
        )}

        <WebhookUrl path="linear/webhook" label="Linear" />
      </div>

      {/* How it works */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h2 className="text-sm font-semibold text-slate-100 mb-3">How it works</h2>
        <ul className="space-y-2 text-sm text-slate-400">
          <li className="flex gap-2"><span className="text-indigo-400 font-bold">→</span> Open any requirement and click <strong className="text-slate-200">Push to Jira</strong> or <strong className="text-slate-200">Push to Linear</strong> to create an issue.</li>
          <li className="flex gap-2"><span className="text-indigo-400 font-bold">→</span> Pushing again on a linked requirement updates the existing issue title and description.</li>
          <li className="flex gap-2"><span className="text-indigo-400 font-bold">→</span> Register the webhook URLs above in your Jira/Linear project settings to sync status changes back automatically.</li>
        </ul>
      </div>
    </div>
  );
}
