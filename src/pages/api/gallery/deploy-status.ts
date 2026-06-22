import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  const token = import.meta.env.GITHUB_TOKEN;
  const repo  = import.meta.env.GITHUB_REPO;

  if (!token || !repo) {
    return new Response(
      JSON.stringify({ status: 'unknown', error: 'GITHUB_TOKEN o GITHUB_REPO no configurados' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/actions/runs?per_page=1&branch=${import.meta.env.GITHUB_BRANCH ?? 'main'}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!res.ok) throw new Error(`GitHub API ${res.status}`);

    const data = await res.json();
    const run = data.workflow_runs?.[0];

    if (!run) {
      return new Response(JSON.stringify({ status: 'unknown' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    let status: string;
    if (run.status === 'completed') {
      status = run.conclusion === 'success' ? 'success' : 'failure';
    } else if (run.status === 'in_progress') {
      status = 'running';
    } else {
      status = 'pending';
    }

    return new Response(
      JSON.stringify({ status, startedAt: run.created_at, finishedAt: run.updated_at ?? null, url: run.html_url }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ status: 'unknown', error: String(err) }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
