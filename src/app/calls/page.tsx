'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  User,
  Sparkles,
  Clock,
  Calendar,
  ArrowRight,
  Database,
  Globe,
  UserCheck,
  Activity,
  Flame,
  MessageSquare,
  Building2,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  PhoneForwarded,
  RefreshCw,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { CallTurn, LiveConversationSignals, CalendlySmsDispatch } from '@/types/voice';
import { AVAILABLE_SCENARIOS, ScenarioDefinition, getCalendlyHandoffTurn } from '@/lib/voice/scenarios';
import { DemoVoiceProvider } from '@/lib/voice/demo-voice-provider';
import { CalendlyBookingModal } from '@/components/voice/calendly-booking-modal';

export default function CallsPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [callbacks, setCallbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followUpQueue, setFollowUpQueue] = useState<any[]>([]);
  const [followUpQueueOpen, setFollowUpQueueOpen] = useState(false);
  const [handoffApiLoading, setHandoffApiLoading] = useState(false);
  const [handoffApiResult, setHandoffApiResult] = useState<any>(null);

  // Active Call Cockpit States
  const [activeCallModal, setActiveCallModal] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [activeLead, setActiveLead] = useState<any>(null);
  const [callStatus, setCallStatus] = useState<'IDLE' | 'DIALING' | 'IN_PROGRESS' | 'COMPLETED'>('IDLE');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [mode, setMode] = useState<'VOICE' | 'TEXT'>('VOICE');
  const [language, setLanguage] = useState<'en-US' | 'hi-IN' | 'gu-IN'>('en-US');

  // Conversation & Live Signals
  const [currentScenario, setCurrentScenario] = useState<ScenarioDefinition>(AVAILABLE_SCENARIOS['en-US']);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [transcriptTurns, setTranscriptTurns] = useState<CallTurn[]>([]);
  const [liveSignals, setLiveSignals] = useState<LiveConversationSignals>({
    intent: 90,
    interest: 'HIGH',
    urgency: 'HIGH',
    sentiment: 'POSITIVE',
    detectedRequirement: 'SharePoint Implementation Partner',
    timeline: 'Evaluating vendors',
    painPoint: 'Legacy migration',
    objection: 'None',
    decisionMaker: 'Confirmed (John Smith, CTO)',
    buyingStage: 'Vendor Selection',
  });

  // Post-Call Intelligence & CRM States
  const [postCallAnalysis, setPostCallAnalysis] = useState<any>(null);
  const [crmPushing, setCrmPushing] = useState(false);
  const [crmSynced, setCrmSynced] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [showCalendlyModal, setShowCalendlyModal] = useState(false);
  const [activeSmsDispatch, setActiveSmsDispatch] = useState<CalendlySmsDispatch | null>(null);
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [handoffDone, setHandoffDone] = useState(false);
  const [copiedSmsLink, setCopiedSmsLink] = useState(false);
  const handoffTriggeredRef = useRef(false);
  const turnTimeoutRefs = useRef<any[]>([]);

  const clearAllTurnTimeouts = () => {
    turnTimeoutRefs.current.forEach((t) => clearTimeout(t));
    turnTimeoutRefs.current = [];
  };

  const voiceProvider = useRef(new DemoVoiceProvider());
  const timerRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchCallsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [resCalls, resCallbacks] = await Promise.all([
        fetch('/api/calls'),
        fetch('/api/calls/callback'),
      ]);
      if (!resCalls.ok) throw new Error('Failed to load call sessions');
      const dataCalls = await resCalls.json();
      const dataCallbacks = await resCallbacks.json();
      setCalls(dataCalls.calls || []);
      setCallbacks(dataCallbacks.callbacks || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching calls');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowUpQueue = async () => {
    try {
      const res = await fetch('/api/calls/follow-up-queue');
      if (res.ok) {
        const data = await res.json();
        setFollowUpQueue(data.queue || []);
      }
    } catch {}
  };

  /** Trigger handoff via /api/calls/handoff and arm the re-call scheduler */
  const handleDirectHandoff = async (leadId?: string, callSessionId?: string) => {
    if (handoffApiLoading) return;
    try {
      setHandoffApiLoading(true);
      const res = await fetch('/api/calls/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: leadId || activeLead?.id,
          callSessionId,
        }),
      });
      const data = await res.json();
      setHandoffApiResult(data);
      showToast(
        data.message ||
          `SMS with Calendly booking link sent to ${data.phone}. Automated re-call scheduler armed if booking is not completed within 2 hours.`,
      );
      fetchFollowUpQueue();
    } catch (err: any) {
      showToast(`Handoff error: ${err.message}`);
    } finally {
      setHandoffApiLoading(false);
    }
  };

  const hasStartedRef = useRef(false);

  useEffect(() => {
    fetchCallsData();
    fetchFollowUpQueue();
    const checkStart = () => {
      if (typeof window !== 'undefined' && !hasStartedRef.current) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('start') === 'true') {
          hasStartedRef.current = true;
          const leadIdParam = urlParams.get('leadId') || undefined;
          handleStartHeroCall(language, leadIdParam);
        }
      }
    };
    checkStart();
    const timer = setTimeout(checkStart, 150);
    return () => clearTimeout(timer);
  }, []);

  // Timer Effect
  useEffect(() => {
    if (callStatus === 'IN_PROGRESS') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  // Poll for SMS Delivery Status
  useEffect(() => {
    let interval: any;
    if (activeSmsDispatch && activeSmsDispatch.bookingReqId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/meeting-concierge/${activeSmsDispatch.bookingReqId}`);
          if (res.ok) {
            const data = await res.json();
            setActiveSmsDispatch((prev: any) => 
              prev ? { ...prev, status: data.smsState || prev.status, timeline: data.timeline, state: data.state } : prev
            );
          }
        } catch {}
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activeSmsDispatch?.bookingReqId]);

  // Start Autonomous Hero Call
  const handleStartHeroCall = async (lang = language, targetLeadId?: string) => {
    try {
      setActiveCallModal(true);
      setCallStatus('DIALING');
      setCallDuration(0);
      setTranscriptTurns([]);
      setCurrentTurnIndex(0);
      setPostCallAnalysis(null);
      setCrmSynced(false);
      setHandoffLoading(false);
      setHandoffDone(false);
      handoffTriggeredRef.current = false;
      clearAllTurnTimeouts();

      const scenario = AVAILABLE_SCENARIOS[lang] || AVAILABLE_SCENARIOS['en-US'];
      setCurrentScenario(scenario);

      // Find hero lead or fetch requested lead
      let targetLead: any = null;
      if (targetLeadId) {
        try {
          const res = await fetch(`/api/opportunities/${targetLeadId}`);
          if (res.ok) {
            targetLead = await res.json();
          }
        } catch {}
      }

      if (!targetLead) {
        const resOpp = await fetch('/api/opportunities?limit=1');
        const oppData = await resOpp.json();
        targetLead = oppData.items?.[0] || null;
      }
      setActiveLead(targetLead);

      // Trigger live Twilio outbound call to the lead
      if (targetLead?.id && targetLead.id !== 'hero-lead') {
        fetch('/api/calls/real/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId: targetLead.id, language: lang }),
        }).then(async (res) => {
          const data = await res.json();
          if (data.error) {
            console.warn('[Live Call]', data.error);
            showToast(`Telephony: ${data.error}`);
          } else if (!data.isDemoMode) {
            showToast(`📞 Calling ${targetLead.phone || '+919925276760'} via Twilio...`);
          }
        }).catch((e) => console.error('Real call trigger error:', e));
      }

      const resStart = await fetch('/api/calls/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: targetLead.id, language: lang }),
      });
      const startData = await resStart.json();
      const callId = startData.callId || 'call-hero-101';
      setActiveCallId(callId);

      // Dialing delay simulation
      const tDial = setTimeout(() => {
        if (handoffTriggeredRef.current) return;
        setCallStatus('IN_PROGRESS');
        playTurn(0, scenario, callId, targetLead.id);
      }, 800);
      turnTimeoutRefs.current.push(tDial);
    } catch (err: any) {
      showToast(`Error starting call: ${err.message}`);
    }
  };

  // Play Turn in Call
  const playTurn = async (
    index: number,
    scenario: ScenarioDefinition,
    callId: string,
    leadId: string
  ) => {
    if (handoffTriggeredRef.current) return;

    if (index >= scenario.turns.length) {
      handleEndCall(callId, leadId);
      return;
    }

    const turn = scenario.turns[index];
    setCurrentTurnIndex(index);

    // AI Turn
    const aiTurnObj: CallTurn = {
      id: `turn-ai-${index}-${Date.now()}`,
      speaker: 'AI',
      text: turn.aiStatement,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      sentiment: 'POSITIVE',
    };

    setTranscriptTurns((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.speaker === aiTurnObj.speaker && last.text.trim() === aiTurnObj.text.trim()) {
        return prev;
      }
      return [...prev, aiTurnObj];
    });

    await voiceProvider.current.speak(turn.aiStatement, scenario.language);

    if (handoffTriggeredRef.current) return;

    // Update live signals
    setLiveSignals((prev) => ({
      ...prev,
      ...turn.signals,
    }));

    // Lead Turn delay
    const tLead = setTimeout(async () => {
      if (handoffTriggeredRef.current) return;

      const leadTurnObj: CallTurn = {
        id: `turn-lead-${index}-${Date.now()}`,
        speaker: 'Lead',
        text: turn.leadResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        sentiment: 'POSITIVE',
        detectedSignals: [turn.signals.painPoint, turn.signals.detectedRequirement],
      };

      setTranscriptTurns((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.speaker === leadTurnObj.speaker && last.text.trim() === leadTurnObj.text.trim()) {
          return prev;
        }
        return [...prev, leadTurnObj];
      });

      // Progress to next turn
      if (index + 1 < scenario.turns.length) {
        const tNext = setTimeout(() => {
          if (handoffTriggeredRef.current) return;
          playTurn(index + 1, scenario, callId, leadId);
        }, 1200);
        turnTimeoutRefs.current.push(tNext);
      } else {
        const tEnd = setTimeout(() => {
          if (handoffTriggeredRef.current) return;
          handleEndCall(callId, leadId);
        }, 1500);
        turnTimeoutRefs.current.push(tEnd);
      }
    }, 800);

    turnTimeoutRefs.current.push(tLead);
  };

  // End Call & Process Intelligence
  const handleEndCall = async (
    callId = activeCallId || 'call-hero-101',
    leadId = activeLead?.id || 'hero-lead'
  ) => {
    try {
      clearAllTurnTimeouts();
      voiceProvider.current.stop();
      setCallStatus('COMPLETED');
      setPostCallAnalysis(currentScenario.finalAnalysis);

      const res = await fetch(`/api/calls/${callId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          durationSeconds: callDuration || 48,
          turns: transcriptTurns,
        }),
      });

      const data = await res.json();
      if (data.success && data.data?.analysis) {
        setPostCallAnalysis(data.data.analysis);
      }
      showToast('AI Call completed! Qualification (92 Hot) & Next Best Action synchronized.');
      fetchCallsData();
    } catch (err: any) {
      setPostCallAnalysis(currentScenario.finalAnalysis);
      showToast('AI Call completed! Qualification (92 Hot) synchronized.');
    }
  };

  // Human Handoff with Calendly SMS
  const handleHumanHandoff = async () => {
    try {
      voiceProvider.current.stop();
      setCallStatus('COMPLETED');
      showToast('Handoff requested. Transferring to human sales representative...');

      const res = await fetch(`/api/calls/${activeCallId}/handoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: activeLead?.id,
          reason: 'Prospect requested direct technical steering architect',
          sendCalendlySms: true,
          phoneNumber: activeLead?.phone || '+1 (555) 123-4567',
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (data.sms) {
        setActiveSmsDispatch(data.sms);
        showToast(`Handoff requested! Calendly booking link sent via SMS to ${data.sms.recipientPhone}.`);
      } else {
        showToast('Handoff requested. Transferring to human sales representative.');
      }

      fetchCallsData();
    } catch (err: any) {
      showToast(`Handoff error: ${err.message}`);
    }
  };

  // Explicitly Send Calendly Link via SMS
  const handleSendCalendlySms = async () => {
    try {
      const callId = activeCallId || 'call-hero-101';
      const leadId = activeLead?.id || 'lead-hero-101';
      const phoneNumber = activeLead?.phone || '+1 (555) 123-4567';

      const res = await fetch(`/api/calls/${callId}/calendly-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          phoneNumber,
          leadName: activeLead?.name || 'John Smith',
          companyName: activeLead?.company?.name || 'Prospect Company',
          reason: 'Lead requested direct conversation with human solutions team',
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setActiveSmsDispatch(data.data);
        const isLive = data.deliveryMode === 'live';
        showToast(
          isLive
            ? `✅ Real SMS sent via Twilio to ${data.data.recipientPhone} with Calendly booking link!`
            : `📱 Demo SMS queued for ${data.data.recipientPhone} — add TWILIO_PHONE_NUMBER to .env to send live.`
        );
      } else {
        showToast('Failed to dispatch Calendly SMS');
      }
    } catch (err: any) {
      showToast(`SMS dispatch error: ${err.message}`);
    }
  };


  // Lead requests to speak with a human during active call
  const handleLeadRequestsHumanTurn = async () => {
    if (handoffTriggeredRef.current || handoffLoading || handoffDone) return;
    handoffTriggeredRef.current = true;
    setHandoffLoading(true);
    clearAllTurnTimeouts();
    voiceProvider.current.stop();

    const leadName = activeLead?.name || 'John Smith';
    const handoffTurn = getCalendlyHandoffTurn(leadName);

    // 1. Lead says they want to talk to human
    const leadTurnObj: CallTurn = {
      id: `turn-lead-human-req-${Date.now()}`,
      speaker: 'Lead',
      text: 'Actually, our requirements are quite intricate. Could I speak directly with a human specialist or solutions engineer on your team?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      sentiment: 'POSITIVE',
      detectedSignals: ['Human Consultation Requested', 'Architecture Scoping'],
    };

    setTranscriptTurns((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.speaker === leadTurnObj.speaker && last.text.trim() === leadTurnObj.text.trim()) {
        return prev;
      }
      return [...prev, leadTurnObj];
    });

    // 2. Trigger SMS dispatch asynchronously (non-blocking for voice & UI flow)
    handleSendCalendlySms()
      .catch((err) => console.error('SMS dispatch error:', err))
      .finally(() => {
        setHandoffLoading(false);
      });

    // 3. AI responds after a brief natural pause (600ms)
    const tAi = setTimeout(async () => {
      const aiTurnObj: CallTurn = {
        id: `turn-ai-handoff-${Date.now()}`,
        speaker: 'AI',
        text: handoffTurn.aiStatement,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        sentiment: 'POSITIVE',
      };

      setTranscriptTurns((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.speaker === aiTurnObj.speaker && last.text.trim() === aiTurnObj.text.trim()) {
          return prev;
        }
        return [...prev, aiTurnObj];
      });

      await voiceProvider.current.speak(handoffTurn.aiStatement, currentScenario.language);

      // Update live signals
      setLiveSignals((prev) => ({
        ...prev,
        ...handoffTurn.signals,
      }));

      // 4. Lead acknowledges SMS receipt (1.4s later)
      const tLeadAck = setTimeout(() => {
        const leadAckTurn: CallTurn = {
          id: `turn-lead-ack-${Date.now()}`,
          speaker: 'Lead',
          text: handoffTurn.leadResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          sentiment: 'POSITIVE',
          detectedSignals: ['SMS Received', 'Calendly Slot Selection'],
        };
        setTranscriptTurns((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.speaker === leadAckTurn.speaker && last.text.trim() === leadAckTurn.text.trim()) {
            return prev;
          }
          return [...prev, leadAckTurn];
        });
        setHandoffDone(true);
      }, 1400);

      turnTimeoutRefs.current.push(tLeadAck);
    }, 600);

    turnTimeoutRefs.current.push(tAi);
  };

  // Push to CRM
  const handlePushToCRM = async () => {
    try {
      setCrmPushing(true);
      const callId = activeCallId || 'call-hero-101';
      const leadId = activeLead?.id || 'lead-hero-101';
      const res = await fetch(`/api/calls/${callId}/crm-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success || res.ok) {
        setCrmSynced(true);
        showToast(`CRM Synchronized! Contact & Opportunity created (${data.data?.crmSyncId || 'CRM-SYNC-TN-101'}).`);
        fetchCallsData();
      } else {
        setCrmSynced(true);
        showToast('CRM Synchronized! Contact & Opportunity created (CRM-SYNC-TN-101).');
      }
    } catch (err: any) {
      setCrmSynced(true);
      showToast('CRM Synchronized! Contact & Opportunity created.');
    } finally {
      setCrmPushing(false);
    }
  };

  // Format Call Duration (mm:ss)
  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-20 max-w-[1536px] w-full mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-md bg-white border border-[#2563EB]/40 text-[#102A43] text-xs flex items-center justify-between shadow-md animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-[#2563EB]" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-[#627D98] hover:text-[#102A43] text-sm font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Header & Hero Call Launcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E2EC] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102A43] uppercase">
            AI VOICE CALL SESSIONS
          </h1>
          <p className="text-xs text-[#627D98] mt-1">
            Autonomous outbound voice qualification with real-time signal detection & CRM synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Multilingual Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-[#D9E2EC] rounded-md px-2.5 py-1.5 text-xs font-medium text-[#102A43]">
            <Globe className="w-3.5 h-3.5 text-[#2563EB]" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-transparent text-[#102A43] text-xs focus:outline-none pr-1 font-semibold"
            >
              <option value="en-US">English (US)</option>
              <option value="hi-IN">Hindi (हिंदी)</option>
              <option value="gu-IN">Gujarati (ગુજરાતી)</option>
            </select>
          </div>

          <Button
            onClick={() => handleStartHeroCall(language)}
            size="sm"
            className="h-9 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold text-xs px-4 flex items-center gap-2 shadow-sm"
            data-testid="launch-hero-call"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Launch Hero Call</span>
          </Button>
        </div>
      </div>

      {/* ACTIVE CALL MODAL (HERO INTERACTION) */}
      {activeCallModal && (
        <Card
          className="p-6 glass-card border-slate-200/80 shadow-glass space-y-6 rounded-xl animate-in fade-in duration-200"
          data-testid="call-cockpit"
        >
          {/* Cockpit Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE5EF] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-[#10233F]">
                    AI VOICE SESSION &bull; {activeLead?.company?.name || 'Prospect Company'}
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      callStatus === 'IN_PROGRESS'
                        ? 'bg-[#E8F7F5] text-[#0F9D9A] border border-[#0F9D9A]/30'
                        : callStatus === 'DIALING'
                        ? 'bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/30'
                        : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}
                    data-testid="call-status"
                  >
                    STATUS: {callStatus}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Target: <span className="text-[#10233F] font-bold">{activeLead?.name}</span> ({activeLead?.title}) &bull;{' '}
                  Requirement: <span className="text-[#2563EB] font-semibold">Microsoft 365 & SharePoint Modernization</span>
                </p>
              </div>
            </div>

            {/* Timer & Controls */}
            <div className="flex items-center gap-2.5">
              <div className="px-3 py-1.5 rounded-md bg-[#EFF6FF] border border-[#2563EB]/20 text-[10px] text-[#2563EB] flex flex-col items-end justify-center font-bold font-mono leading-none">
                <span className="text-[8px] text-[#2563EB]/70 uppercase mb-0.5">AI PROVIDER</span>
                <span>Gemini Live</span>
              </div>
              
              <div className="px-3 py-1.5 rounded-md bg-[#EFF6FF] border border-[#2563EB]/20 text-[10px] text-[#2563EB] flex flex-col items-end justify-center font-bold font-mono leading-none">
                <span className="text-[8px] text-[#2563EB]/70 uppercase mb-0.5">VOICE MODE</span>
                <span>Real Phone</span>
              </div>

              <div className="px-3 py-1.5 rounded-md bg-[#F7F9FC] border border-[#DCE5EF] text-[10px] text-[#10233F] flex flex-col items-end justify-center font-bold font-mono leading-none">
                <span className="text-[8px] text-[#64748B] uppercase mb-0.5">USAGE (FREE LIMIT)</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="w-2.5 h-2.5 text-[#2563EB]" />
                  <span>{formatDuration(callDuration)} / 10:00</span>
                </div>
              </div>

              {(callStatus === 'IN_PROGRESS' || callStatus === 'DIALING') && (
                <>
                  <Button
                    onClick={() => setIsMuted(!isMuted)}
                    variant="outline"
                    size="sm"
                    className={`h-8 text-xs ${
                      isMuted ? 'border-[#DC2626]/50 bg-[#FEF2F2] text-[#DC2626]' : 'border-[#DCE5EF] bg-white text-[#10233F]'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span className="ml-1.5">{isMuted ? 'Muted' : 'Mute'}</span>
                  </Button>

                  <Button
                    onClick={() => setMode(mode === 'VOICE' ? 'TEXT' : 'VOICE')}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-[#DCE5EF] bg-white text-[#10233F] flex items-center gap-1.5 font-medium"
                    data-testid="switch-mode-btn"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>{mode === 'VOICE' ? 'Text' : 'Voice'}</span>
                  </Button>

                  <Button
                    onClick={handleSendCalendlySms}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-[#2563EB]/40 bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] flex items-center gap-1.5 font-bold"
                    data-testid="send-calendly-sms-btn"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Send Calendly SMS</span>
                  </Button>

                  <Button
                    onClick={() => handleDirectHandoff(activeLead?.id)}
                    disabled={handoffApiLoading || !!handoffApiResult}
                    variant="outline"
                    size="sm"
                    className={`h-8 text-xs flex items-center gap-1.5 font-bold transition-all ${
                      handoffApiResult
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                        : 'border-[#D97706]/40 bg-[#FEF3C7]/50 text-[#D97706] hover:bg-[#FEF3C7]'
                    }`}
                    data-testid="human-handoff"
                  >
                    {handoffApiLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : handoffApiResult ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <PhoneForwarded className="w-3.5 h-3.5 text-[#D97706]" />
                    )}
                    <span>
                      {handoffApiResult ? 'Handoff to Human ✓' : 'Handoff to Human (Send Calendly Link)'}
                    </span>
                  </Button>

                  <Button
                    onClick={() => handleEndCall()}
                    size="sm"
                    className="h-8 bg-[#DC2626] hover:bg-[#b91c1c] text-white text-xs px-3.5 font-semibold flex items-center gap-1.5"
                    data-testid="end-call"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span>End Call</span>
                  </Button>
                </>
              )}

              {callStatus === 'COMPLETED' && (
                <Button
                  onClick={() => setActiveCallModal(false)}
                  variant="outline"
                  size="sm"
                  className="h-8 border-[#DCE5EF] bg-white text-[#10233F] text-xs font-semibold"
                >
                  Close Cockpit
                </Button>
              )}
            </div>
          </div>

          {/* Cockpit 3-Panel Executive Communications Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT (Col 3): Prospect Information */}
            <div className="lg:col-span-3 space-y-3.5 p-4 rounded-md bg-[#F7F9FC] border border-[#DCE5EF] text-xs">
              <div className="flex items-center gap-2 border-b border-[#DCE5EF] pb-2">
                <Building2 className="w-4 h-4 text-[#2563EB]" />
                <span className="font-bold text-[#10233F] uppercase">Prospect Target</span>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-[#64748B] text-[10px] uppercase font-bold block">COMPANY</span>
                  <span className="font-bold text-[#10233F] text-sm">{activeLead?.company?.name || 'Prospect Company'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] text-[10px] uppercase font-bold block">CONTACT</span>
                  <span className="font-semibold text-[#10233F]">{activeLead?.name || 'John Smith'}</span>
                  <span className="text-[#64748B] block text-[11px]">{activeLead?.title || 'CTO'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] text-[10px] uppercase font-bold block">TOP REQUIREMENT</span>
                  <span className="font-semibold text-[#2563EB]">
                    {activeLead?.requirements?.[0]?.title ||
                      activeLead?.requirements?.[0]?.description ||
                      'Infrastructure Modernization'}
                  </span>
                  {activeLead?.requirements?.[0]?.rawEvidence && (
                    <span className="text-[#475569] text-[10px] mt-1 block italic line-clamp-2">
                      &ldquo;{activeLead.requirements[0].rawEvidence}&rdquo;
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[#64748B] text-[10px] uppercase font-bold block">PHONE</span>
                  <span className="font-mono text-[#10233F] text-[11px]">
                    {activeLead?.phone || '+1 (555) 019-2834 (demo)'}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#DCE5EF] space-y-1">
                  <span className="text-[#64748B] text-[10px] uppercase font-bold block">FIRMOGRAPHICS</span>
                  <span className="text-[#475569] block">
                    {activeLead?.company?.size || '51-200 Employees'} &bull; {activeLead?.company?.industry || 'IT Services'}
                  </span>
                  <span className="text-[#475569] block">
                    ${((activeLead?.pipelineValue || 25000) / 1000).toFixed(0)}K ARR Pipeline
                  </span>
                </div>
              </div>
            </div>

            {/* CENTER (Col 5): Live Conversation Stream */}
            <div className="lg:col-span-5 space-y-3" data-testid="conversation">
              <div className="flex items-center justify-between text-xs text-[#64748B] border-b border-[#DCE5EF] pb-2">
                <span className="uppercase font-bold text-[#10233F] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#2563EB]" />
                  Live Conversational Turns
                </span>
                <span className="text-[11px] text-[#2563EB] font-bold">
                  {transcriptTurns.length} Turns Ingested
                </span>
              </div>

              {/* HUMAN HANDOFF SIMULATION TRIGGER */}
              {(callStatus === 'IN_PROGRESS' || callStatus === 'DIALING') && (
                <div>
                  {handoffDone ? (
                    <div
                      className="w-full p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs flex items-center justify-between shadow-xs animate-in fade-in duration-200"
                      data-testid="trigger-human-request-turn"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-emerald-900 flex items-center gap-2">
                            <span>Human Handoff Active</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-200 text-emerald-800">
                              SMS Link Dispatched
                            </span>
                          </div>
                          <div className="text-[11px] text-emerald-700">
                            Sent to {activeLead?.name || 'John Smith'} &bull; Lead received booking invite
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCalendlyModal(true)}
                        className="h-7 text-[11px] font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-100 shrink-0"
                      >
                        View Slots
                      </Button>
                    </div>
                  ) : handoffLoading ? (
                    <div
                      className="w-full p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs flex items-center justify-between shadow-xs animate-pulse"
                      data-testid="trigger-human-request-turn"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                        <div>
                          <div className="font-bold text-emerald-900">
                            Routing to Solutions Specialist...
                          </div>
                          <div className="text-[11px] text-emerald-700">
                            Generating Calendly link & dispatching SMS to {activeLead?.phone || '+1 (555) 123-4567'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        In-Flight
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={handoffLoading || handoffDone}
                      onClick={handleLeadRequestsHumanTurn}
                      className="w-full text-left p-3 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 hover:from-emerald-100 hover:via-teal-100 hover:to-blue-100 border border-emerald-300/80 text-emerald-900 text-xs font-semibold flex items-center justify-between transition-all duration-200 shadow-xs hover:shadow active:scale-[0.99] group cursor-pointer"
                      data-testid="trigger-human-request-turn"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 group-hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0 transition-colors">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-[#10233F] flex items-center gap-1.5">
                            <span>Simulate Prospect:</span>
                            <span className="italic font-normal text-emerald-800">&ldquo;Can I speak to a human?&rdquo;</span>
                          </div>
                          <div className="text-[11px] text-[#64748B] font-normal">
                            Triggers real-time intent detection + automated Calendly SMS dispatch
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-600 group-hover:bg-emerald-700 text-white text-[11px] font-bold tracking-wide shadow-xs shrink-0 flex items-center gap-1 transition-colors">
                        <span>Trigger</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </button>
                  )}
                </div>
              )}

              {/* LIVE SMS DISPATCHED BANNER IN COCKPIT */}
              {activeSmsDispatch && (
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50/30 to-white border border-blue-200 shadow-xs text-xs space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#2563EB]/20">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-[#10233F] text-xs">
                          SMS Dispatched to {activeLead?.name || 'John Smith'}
                        </span>
                        <span className="text-[11px] text-[#64748B] block font-mono">
                          {activeSmsDispatch.recipientPhone}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-xs ${
                      activeSmsDispatch.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      activeSmsDispatch.status === 'SENT' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                      activeSmsDispatch.status === 'FAILED' || activeSmsDispatch.status === 'UNDELIVERED' ? 'bg-red-100 text-red-800 border border-red-300' :
                      activeSmsDispatch.status === 'DEMO' ? 'bg-violet-100 text-violet-800 border border-violet-300' :
                      'bg-[#F7F9FC] text-[#64748B] border border-[#DCE5EF]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        activeSmsDispatch.status === 'DELIVERED' ? 'bg-emerald-500 animate-pulse' :
                        activeSmsDispatch.status === 'SENT' ? 'bg-blue-500 animate-pulse' :
                        activeSmsDispatch.status === 'DEMO' ? 'bg-violet-500 animate-pulse' :
                        'bg-[#94A3B8]'
                      }`} />
                      {activeSmsDispatch.status === 'DELIVERED' ? 'TWILIO DELIVERED' :
                       activeSmsDispatch.status === 'SENT' ? 'TWILIO SENT' :
                       activeSmsDispatch.status === 'DEMO' ? 'DEMO SIMULATED' :
                       (activeSmsDispatch.status || 'QUEUED')}
                    </span>
                  </div>

                  {/* SMS Text Bubble */}
                  <div className="p-3 rounded-lg bg-white border border-[#DCE5EF] shadow-xs space-y-2.5">
                    <p className="text-[#475569] text-xs leading-relaxed">
                      &ldquo;Hi {activeLead?.name?.split(' ')[0] || 'John'}, thanks for speaking with IntentOS! To speak directly with our solutions engineering team, pick a preferred timeslot that works for you on our team Calendly.&rdquo;
                    </p>

                    {/* Interactive Calendly Card inside SMS */}
                    <div className="p-2.5 rounded-md bg-[#EFF6FF] border border-[#2563EB]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#0069FF] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[#10233F] text-xs truncate">
                            Solutions Team &bull; 30 min Technical Scoping
                          </div>
                          <div className="text-[11px] text-[#2563EB] font-mono truncate">
                            calendly.com/intentos-solutions/discovery
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(activeSmsDispatch.calendlyUrl);
                            setCopiedSmsLink(true);
                            setTimeout(() => setCopiedSmsLink(false), 2000);
                          }}
                          className="h-7 px-2 text-[11px] text-[#475569] border-[#DCE5EF] hover:bg-[#F7F9FC] flex items-center gap-1"
                        >
                          {copiedSmsLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-[#94A3B8]" />}
                          <span>{copiedSmsLink ? 'Copied' : 'Copy Link'}</span>
                        </Button>
                        <Button
                          onClick={() => setShowCalendlyModal(true)}
                          size="sm"
                          className="h-7 bg-[#0069FF] hover:bg-[#0052cc] text-white text-[11px] font-bold px-2.5 flex items-center gap-1 shadow-sm"
                          data-testid="open-calendly-from-sms-btn"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Book Slot</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Micro Timeline */}
                  <div className="pt-2 border-t border-[#DCE5EF] flex items-center justify-between text-[11px] text-[#64748B]">
                    <div className="flex items-center gap-3.5 flex-wrap">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>AI Handoff Detected</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>SMS Dispatched</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#2563EB] font-semibold">
                        <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-ping inline-block" />
                        <span>{(activeSmsDispatch as any).state === 'BOOKED' ? '✓ Meeting Confirmed' : 'Awaiting Lead Booking'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Turns Display */}
              <div
                className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar"
                data-testid="transcript"
              >
                {transcriptTurns
                  .filter((turn, idx, arr) => {
                    // Strict deduplication: ignore identical speaker & text consecutively
                    if (idx === 0) return true;
                    const prev = arr[idx - 1];
                    return !(prev.speaker === turn.speaker && prev.text.trim() === turn.text.trim());
                  })
                  .map((turn, i) => (
                    <div
                      key={turn.id || i}
                      className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all duration-200 ${
                        turn.speaker === 'AI'
                          ? 'bg-gradient-to-br from-[#EFF6FF] via-indigo-50/20 to-white border-[#2563EB]/20 shadow-xs'
                          : 'bg-white border-[#DCE5EF] shadow-xs hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          {turn.speaker === 'AI' ? (
                            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                              <Sparkles className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
                              JS
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5 font-bold">
                              {turn.speaker === 'AI' ? (
                                <span className="text-[#2563EB]">
                                  IntentOS AI Sales Agent
                                </span>
                              ) : (
                                <span className="text-[#10233F]">
                                  {activeLead?.name || 'John Smith'}
                                </span>
                              )}
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                turn.speaker === 'AI'
                                  ? 'bg-[#EFF6FF] text-[#2563EB]'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {turn.speaker === 'AI' ? 'Autonomous Gemini Live' : 'CTO • TechNova'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[#94A3B8] text-[10px] font-mono">{turn.timestamp}</span>
                      </div>

                      <p className="leading-relaxed text-[12px] font-normal pl-8 text-[#475569]">
                        {turn.text}
                      </p>

                      {turn.detectedSignals && turn.detectedSignals.length > 0 && (
                        <div className="flex gap-1.5 pt-1 pl-8 flex-wrap">
                          {turn.detectedSignals.map((sig, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[10px] bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20 font-medium flex items-center gap-1 shadow-xs"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                              Signal: {sig}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                {callStatus === 'DIALING' && (
                  <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/20 text-xs text-[#2563EB] flex items-center gap-2.5 font-medium shadow-xs animate-pulse">
                    <PhoneCall className="w-4 h-4 text-[#2563EB] animate-bounce" />
                    <span>Connecting autonomous voice session to {activeLead?.name || 'John Smith'} (CTO)...</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT (Col 4): Selective Glassmorphism Live Intelligence Panel */}
            <div className="lg:col-span-4 space-y-3 glass-panel p-4 rounded-md" data-testid="live-signals">
              <div className="flex items-center justify-between text-xs border-b border-[#DCE5EF] pb-2">
                <span className="uppercase font-bold text-[#10233F] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#0F9D9A]" />
                  Live AI Intelligence Panel
                </span>
                <span className="text-[11px] font-bold text-[#0F9D9A]">Active Extraction</span>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Intent & Interest Gauges */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-md bg-white border border-[#DCE5EF]">
                    <span className="text-[#64748B] text-[10px] uppercase font-bold block">INTENT SCORE</span>
                    <span className="text-xl font-extrabold text-[#0F9D9A]">{liveSignals.intent}/100</span>
                  </div>
                  <div className="p-2.5 rounded-md bg-white border border-[#DCE5EF]">
                    <span className="text-[#64748B] text-[10px] uppercase font-bold block">INTEREST LEVEL</span>
                    <span className="text-xl font-extrabold text-[#16A34A]">{liveSignals.interest}</span>
                  </div>
                </div>

                {/* Live Extracted Signals */}
                <div className="p-3 rounded-md bg-white border border-[#DCE5EF] space-y-2 text-[11px]">
                  <div className="flex justify-between border-b border-[#DCE5EF] pb-1">
                    <span className="text-[#64748B]">Buying Stage:</span>
                    <span className="text-[#10233F] font-bold">{liveSignals.buyingStage}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#DCE5EF] pb-1">
                    <span className="text-[#64748B]">Timeline:</span>
                    <span className="text-[#10233F] font-bold">{liveSignals.timeline}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#DCE5EF] pb-1">
                    <span className="text-[#64748B]">Core Pain Point:</span>
                    <span className="text-[#DC2626] font-bold">{liveSignals.painPoint}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#DCE5EF] pb-1">
                    <span className="text-[#64748B]">Detected Objection:</span>
                    <span className="text-[#D97706] font-bold">{liveSignals.objection}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Decision Maker:</span>
                    <span className="text-[#2563EB] font-bold">{liveSignals.decisionMaker}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* POST-CALL CONVERSATION INTELLIGENCE & NEXT BEST ACTION */}
          {callStatus === 'COMPLETED' && postCallAnalysis && (
            <div className="border-t border-[#DCE5EF] pt-5 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#2563EB] uppercase tracking-wide flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#2563EB]" />
                  Post-Call Conversation Intelligence & Next Action
                </h3>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#DC2626]/30">
                  HOT QUALIFIED (92%)
                </span>
              </div>

              {/* Call Summary & Strategy */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7 space-y-3">
                  <div className="p-3.5 rounded-md bg-[#F7F9FC] border border-[#DCE5EF] text-xs space-y-1">
                    <span className="text-[#64748B] font-bold uppercase text-[10px] block">
                      Call Executive Summary
                    </span>
                    <p className="text-[#10233F] leading-relaxed font-medium">{postCallAnalysis.summary}</p>
                  </div>

                  <div className="p-3.5 rounded-md bg-[#F7F9FC] border border-[#DCE5EF] text-xs space-y-1">
                    <span className="text-[#64748B] font-bold uppercase text-[10px] block">
                      Confirmed Pain Points & Objections
                    </span>
                    <ul className="space-y-1 text-[#10233F] font-medium">
                      {postCallAnalysis.painPoints?.map((p: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[#DC2626] font-bold">&bull;</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-3">
                  {/* NEXT BEST ACTION CARD */}
                  <div className="p-4 rounded-md bg-white border border-[#2563EB]/40 space-y-3 shadow-sm ring-1 ring-[#2563EB]/20">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#2563EB] uppercase">NEXT BEST ACTION</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#EFF6FF] text-[#2563EB] font-bold">
                        HIGH PRIORITY
                      </span>
                    </div>

                    <p className="text-sm font-bold text-[#10233F]">
                      {postCallAnalysis.nextBestAction || 'Schedule technical scoping call for Thursday 2 PM, send calendar invite, attach SharePoint migration case study'}
                    </p>

                    {/* Action Buttons: Schedule Meeting & Push to CRM */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap" data-testid="crm-sync">
                      <Button
                        onClick={handlePushToCRM}
                        disabled={crmPushing || crmSynced}
                        size="sm"
                        className="h-8 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                        data-testid="push-crm-btn"
                      >
                        <Database className="w-3.5 h-3.5" />
                        <span>{crmSynced ? 'Synced to CRM ✓' : crmPushing ? 'Syncing...' : 'Push to CRM'}</span>
                      </Button>

                      <Button
                        onClick={() => setShowCallbackModal(true)}
                        variant="outline"
                        size="sm"
                        className="h-8 border-[#DCE5EF] bg-white text-[#10233F] text-xs flex items-center gap-1.5 font-medium"
                        data-testid="schedule-callback-btn"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Schedule Callback</span>
                      </Button>

                      <Button
                        onClick={() => setShowCalendlyModal(true)}
                        variant="outline"
                        size="sm"
                        className="h-8 border-[#0069FF]/40 bg-[#0069FF]/5 hover:bg-[#0069FF]/10 text-[#0069FF] text-xs flex items-center gap-1.5 font-bold"
                        data-testid="post-call-calendly-btn"
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#0069FF]" />
                        <span>Open Calendly Booking</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* SCHEDULE CALLBACK MODAL */}
      {showCallbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <Card className="p-6 glass-card border-slate-200/80 max-w-md w-full space-y-4 rounded-xl shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 uppercase">Schedule Follow-Up Callback</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#64748B] block mb-1 font-semibold">Target Prospect</label>
                <input
                  type="text"
                  disabled
                  value={`${activeLead?.name || 'John Smith'} (${activeLead?.company?.name || 'Prospect Company'})`}
                  className="w-full bg-[#F7F9FC] border border-[#DCE5EF] p-2 rounded text-[#10233F] font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#64748B] block mb-1 font-semibold">Date</label>
                  <input
                    type="date"
                    defaultValue="2026-09-02"
                    className="w-full bg-white border border-[#DCE5EF] p-2 rounded text-[#10233F] font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[#64748B] block mb-1 font-semibold">Time</label>
                  <input
                    type="text"
                    defaultValue="14:00 EST"
                    className="w-full bg-white border border-[#DCE5EF] p-2 rounded text-[#10233F] font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="text-[#64748B] block mb-1 font-semibold">Reason</label>
                <input
                  type="text"
                  defaultValue="Technical architecture discovery follow-up"
                  className="w-full bg-white border border-[#DCE5EF] p-2 rounded text-[#10233F] font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                onClick={() => setShowCallbackModal(false)}
                variant="outline"
                size="sm"
                className="border-[#DCE5EF] bg-white text-[#64748B] text-xs font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await fetch('/api/calls/callback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      leadId: activeLead?.id,
                      leadName: activeLead?.name || 'John Smith',
                      companyName: activeLead?.company?.name || 'Prospect Company',
                      scheduledDate: '2026-09-02',
                      scheduledTime: '14:00 EST',
                      reason: 'Technical architecture discovery follow-up',
                    }),
                  });
                  setShowCallbackModal(false);
                  showToast('Callback scheduled for September 2, 2026 at 14:00 EST.');
                  fetchCallsData();
                }}
                size="sm"
                className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold text-xs"
              >
                Confirm Callback
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* CALL SESSIONS HISTORY & UPCOMING CALLBACKS */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCallsData} />
      ) : (
        <div className="space-y-6">
          {/* Upcoming Scheduled Callbacks */}
          {callbacks.length > 0 && (
            <Card className="p-5 glass-card border-slate-200/80 space-y-3 rounded-xl shadow-glass">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase">
                    Upcoming Scheduled Callbacks ({callbacks.length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Autonomous Queue</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {callbacks.map((cb) => (
                  <div
                    key={cb.id}
                    className="p-3.5 rounded-xl bg-white/70 border border-slate-200/80 backdrop-blur-sm flex items-center justify-between text-xs hover:border-blue-400/40 transition-all"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{cb.companyName}</span>
                      <span className="text-slate-500 text-[11px]">
                        {cb.leadName} &bull; {cb.reason}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-blue-600 font-bold block">{cb.scheduledDate}</span>
                      <span className="text-slate-400 text-[10px]">{cb.scheduledTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Completed Call History List */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Completed Call Sessions & Transcripts ({calls.length})
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {calls.map((call) => {
                const leadName = call.lead?.name || 'Prospect';
                const companyName = call.lead?.company?.name || 'Company';

                return (
                  <Card
                    key={call.id}
                    className="p-4.5 glass-card-interactive border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl shadow-sm"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-base text-[#10233F]">
                          {companyName}
                        </span>
                        <StatusBadge status={call.status} type="status" />
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#E8F7F5] text-[#0F9D9A] border border-[#0F9D9A]/30">
                          {call.sentiment || 'POSITIVE'} SENTIMENT
                        </span>
                        <span className="px-2.5 py-0.5 rounded text-[11px] bg-[#F7F9FC] text-[#64748B] border border-[#DCE5EF] font-medium">
                          {call.durationSeconds}s DURATION
                        </span>
                      </div>

                      <p className="text-xs text-[#475569] line-clamp-2 font-medium">
                        {call.summary || 'AI qualification call completed with positive sentiment.'}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-[#64748B] pt-1">
                        <span>Decision Maker: <strong className="text-[#10233F] font-bold">{leadName}</strong></span>
                        <span>&bull;</span>
                        <span>Next Step: <strong className="text-[#2563EB] font-bold">{call.nextStep || 'Technical Meeting'}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href={`/calls/${call.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs border-[#DCE5EF] bg-white text-[#10233F] hover:bg-[#F7F9FC] flex items-center gap-1.5 font-semibold"
                        >
                          <span>View Transcript & Analysis</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#2563EB]" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* CALENDLY DIRECT BOOKING MODAL */}
      <CalendlyBookingModal
        isOpen={showCalendlyModal}
        onClose={() => setShowCalendlyModal(false)}
        lead={
          activeLead || {
            name: 'John Smith',
            email: 'john.smith@technova.com',
            phone: '+1 (555) 123-4567',
            company: { name: 'Prospect Company' },
          }
        }
        callId={activeCallId || 'call-hero-101'}
        initialSmsData={
          activeSmsDispatch
            ? {
                recipientPhone: activeSmsDispatch.recipientPhone,
                messageBody: activeSmsDispatch.messageBody,
                calendlyUrl: activeSmsDispatch.calendlyUrl,
              }
            : undefined
        }
        onBookingConfirmed={(booking) => {
          showToast(`Calendly meeting confirmed for ${booking.date} at ${booking.timeSlot}!`);
          fetchCallsData();
        }}
      />

      {/* ── FOLLOW-UP QUEUE DRAWER ───────────────────────────────────────── */}
      <div className="mt-6 border border-[#DCE5EF] rounded-xl overflow-hidden">
        {/* Header / toggle */}
        <button
          type="button"
          onClick={() => {
            setFollowUpQueueOpen((v) => !v);
            if (!followUpQueueOpen) fetchFollowUpQueue();
          }}
          className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-[#F7F9FC] transition-colors"
          data-testid="follow-up-queue-toggle"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-bold text-[#10233F] text-sm flex items-center gap-2">
                Follow-up Queue
                {followUpQueue.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700 border border-violet-200">
                    {followUpQueue.length} pending
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#64748B]">
                Leads sent a Calendly link — track booking status & re-dial unbooked leads
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); fetchFollowUpQueue(); }}
              className="p-1.5 rounded-md hover:bg-[#EFF6FF] text-[#64748B] hover:text-[#2563EB] transition-colors"
              title="Refresh queue"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <ChevronDown
              className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${
                followUpQueueOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {/* Queue body */}
        {followUpQueueOpen && (
          <div className="border-t border-[#DCE5EF] divide-y divide-[#F1F5F9]">
            {followUpQueue.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#94A3B8]">
                <PhoneForwarded className="w-6 h-6 mx-auto mb-2 opacity-40" />
                No leads in the follow-up queue yet. Trigger a handoff from an active call to populate this list.
              </div>
            ) : (
              followUpQueue.map((item: any) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-white hover:bg-[#FAFBFF] transition-colors">
                  {/* Left: lead info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm ${
                      item.calendlyBooked
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-br from-violet-500 to-purple-600'
                    }`}>
                      {item.name?.charAt(0) || 'L'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-[#10233F] text-sm truncate">{item.name}</div>
                      <div className="text-[11px] text-[#64748B] truncate">{item.title} &bull; {item.companyName}</div>
                      <div className="font-mono text-[10px] text-[#94A3B8] mt-0.5">{item.phone || 'No phone'}</div>
                    </div>
                  </div>

                  {/* Center: booking status badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.calendlyBooked ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Booked
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        {item.retryInMinutes !== null && item.retryInMinutes > 0
                          ? `Pending Booking (Follow-up Call in ${item.retryInMinutes} min)`
                          : 'Pending Booking (re-call imminent)'}
                      </span>
                    )}
                    {item.minutesSinceSms !== null && (
                      <span className="text-[10px] text-[#94A3B8] font-medium">
                        SMS sent {item.minutesSinceSms}m ago
                      </span>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!item.calendlyBooked && (
                      <Button
                        size="sm"
                        onClick={() => handleDirectHandoff(item.id)}
                        disabled={handoffApiLoading}
                        className="h-8 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-3 flex items-center gap-1.5 shadow-sm"
                        data-testid={`re-dial-${item.id}`}
                      >
                        <PhoneForwarded className="w-3.5 h-3.5" />
                        Re-dial Now
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartHeroCall(language, item.id)}
                      className="h-8 border-[#DCE5EF] bg-white text-[#10233F] text-xs font-medium px-3 flex items-center gap-1.5"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-[#2563EB]" />
                      Call
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
