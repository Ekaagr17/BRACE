import { create } from 'zustand';
import type { AttackScenario, AttackEvent, AttackExplanation } from '@/types';
import { attackApi } from '@/services/api';

interface AttackState {
  scenarios: AttackScenario[];
  activeScenario: AttackScenario | null;
  currentEventIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;          // 1x, 2x, 4x
  selectedEvent: AttackEvent | null;
  explanations: Record<string, AttackExplanation>;
  compromisedAssets: Set<string>;
  activeEdges: Set<string>;
  loading: boolean;
  error: string | null;

  fetchScenarios: () => Promise<void>;
  setActiveScenario: (scenario: AttackScenario | null) => void;
  loadScenario: (id: string) => Promise<void>;
  play: () => void;
  pause: () => void;
  restart: () => void;
  nextEvent: () => void;
  prevEvent: () => void;
  goToEvent: (index: number) => void;
  setSpeed: (speed: number) => void;
  selectEvent: (event: AttackEvent | null) => void;
  getExplanation: (event: AttackEvent) => AttackExplanation;
}

const stageExplanations: Record<string, { technical: string; plain: string; why: string }> = {
  reconnaissance: {
    technical: 'Attacker performs active/passive reconnaissance, enumerating network services, ports, and potential entry vectors using tools like Nmap, Shodan queries, and OSINT.',
    plain: 'The attacker is scanning the network to find weak points — like a burglar casing a building before breaking in.',
    why: 'Early detection of recon activity can prevent the entire attack chain. IDS/IPS rules for port scanning and unusual DNS queries are critical first-line defenses.',
  },
  initial_access: {
    technical: 'Exploiting identified vulnerability to gain initial foothold. Common vectors include phishing, exploiting public-facing applications (OWASP Top 10), or compromised credentials.',
    plain: 'The attacker found a way in — like finding an unlocked door or using a stolen key to enter the building.',
    why: 'This is the point of no return. Patching vulnerabilities, enforcing MFA, and email filtering are the most cost-effective controls at this stage.',
  },
  lateral_movement: {
    technical: 'Using compromised credentials, pass-the-hash, or exploiting trust relationships to move between network segments and escalate access to high-value targets.',
    plain: 'The attacker is moving from computer to computer inside the network, getting closer to the valuable data.',
    why: 'Network segmentation and micro-segmentation can contain lateral movement. Zero-trust architecture makes each hop require re-authentication.',
  },
  privilege_escalation: {
    technical: 'Exploiting misconfigurations, kernel vulnerabilities, or weak access controls to elevate from user to admin/root privileges.',
    plain: 'The attacker is upgrading their access level — going from a regular user to an administrator who can do anything.',
    why: 'Least-privilege access policies and regular privilege audits can prevent escalation. PAM solutions add critical monitoring.',
  },
  exfiltration: {
    technical: 'Data exfiltration via encrypted channels, DNS tunneling, or cloud storage APIs. Data staged and compressed before transfer to minimize detection.',
    plain: 'The attacker is stealing data — copying sensitive files and sending them out of the network to their own servers.',
    why: 'DLP solutions and egress filtering are the last line of defense. Monitoring for unusual data transfer patterns is essential.',
  },
  impact: {
    technical: 'Final stage: ransomware deployment, data destruction, or persistent backdoor installation for future access.',
    plain: 'The attacker achieves their goal — encrypting files for ransom, destroying data, or setting up secret access for later.',
    why: 'At this point, incident response and backup recovery are the primary controls. The cost of reaching this stage justifies investment in earlier defenses.',
  },
};

function generateExplanation(event: AttackEvent): AttackExplanation {
  const stage = stageExplanations[event.stage] || stageExplanations.reconnaissance;
  return {
    technical: `[${event.technique}] ${stage.technical}\n\nTarget: ${event.target_asset_id} | Impact Score: ${event.impact_score}/10 | Success: ${event.success}`,
    plain_english: stage.plain,
    why_it_matters: `${stage.why}\n\nThis event contributed ${event.impact_score} points to the total attack impact.`,
  };
}

