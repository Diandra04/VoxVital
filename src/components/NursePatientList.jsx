import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Heart,
  Wind,
  Globe,
  CheckCircle2,
  UserCheck,
  RotateCcw,
  HelpCircle,
  AlertCircle,
  X,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { topReason, hasTrueRedFlag, capitalizeName } from '@/lib/triageEngine';

// Minutes between vitals re-checks for each CTAS level
const RECHECK_INTERVAL_MINS = { 1: 10, 2: 15, 3: 30, 4: 60, 5: 120 };

const ACTIVE_NURSE = 'RN Didi';

const minutesSince = (ts, now) => Math.max(0, Math.floor((now - new Date(ts).getTime()) / 60000));

function formatDuration(mins) {
  if (mins === 0) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatWaitTime(timestamp, now) {
  if (!timestamp) return 'Just now';
  const mins = minutesSince(timestamp, now);
  return mins === 0 ? 'Just now' : `Waiting ${formatDuration(mins)}`;
}

function formatTimeAgo(ts, now) {
  if (!ts) return 'Just now';
  const mins = minutesSince(ts, now);
  return mins === 0 ? 'Just now' : `${formatDuration(mins)} ago`;
}

function formatClockTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function redFlagLabel(p) {
  const rf = (p.redFlags?.[0] || '').toLowerCase();
  if (rf.includes('chest')) return 'Chest pain';
  if (rf.includes('stroke')) return 'Stroke alert';
  if (rf.includes('breathing') || rf.includes('respiratory')) return 'Severe dyspnea';
  return 'Red Flag';
}

function waitStatusLabel(p, now) {
  if (p.status === 'called') return `Called ${formatClockTime(p.updatedAt)}`;
  if (p.status === 'seen') return `Seen ${formatClockTime(p.updatedAt)}`;
  if (p.status === 'confirmed') return `Triaged ${formatClockTime(p.confirmedAt || p.updatedAt)}`;
  return formatWaitTime(p.timestamp, now);
}

// Short chip labels for the row, so long rule text doesn't flood the list
function shortTag(text) {
  const s = text.toLowerCase();
  if (s.includes('lethargy') || s.includes('sleepy')) return 'Lethargy';
  if (s.includes('refusing milk') || s.includes("won't drink") || s.includes('poor feeding') || s.includes('fluid refusal')) return 'Poor feeding';
  if (s.includes('fever')) return 'High fever';
  if (s.includes('chest pain') || s.includes('substernal')) return 'Chest pain';
  if (s.includes('worsening')) return 'Condition worsening';
  if (s.includes('infant')) return 'Infant';
  return text.replace(/^PaedCTAS\s+[^:]+:\s*/i, '').replace(/^High-risk\s+[^:]+:\s*/i, '');
}

export default function NursePatientList({
  patients,
  helpAlerts = [],
  onSelectPatient,
  onResetQueue,
  onDismissHelp,
}) {
  const [filterStatus, setFilterStatus] = useState('waiting');
  const [helpExpanded, setHelpExpanded] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const knownIds = useRef(new Set(patients.map((p) => p.id)));

  // Keeps wait times and the "just updated" highlight current
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Chime when a new high-acuity patient arrives
  useEffect(() => {
    const arrivals = patients.filter((p) => !knownIds.current.has(p.id));
    knownIds.current = new Set(patients.map((p) => p.id));

    if (arrivals.some((p) => hasTrueRedFlag(p) || p.suggestedLevel <= 2)) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } catch {
        // audio blocked until the page has had a user gesture
      }
    }
  }, [patients]);

  // Rows scanned in the last 15s get highlighted so the change is easy to spot
  const isRecentlyUpdated = (p) => {
    const rescanMs = p.rescanTimestamp ? new Date(p.rescanTimestamp).getTime() : 0;
    const scanMs = p.vitals?.source === 'camera' ? p.vitals.measuredAt : 0;
    return now - Math.max(rescanMs, scanMs) < 15000;
  };

  // One entry per kiosk, keeping the oldest request time
  const mergedHelpAlerts = useMemo(() => {
    if (!helpAlerts || helpAlerts.length === 0) return [];

    const map = new Map();
    const sorted = [...helpAlerts].sort(
      (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
    );

    sorted.forEach((alert) => {
      const loc = alert.location || 'Walk-up Kiosk 1';
      if (!map.has(loc)) {
        map.set(loc, {
          location: loc,
          oldestTimestamp: alert.timestamp,
          ids: [alert.id],
        });
      } else {
        map.get(loc).ids.push(alert.id);
      }
    });

    return Array.from(map.values());
  }, [helpAlerts]);

  const filteredPatients = patients.filter((p) => p.status === filterStatus);
  const waitingPatients = patients.filter((p) => p.status === 'waiting');
  const redFlagsCount = waitingPatients.filter(hasTrueRedFlag).length;
  const longestWaitMinutes = Math.max(0, ...waitingPatients.filter((p) => p.timestamp).map((p) => minutesSince(p.timestamp, now)));

  // Opening a red-flag patient counts as acknowledging the alert
  const handleOpenPatient = (p) => {
    if (hasTrueRedFlag(p) && p.alert && !p.alert.ackAt) {
      fetch(`/api/nurse/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ackAlert: true, nurseName: ACTIVE_NURSE }),
      }).catch(() => {});
    }
    onSelectPatient(p);
  };

  return (
    <div className="w-full space-y-3 bg-white text-black font-sans pb-12">
      {mergedHelpAlerts.length > 0 && (
        <div className="w-full bg-red-50 border-2 border-red-400 rounded-xl overflow-hidden shadow-xs transition-all text-red-950 font-sans">
          <div
            onClick={() => setHelpExpanded(!helpExpanded)}
            className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-red-100/80 transition-colors"
          >
            <div className="flex items-center gap-2 text-xs font-extrabold text-red-900">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                {mergedHelpAlerts.length} urgent request{mergedHelpAlerts.length > 1 ? 's' : ''} at the kiosk
                <span className="mx-1 text-red-700">·</span>
                <span className="underline font-extrabold text-red-800">{helpExpanded ? 'Hide' : 'View'}</span>
              </span>
            </div>
          </div>

          {helpExpanded && (
            <div className="px-4 pb-3 pt-1 border-t border-red-200 space-y-2 bg-red-50/50">
              {mergedHelpAlerts.map((item) => (
                <div
                  key={item.location}
                  className="flex items-center justify-between p-2 rounded-lg bg-white border border-red-200 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2 font-medium text-black">
                    <span className="font-extrabold text-red-950">{item.location}</span>
                    <span className="text-zinc-600">• {formatWaitTime(item.oldestTimestamp, now)}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      item.ids.forEach((id) => onDismissHelp(id));
                    }}
                    className="py-1 px-3 rounded bg-red-600 text-white text-[11px] font-extrabold hover:bg-red-700 transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <span>Done</span>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3 text-xs font-sans">
        <div className="flex items-center gap-1 p-1 bg-zinc-100/80 rounded-xl border border-zinc-200/60">
          {[
            { id: 'waiting', label: 'Waiting' },
            { id: 'confirmed', label: 'Triaged' },
            { id: 'called', label: 'Called' },
            { id: 'seen', label: 'Seen' },
          ].map((tab) => {
            const count = patients.filter((p) => p.status === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs transition-all ${
                  filterStatus === tab.id
                    ? 'bg-white text-zinc-900 shadow-2xs font-bold border border-zinc-200/80'
                    : 'text-zinc-600 hover:text-zinc-900 font-medium hover:bg-zinc-200/50'
                }`}
              >
                {tab.label} <span className="ml-1 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-zinc-600 font-medium">
          <div className="flex items-center gap-1.5">
            <span className={redFlagsCount > 0 ? 'text-red-600 font-extrabold' : 'text-zinc-500 font-medium'}>
              {redFlagsCount} {redFlagsCount === 1 ? 'red flag' : 'red flags'}
            </span>
            <span className="text-zinc-400">·</span>
            <span className="text-zinc-500 font-medium">longest wait {formatDuration(longestWaitMinutes)}</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-800 text-xs font-bold flex items-center gap-1 shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Demo</span>
            </button>

            {showDemoMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-zinc-300 rounded-xl shadow-xl z-50 p-1 space-y-1">
                <button
                  onClick={() => { onResetQueue(); setShowDemoMenu(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-red-700 hover:bg-red-50 flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-red-600" />
                  <span>Reset sample patients</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="bg-zinc-50 rounded-2xl p-12 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-zinc-300 mx-auto" />
          <h3 className="text-base font-medium text-zinc-600">No patients in this tab</h3>
        </div>
      ) : (
        <div className="divide-y divide-zinc-200/80">
          {filteredPatients.map((patient) => {
            const currentLevel = patient.confirmedLevel || patient.nurseOverrideLevel || patient.suggestedLevel;
            const isEmergent = currentLevel <= 2;
            const isUrgent = currentLevel === 3;
            const isConfirmed = patient.status !== 'waiting';
            const isSuggested = !patient.confirmedLevel && !patient.nurseOverrideLevel;

            // Hollow circle while suggested, filled once a nurse confirms
            let circleClass = '';
            if (isEmergent) {
              circleClass = isSuggested
                ? 'border-2 border-red-600 text-red-600 bg-white font-extrabold'
                : 'bg-red-600 text-white font-extrabold';
            } else if (isUrgent) {
              circleClass = isSuggested
                ? 'border-2 border-amber-500 text-amber-600 bg-white font-extrabold'
                : 'bg-amber-500 text-white font-extrabold';
            } else {
              circleClass = isSuggested
                ? 'border-2 border-emerald-600 text-emerald-600 bg-white font-extrabold'
                : 'bg-emerald-600 text-white font-extrabold';
            }

            const vitalsObj = patient.vitals;
            const vitalsAgeMins = minutesSince(vitalsObj?.measuredAt || patient.timestamp, now);
            const isStale = vitalsAgeMins > (RECHECK_INTERVAL_MINS[currentLevel] || 30);
            const isLowConfidence = vitalsObj?.source === 'camera' && vitalsObj?.pulseConf !== null && vitalsObj?.pulseConf < 0.7;

            const isPulseAbnormal = patient.pulse != null && (patient.pulse >= 100 || patient.pulse < 50);
            const isBreathingAbnormal = patient.breathingRate != null && (patient.breathingRate >= 22 || patient.breathingRate <= 10);

            let stampLabel = null;
            if (isConfirmed) {
              const nurseWho = patient.confirmedBy || ACTIVE_NURSE;
              const timeStr = formatClockTime(patient.confirmedAt || patient.updatedAt);
              if (patient.confirmedLevel && patient.confirmedLevel !== patient.suggestedLevel) {
                stampLabel = `Confirmed by ${nurseWho} · ${timeStr} (suggested L${patient.suggestedLevel})`;
              } else {
                stampLabel = `Confirmed by ${nurseWho} · ${timeStr}`;
              }
            }

            const isRedFlagPatient = hasTrueRedFlag(patient);
            const justUpdated = isRecentlyUpdated(patient);

            const formattedAgeDisplay = patient.age?.includes('mo') || patient.age?.includes('m')
              ? (patient.age.includes('mo') ? patient.age : `${patient.age.replace('m', '')} mo`)
              : patient.age;

            let whyText = topReason(patient);
            if (!whyText || whyText.includes('routine') || whyText.includes('Standard')) {
              const isNormalVitals = !patient.pulse || (patient.pulse < 100 && (patient.breathingRate || 16) < 22);
              whyText = isNormalVitals ? 'Stable vital signs · non-urgent' : 'Elevated vital signs';
            }

            const rawName = patient.name?.trim();
            const cleanName = rawName && rawName !== 'Walk-up Patient' && !rawName.startsWith('Ticket ') ? capitalizeName(rawName) : null;
            const displayName = cleanName || (patient.ticketNumber || (patient.id ? `A-${patient.id.slice(-4).toUpperCase()}` : 'A-17'));

            // Skip tags that repeat the reason line or each other
            const whyLower = whyText.toLowerCase();
            const cleanTags = [];
            for (const flag of [...(patient.redFlags || []), ...(patient.mismatchFlags || [])]) {
              const tag = shortTag(flag);
              const tagLower = tag.toLowerCase();
              const repeatsReason = whyLower.includes(tagLower) || (tagLower.length > 5 && whyLower.includes(tagLower.slice(0, 5)));
              if (!repeatsReason && !cleanTags.some((t) => t.toLowerCase() === tagLower)) {
                cleanTags.push(tag);
              }
            }

            return (
              <div
                key={patient.id}
                onClick={() => handleOpenPatient(patient)}
                className={`group relative w-full py-3.5 px-3 transition-colors duration-200 cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-200/80 ${
                  justUpdated
                    ? 'bg-emerald-50/90 ring-2 ring-emerald-500 rounded-xl shadow-md'
                    : patient.status === 'seen'
                    ? 'bg-white opacity-40 grayscale hover:bg-zinc-100/80'
                    : 'bg-white hover:bg-zinc-100/80'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    <span
                      title={isSuggested ? 'Suggested CTAS Level' : `Confirmed by ${patient.confirmedBy || ACTIVE_NURSE}`}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-2xs ${circleClass}`}
                    >
                      {currentLevel}
                    </span>
                    {isConfirmed && stampLabel && (
                      <span className="text-[11px] px-2 py-0.5 rounded border border-solid border-zinc-300 text-zinc-700 bg-zinc-100 font-medium">
                        {stampLabel}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-black text-base group-hover:underline">
                        {displayName} {patient.pronouns ? `(${patient.pronouns})` : ''} · {formattedAgeDisplay} · {patient.sex}
                      </span>

                      <span className="text-xs text-zinc-500 font-medium">
                        · {waitStatusLabel(patient, now)}
                      </span>

                      {justUpdated && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-extrabold shadow-2xs animate-pulse">
                          <RefreshCw className="w-3 h-3 text-white animate-spin" />
                          <span>Updated just now</span>
                        </span>
                      )}

                      {isRedFlagPatient && !justUpdated && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-xs font-extrabold shadow-2xs">
                          <span>{redFlagLabel(patient)}</span>
                        </span>
                      )}

                      {patient.who === 'assisted' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-200/70 text-zinc-800 text-xs font-normal">
                          <HelpCircle className="w-3 h-3 text-zinc-700" /> Assisted
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-200/70 text-zinc-800 text-xs font-normal">
                        <Globe className="w-3 h-3 text-zinc-700" />
                        {patient.language}
                      </span>

                      {patient.needsInterpreter && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 text-xs font-bold">
                          Needs interpreter
                        </span>
                      )}

                      {patient.callVisually && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300 text-xs font-bold">
                          Call visually
                        </span>
                      )}
                    </div>

                    {(patient.recheckRequested || patient.rescanTimestamp) && !justUpdated && (
                      <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80 w-fit my-1">
                        <RefreshCw className="w-3 h-3 text-amber-700 shrink-0" />
                        <span>Feeling worse · rescanned {formatTimeAgo(patient.rescanTimestamp || patient.updatedAt, now)}</span>
                      </div>
                    )}

                    <p className="text-xs text-zinc-800 font-medium truncate">
                      {patient.chiefComplaint}
                    </p>

                    <div className="text-xs text-zinc-600 font-normal">
                      <span className="font-bold text-zinc-900">Reason:</span> {whyText}
                    </div>

                    {cleanTags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {cleanTags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-zinc-100 text-zinc-700 border border-zinc-200/80 font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end shrink-0">
                  <div className="flex flex-col items-end gap-1 text-xs">
                    {patient.vitalsSkipped || !patient.pulse ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPatient(patient);
                          setTimeout(() => {
                            const el = document.getElementById('nurse-vitals-form');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }, 150);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-900 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-zinc-800" />
                        <span>Nurse vitals needed</span>
                      </button>
                    ) : (
                      <>
                        {patient.previousPulse && patient.previousPulse !== patient.pulse && (
                          <div className="text-xs font-black text-red-600 flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            <span>Pulse {patient.previousPulse} → {patient.pulse} {patient.pulse > patient.previousPulse ? '↑' : '↓'}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 font-bold text-xs">
                          <span className={`inline-flex items-center gap-1 ${isPulseAbnormal ? 'text-red-600 font-extrabold' : 'text-zinc-700 font-bold'}`}>
                            <Heart className={`w-3.5 h-3.5 ${isPulseAbnormal ? 'text-red-600' : 'text-zinc-400'}`} />
                            <span>{patient.pulse} bpm</span>
                          </span>
                          <span className={`inline-flex items-center gap-1 ${isBreathingAbnormal ? 'text-red-600 font-extrabold' : 'text-zinc-700 font-bold'}`}>
                            <Wind className={`w-3.5 h-3.5 ${isBreathingAbnormal ? 'text-red-600' : 'text-zinc-400'}`} />
                            <span>{patient.breathingRate} breaths/min</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-zinc-500 font-medium">
                            {vitalsObj?.source === 'nurse' ? 'Nurse' : 'Camera'} · {vitalsAgeMins === 0 ? 'Just now' : `${formatDuration(vitalsAgeMins)} ago`}
                          </span>

                          {patient.recheckRequestedByNurse ? (
                            <span className="text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                              <RefreshCw className="w-3 h-3 text-amber-700 animate-spin" />
                              <span>Re-check sent · {formatTimeAgo(patient.recheckRequestedAt || patient.updatedAt, now)}</span>
                            </span>
                          ) : isStale ? (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                await fetch(`/api/nurse/${patient.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ requestRecheck: true, nurseName: ACTIVE_NURSE }),
                                });
                              }}
                              className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                            >
                              <RefreshCw className="w-3 h-3 text-amber-700" />
                              <span>Re-check due</span>
                            </button>
                          ) : null}

                          {isLowConfidence && !isStale && (
                            <span className="text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded ml-1">low confidence</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
