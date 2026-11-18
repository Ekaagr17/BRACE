import React, { useEffect, useState } from 'react';
import OrionCard from '@/components/OrionCard';
import NetworkGraph from '@/components/NetworkGraph';
import AnimationControls from '@/components/AnimationControls';
import ExplanationPanel from '@/components/ExplanationPanel';
import Badge from '@/components/Badge';
import { useAttackStore } from '@/store/attackStore';
import useNetworkStore from '@/store/networkStore';
import {
  Flame,
  Shield,
  Activity,
  Layers,
  FileText,
  AlertTriangle,
  Radio,
  Clock,
  Zap,
} from 'lucide-react';
import type { AttackEvent } from '@/types';

const STAGE_BADGES: Record<string, 'cyan' | 'gold' | 'danger' | 'warning' | 'success' | 'neutral' | 'titanium'> = {
  reconnaissance: 'cyan',
  initial_access: 'warning',
  exploitation: 'danger',
  lateral_movement: 'gold',
  objective: 'danger',
  detection: 'titanium',
  containment: 'success',
};

const AttackReconstruction: React.FC = () => {
  const {
    scenarios,
    activeScenario,
    currentEventIndex,
    isPlaying,
    playbackSpeed,
    selectedEvent,
    fetchScenarios,
    loadScenario,
    play,
    pause,
    restart,
    nextEvent,
    prevEvent,
    goToEvent,
    setSpeed,
    selectEvent,
    getExplanation,
  } = useAttackStore();

  const { currentNetwork, loadNetworks } = useNetworkStore();
  const [showAttackPaths, setShowAttackPaths] = useState(true);
  const [scenarioType, setScenarioType] = useState('ransomware');

  useEffect(() => {
    loadNetworks();
    fetchScenarios();
  }, [loadNetworks, fetchScenarios]);

  // Synchronized playback loop driven by isPlaying state
  useEffect(() => {
    if (!isPlaying) return;
    const intervalTime = Math.max(250, Math.round(1500 / playbackSpeed));
    const timer = setInterval(() => {
      const state = useAttackStore.getState();
      if (!state.activeScenario) return;
      if (state.currentEventIndex >= state.activeScenario.events.length - 1) {
        state.pause();
      } else {
        state.nextEvent();
      }
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed]);

  const events = activeScenario?.events || [];
  const currentEvent: AttackEvent | null =
    selectedEvent || (currentEventIndex >= 0 && currentEventIndex < events.length ? events[currentEventIndex] : null);

  // Compute compromised assets up to current step
  const compromisedUpToCurrent = React.useMemo(() => {
    const set = new Set<string>();
    if (!activeScenario || currentEventIndex < 0) return set;
    for (let i = 0; i <= currentEventIndex && i < events.length; i++) {
      if (events[i].success) {
        set.add(events[i].target_asset_id);
      }
    }
    return set;
  }, [activeScenario, currentEventIndex, events]);

  // Active attack path
  const activePath = React.useMemo(() => {
    if (!activeScenario || currentEventIndex < 0 || !showAttackPaths) return [];
    const path: string[] = [];
    for (let i = 0; i <= currentEventIndex && i < events.length; i++) {
      if (events[i].source_asset_id && !path.includes(events[i].source_asset_id)) {
        path.push(events[i].source_asset_id);
      }
      if (events[i].target_asset_id && !path.includes(events[i].target_asset_id)) {
        path.push(events[i].target_asset_id);
      }
    }
    return path;
  }, [activeScenario, currentEventIndex, events, showAttackPaths]);

  const explanation = currentEvent
    ? getExplanation(currentEvent)
    : {
        technical: 'Select an event from the timeline or press Play to reconstruct the cyberattack progression.',
        plain_english: 'The simulation traces how an attacker breaks into the network and moves between computers.',
        why_it_matters: 'Observing attack paths reveals where defensive controls like firewalls and micro-segmentation should be deployed.',
      };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Top Replay & Scenario Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded border border-[#1e2430] bg-[#11141a]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-[#ff1e42]/15 text-[#ff1e42] border border-[#ff1e42]/30">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#f8fafc]">
                {activeScenario?.name || 'Enterprise Multi-Stage Attack Simulation'}
              </h2>
              <Badge variant="danger">LIVE KILL CHAIN</Badge>
            </div>
            <p className="text-xs text-[#8b9bb4]">
              Step-by-step synchronized forensic reconstruction across network topology
            </p>
          </div>
        </div>

        {/* Global Animation Toolbar */}
        <div className="flex items-center gap-3">
          <AnimationControls
            isPlaying={isPlaying}
            onPlay={play}
            onPause={pause}
            onRestart={restart}
            onStepForward={nextEvent}
            onStepBackward={prevEvent}
            speed={playbackSpeed}
            onSpeedChange={setSpeed}
          />

          <button
            onClick={() => setShowAttackPaths(!showAttackPaths)}
            className={`px-3 py-1.5 rounded border text-xs font-mono transition-colors ${
              showAttackPaths
                ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]'
                : 'bg-[#171c24] border-[#1e2430] text-[#8b9bb4]'
            }`}
          >
            {showAttackPaths ? 'Paths ON' : 'Paths OFF'}
          </button>
        </div>
      </div>

      {/* 4-Panel Synchronized Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PANEL 1: Network Canvas (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <OrionCard glow="red" className="p-4 border-[#ff1e42]/40">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-sm bg-[#ff1e42]" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#f8fafc]">
                  1. Network Canvas: Attack Propagation Graph
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#8b9bb4]">
                <span>Step: {currentEventIndex + 1} / {events.length || 0}</span>
                <span className="text-[#ff1e42] font-bold">
                  ({compromisedUpToCurrent.size} Compromised)
                </span>
              </div>
            </div>

            <NetworkGraph
              assets={currentNetwork?.assets || []}
              connections={currentNetwork?.connections || []}
              activeAttackPath={activePath}
              compromisedAssetIds={Array.from(compromisedUpToCurrent)}
              selectedAssetId={currentEvent?.target_asset_id}
              height={480}
            />
          </OrionCard>

          {/* PANEL 4: BRACE Explain (Bottom of Left Column) */}
          <OrionCard glow="gold" className="border-[#d4af37]/40">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#f8fafc] flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#d4af37]" />
                4. BRACE Explain: Multi-Layer Natural Language Intelligence
              </h3>
              <Badge variant="gold">DAA EXPLAINER</Badge>
            </div>
            <ExplanationPanel
              technical={explanation.technical}
              plainEnglish={explanation.plain_english}
              whyItMatters={explanation.why_it_matters}
            />
          </OrionCard>
        </div>

        {/* RIGHT COLUMN (5 Cols): Timeline + Inspector */}
        <div className="lg:col-span-5 space-y-4">
          {/* PANEL 2: Event Timeline */}
          <OrionCard glow="titanium" className="flex flex-col h-[340px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2430] mb-2 flex-shrink-0">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#f8fafc] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#00f0ff]" />
                2. Event Timeline ({events.length} Steps)
              </h3>
              <span className="text-[10px] font-mono text-[#8b9bb4]">Click step to inspect</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {events.length > 0 ? (
                events.map((ev, idx) => {
                  const isCurrent = idx === currentEventIndex;
                  const isSelected = selectedEvent?.id === ev.id;
                  const badgeVar = STAGE_BADGES[ev.stage] || 'neutral';

                  return (
                    <div
                      key={ev.id || idx}
                      onClick={() => {
                        goToEvent(idx);
                        selectEvent(ev);
                      }}
                      className={`p-2.5 rounded border transition-colors cursor-pointer flex items-center justify-between ${
                        isCurrent || isSelected
                          ? 'bg-[#1e2430] border-[#00f0ff] text-[#f8fafc]'
                          : 'bg-[#171c24] border-[#1e2430] hover:bg-[#1e2430]/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-[#8b9bb4] w-6">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-[#f8fafc] truncate max-w-[180px]">
                            {ev.technique || ev.description}
                          </div>
                          <div className="text-[10px] font-mono text-[#8b9bb4]">
                            Target: {ev.target_asset_id}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={badgeVar as any}>{ev.stage.toUpperCase()}</Badge>
                        <span
                          className={`h-2 w-2 rounded-sm ${
                            ev.success ? 'bg-[#ff1e42]' : 'bg-[#00f0ff]'
                          }`}
                          title={ev.success ? 'Breach Succeeded' : 'Blocked'}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-16 text-xs text-[#8b9bb4]">
                  No simulation loaded. Click Play to start.
                </div>
              )}
            </div>
          </OrionCard>

          {/* PANEL 3: Event Inspector */}
          <OrionCard glow="none">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2430] mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#f8fafc] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#d4af37]" />
                3. Event Inspector
              </h3>
              {currentEvent && (
                <Badge variant={currentEvent.success ? 'danger' : 'success'}>
                  {currentEvent.success ? 'EXPLOIT SUCCESSFUL' : 'DEFENSE INTERCEPTED'}
                </Badge>
              )}
            </div>

            {currentEvent ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-[#171c24] border border-[#1e2430]">
                    <span className="text-[10px] text-[#8b9bb4] uppercase font-mono block">
                      Source Node
                    </span>
                    <span className="font-mono text-[#f8fafc]">
                      {currentEvent.source_asset_id || 'Internet (External)'}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-[#171c24] border border-[#1e2430]">
                    <span className="text-[10px] text-[#8b9bb4] uppercase font-mono block">
                      Target Node
                    </span>
                    <span className="font-mono text-[#ff1e42] font-bold">
                      {currentEvent.target_asset_id}
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded bg-[#171c24] border border-[#1e2430]">
                  <span className="text-[10px] text-[#8b9bb4] uppercase font-mono block">
                    Observed Technique
                  </span>
                  <span className="font-semibold text-[#f8fafc]">
                    {currentEvent.technique || 'Remote Exploit Payload'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="p-2 rounded bg-[#171c24] border border-[#1e2430]">
                    <span className="text-[10px] text-[#8b9bb4] uppercase block">Impact Severity</span>
                    <span className="text-[#ff1e42] font-bold text-sm">
                      {currentEvent.impact_score}/10
                    </span>
                  </div>
                  <div className="p-2 rounded bg-[#171c24] border border-[#1e2430]">
                    <span className="text-[10px] text-[#8b9bb4] uppercase block">Kill Chain Stage</span>
                    <span className="text-[#00f0ff] font-bold text-sm">
                      {currentEvent.stage.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-[#8b9bb4] leading-relaxed pt-1">
                  {currentEvent.description}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-[#8b9bb4] text-xs">
                Select an event from the timeline to view forensic details
              </div>
            )}
          </OrionCard>
        </div>
      </div>
    </div>
  );
};

export default AttackReconstruction;
