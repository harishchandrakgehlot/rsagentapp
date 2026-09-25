'use client';

import { Agent, Property } from '@/types';

const AGENTS_KEY = 'rs_cached_agents_v1';
const PROPERTIES_KEY = 'rs_cached_properties_v1';

export function getCachedAgents(): Agent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AGENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setCachedAgents(agents: Agent[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
  } catch {}
}

export function addCachedAgent(agent: Agent) {
  if (typeof window === 'undefined') return;
  try {
    const current = getCachedAgents();
    const existingIdx = current.findIndex(a => a.id === agent.id || a.mobile === agent.mobile);
    let updated: Agent[];
    if (existingIdx >= 0) {
      updated = current.map((a, i) => (i === existingIdx ? agent : a));
    } else {
      updated = [...current, agent];
    }
    setCachedAgents(updated);
  } catch {}
}

export function getCachedProperties(): Property[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PROPERTIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setCachedProperties(props: Property[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROPERTIES_KEY, JSON.stringify(props));
  } catch {}
}

export function addCachedProperty(prop: Property) {
  if (typeof window === 'undefined') return;
  try {
    const current = getCachedProperties();
    const existingIdx = current.findIndex(p => p.id === prop.id || p.name === prop.name);
    let updated: Property[];
    if (existingIdx >= 0) {
      updated = current.map((p, i) => (i === existingIdx ? prop : p));
    } else {
      updated = [...current, prop];
    }
    setCachedProperties(updated);
  } catch {}
}
