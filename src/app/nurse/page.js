'use client';

import { useState, useEffect } from 'react';
import DisclaimerBanner from '@/components/DisclaimerBanner';
import NursePatientList from '@/components/NursePatientList';
import PatientDetailDrawer from '@/components/PatientDetailDrawer';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function NurseDashboardPage() {
  const [patients, setPatients] = useState([]);
  const [helpAlerts, setHelpAlerts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/triage')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPatients(data.patients);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));

    const eventSource = new EventSource('/api/triage/stream');
    eventSource.addEventListener('triage_update', (e) => {
      const payload = JSON.parse(e.data);
      if (payload.patients) setPatients(payload.patients);
      if (payload.helpAlerts) setHelpAlerts(payload.helpAlerts);
    });

    return () => eventSource.close();
  }, []);

  // look up each render so the drawer gets live updates
  const selectedPatient = patients.find((p) => p.id === selectedId);

  const handleResetQueue = async () => {
    if (!confirm('Remove all check-ins and reload the five sample patients?')) return;
    try {
      const res = await fetch('/api/triage', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPatients(data.patients);
        setHelpAlerts([]);
        setSelectedId(null);
      }
    } catch {
      // stream will resync
    }
  };

  const handleDismissHelp = async (alertId) => {
    try {
      await fetch(`/api/help?id=${alertId}`, { method: 'DELETE' });
      setHelpAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch {
      // ignore
    }
  };

  const handleUpdateNurseAction = async (patientId, actionData) => {
    try {
      const res = await fetch(`/api/nurse/${patientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionData),
      });

      const data = await res.json();
      if (data.success) {
        setPatients((prev) => prev.map((p) => (p.id === patientId ? data.patient : p)));
      }
    } catch (e) {
      console.error('Failed to save nurse action:', e);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between font-sans">
      <header className="px-6 py-4 border-b border-zinc-200 bg-white flex items-center justify-between text-black">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="text-sm font-medium text-zinc-500">Nurse station</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/kiosk"
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-black hover:text-blue-600 bg-white border border-zinc-300 px-3 py-1.5 rounded transition-colors"
          >
            Kiosk
          </Link>
          <Link
            href="/board"
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-black hover:text-blue-600 bg-white border border-zinc-300 px-3 py-1.5 rounded transition-colors"
          >
            Waiting room
          </Link>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full bg-white text-black">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
            <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-sans text-zinc-600 font-bold">Connecting to Triage Engine...</span>
          </div>
        ) : (
          <NursePatientList
            patients={patients}
            helpAlerts={helpAlerts}
            onSelectPatient={(p) => setSelectedId(p.id)}
            onResetQueue={handleResetQueue}
            onDismissHelp={handleDismissHelp}
          />
        )}
      </main>

      {selectedPatient && (
        <PatientDetailDrawer
          key={selectedPatient.id}
          patient={selectedPatient}
          onClose={() => setSelectedId(null)}
          onUpdateNurseAction={handleUpdateNurseAction}
        />
      )}

      <DisclaimerBanner />
    </div>
  );
}