export const useAttackStore = create<AttackState>((set, get) => {
  const initialDemos = getDemoScenarios();
  return {
    scenarios: initialDemos,
    activeScenario: initialDemos[0] || null,
    currentEventIndex: 0,
    isPlaying: false,
    playbackSpeed: 1,
    selectedEvent: initialDemos[0]?.events[0] || null,
    explanations: {},
    compromisedAssets: new Set<string>(
      initialDemos[0]?.events[0]?.success ? [initialDemos[0].events[0].target_asset_id] : []
    ),
    activeEdges: new Set<string>(),
    loading: false,
    error: null,

    fetchScenarios: async () => {
      set({ loading: true, error: null });
      try {
        const res = await attackApi.getScenarios();
        const list = res.data && res.data.length > 0 ? res.data : getDemoScenarios();
        const active = get().activeScenario || list[0];
        set({ scenarios: list, activeScenario: active, loading: false });
      } catch {
        const list = getDemoScenarios();
        const active = get().activeScenario || list[0];
        set({ scenarios: list, activeScenario: active, loading: false });
      }
    },

  setActiveScenario: (scenario) => {
    set({
      activeScenario: scenario,
      currentEventIndex: -1,
      isPlaying: false,
      selectedEvent: null,
      compromisedAssets: new Set<string>(),
      activeEdges: new Set<string>(),
    });
  },

  loadScenario: async (id) => {
    set({ loading: true });
    try {
      const res = await attackApi.getScenario(id);
      get().setActiveScenario(res.data);
      set({ loading: false });
    } catch {
      const demo = getDemoScenarios().find((s) => s.id === id);
      if (demo) get().setActiveScenario(demo);
      set({ loading: false });
    }
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),

  restart: () => {
    set({
      currentEventIndex: -1,
      isPlaying: false,
      selectedEvent: null,
      compromisedAssets: new Set<string>(),
      activeEdges: new Set<string>(),
    });
  },

  nextEvent: () => {
    const { activeScenario, currentEventIndex } = get();
    if (!activeScenario) return;
    const nextIdx = currentEventIndex + 1;
    if (nextIdx >= activeScenario.events.length) {
      set({ isPlaying: false });
      return;
    }
    const event = activeScenario.events[nextIdx];
    const compromised = new Set(get().compromisedAssets);
    const edges = new Set(get().activeEdges);
    if (event.success) {
      compromised.add(event.target_asset_id);
      edges.add(`${event.source_asset_id}->${event.target_asset_id}`);
    }
    set({
      currentEventIndex: nextIdx,
      selectedEvent: event,
      compromisedAssets: compromised,
      activeEdges: edges,
    });
  },

  prevEvent: () => {
    const { activeScenario, currentEventIndex } = get();
    if (!activeScenario || currentEventIndex <= 0) return;
    // Rebuild state from beginning up to prev index
    const prevIdx = currentEventIndex - 1;
    const compromised = new Set<string>();
    const edges = new Set<string>();
    for (let i = 0; i <= prevIdx; i++) {
      const ev = activeScenario.events[i];
      if (ev.success) {
        compromised.add(ev.target_asset_id);
        edges.add(`${ev.source_asset_id}->${ev.target_asset_id}`);
      }
    }
    set({
      currentEventIndex: prevIdx,
      selectedEvent: activeScenario.events[prevIdx],
      compromisedAssets: compromised,
      activeEdges: edges,
    });
  },

  goToEvent: (index) => {
    const { activeScenario } = get();
    if (!activeScenario || index < 0 || index >= activeScenario.events.length) return;
    const compromised = new Set<string>();
    const edges = new Set<string>();
    for (let i = 0; i <= index; i++) {
      const ev = activeScenario.events[i];
      if (ev.success) {
        compromised.add(ev.target_asset_id);
        edges.add(`${ev.source_asset_id}->${ev.target_asset_id}`);
      }
    }
    set({
      currentEventIndex: index,
      selectedEvent: activeScenario.events[index],
      compromisedAssets: compromised,
      activeEdges: edges,
    });
  },

  setSpeed: (speed) => set({ playbackSpeed: speed }),

  selectEvent: (event) => set({ selectedEvent: event }),

  getExplanation: (event) => {
    return generateExplanation(event);
  },
};
});

// ---- Demo attack scenarios ----
function getDemoScenarios(): AttackScenario[] {
  return [
    {
      id: 'scenario-1',
      name: 'APT Lateral Movement Campaign',
      description: 'Advanced persistent threat actor targets corporate network through phishing, moves laterally to database server, and exfiltrates sensitive data.',
      total_impact: 87,
      duration_seconds: 3600,
      attack_paths: [['asset-0', 'asset-1', 'asset-3', 'asset-5', 'asset-4']],
      events: [
        { id: 'ev-1', timestamp: 0, stage: 'reconnaissance', source_asset_id: 'external', target_asset_id: 'asset-0', technique: 'Port Scanning (T1046)', description: 'Attacker scans edge firewall for open ports and services.', success: true, impact_score: 1 },
        { id: 'ev-2', timestamp: 120, stage: 'reconnaissance', source_asset_id: 'external', target_asset_id: 'asset-2', technique: 'Web Enumeration (T1595)', description: 'Directory brute-force and technology fingerprinting on web server.', success: true, impact_score: 2 },
        { id: 'ev-3', timestamp: 300, stage: 'initial_access', source_asset_id: 'external', target_asset_id: 'asset-2', technique: 'SQL Injection (T1190)', description: 'Exploits SQL injection in web application to gain shell access.', success: true, impact_score: 8 },
        { id: 'ev-4', timestamp: 480, stage: 'privilege_escalation', source_asset_id: 'asset-2', target_asset_id: 'asset-2', technique: 'Kernel Exploit (T1068)', description: 'Escalates from www-data to root using kernel vulnerability.', success: true, impact_score: 7 },
        { id: 'ev-5', timestamp: 720, stage: 'lateral_movement', source_asset_id: 'asset-2', target_asset_id: 'asset-3', technique: 'SSH Pivot (T1021.004)', description: 'Uses harvested SSH keys to pivot to application server.', success: true, impact_score: 9 },
        { id: 'ev-6', timestamp: 900, stage: 'lateral_movement', source_asset_id: 'asset-3', target_asset_id: 'asset-5', technique: 'Pass-the-Hash (T1550.002)', description: 'Extracts cached credentials and authenticates to admin workstation.', success: false, impact_score: 0 },
        { id: 'ev-7', timestamp: 1100, stage: 'lateral_movement', source_asset_id: 'asset-3', target_asset_id: 'asset-4', technique: 'Database Credential Theft (T1555)', description: 'Reads database connection string from application config and connects to primary DB.', success: true, impact_score: 10 },
        { id: 'ev-8', timestamp: 1400, stage: 'exfiltration', source_asset_id: 'asset-4', target_asset_id: 'asset-4', technique: 'Data Staging (T1074)', description: 'Dumps customer PII and financial records from database.', success: true, impact_score: 10 },
        { id: 'ev-9', timestamp: 1800, stage: 'exfiltration', source_asset_id: 'asset-4', target_asset_id: 'external', technique: 'DNS Tunneling (T1048.001)', description: 'Exfiltrates compressed database dump via DNS tunneling to C2 server.', success: true, impact_score: 10 },
        { id: 'ev-10', timestamp: 2400, stage: 'impact', source_asset_id: 'asset-3', target_asset_id: 'asset-4', technique: 'Ransomware (T1486)', description: 'Deploys ransomware to encrypt database and application files.', success: true, impact_score: 10 },
      ],
    },
    {
      id: 'scenario-2',
      name: 'IoT Botnet Infiltration',
      description: 'Compromised IoT device used as pivot point to access internal network infrastructure.',
      total_impact: 54,
      duration_seconds: 1800,
      attack_paths: [['asset-7', 'asset-1', 'asset-9']],
      events: [
        { id: 'ev-20', timestamp: 0, stage: 'reconnaissance', source_asset_id: 'external', target_asset_id: 'asset-7', technique: 'Shodan Discovery (T1596)', description: 'IoT gateway discovered via Shodan with default credentials.', success: true, impact_score: 3 },
        { id: 'ev-21', timestamp: 60, stage: 'initial_access', source_asset_id: 'external', target_asset_id: 'asset-7', technique: 'Default Credentials (T1078)', description: 'Logs into IoT gateway using factory-default admin:admin credentials.', success: true, impact_score: 6 },
        { id: 'ev-22', timestamp: 180, stage: 'lateral_movement', source_asset_id: 'asset-7', target_asset_id: 'asset-1', technique: 'Network Pivot (T1090)', description: 'Uses IoT gateway network access to reach core router.', success: true, impact_score: 8 },
        { id: 'ev-23', timestamp: 360, stage: 'lateral_movement', source_asset_id: 'asset-1', target_asset_id: 'asset-9', technique: 'SMTP Exploit (T1203)', description: 'Exploits unpatched mail server vulnerability from router segment.', success: true, impact_score: 7 },
        { id: 'ev-24', timestamp: 600, stage: 'exfiltration', source_asset_id: 'asset-9', target_asset_id: 'external', technique: 'Email Exfiltration (T1048.002)', description: 'Exfiltrates employee mailbox data through compromised mail server.', success: true, impact_score: 9 },
      ],
    },
  ];
}

export { getDemoScenarios };
