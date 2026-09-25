'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Globe,
  User,
  Building,
  Mail,
  Phone,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  X,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  PRESET_CALENDLY_TIMESLOTS,
  getUpcomingBusinessDates,
  buildCalendlyUrl,
} from '@/lib/voice/calendly-constants';
import { CalendlyTimeSlot } from '@/types/voice';

interface CalendlyBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: {
    id?: string;
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
    company?: {
      name?: string;
    };
  };
  callId?: string;
  onBookingConfirmed?: (booking: any) => void;
  initialSmsData?: {
    recipientPhone?: string;
    messageBody?: string;
    calendlyUrl?: string;
  };
}

export function CalendlyBookingModal({
  isOpen,
  onClose,
  lead,
  callId = 'call-hero-101',
  onBookingConfirmed,
  initialSmsData,
}: CalendlyBookingModalProps) {
  const dates = getUpcomingBusinessDates();

  const [selectedDate, setSelectedDate] = useState<string>(dates[0]?.dateStr || '2026-09-26');
  const [selectedSlot, setSelectedSlot] = useState<CalendlyTimeSlot>(
    PRESET_CALENDLY_TIMESLOTS[2] // 2:00 PM (Recommended)
  );
  const [timezone, setTimezone] = useState<string>('EST (Eastern Time)');
  const [contactName, setContactName] = useState<string>(lead?.name || 'John Smith');
  const [contactEmail, setContactEmail] = useState<string>(
    lead?.email || 'john.smith@technova.com'
  );
  const [contactPhone, setContactPhone] = useState<string>(
    lead?.phone || '+1 (555) 123-4567'
  );
  const [notes, setNotes] = useState<string>(
    'Technical architecture review & zero-downtime SharePoint migration scoping.'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const calendlyUrl =
    initialSmsData?.calendlyUrl ||
    buildCalendlyUrl({
      leadName: contactName,
      leadEmail: contactEmail,
      companyName: lead?.company?.name || 'Prospect Company',
    });

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/calls/${callId}/calendly-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead?.id || 'lead-hero-101',
          date: selectedDate,
          timeSlot: selectedSlot.time,
          timezone: timezone.split(' ')[0],
          leadName: contactName,
          leadEmail: contactEmail,
          companyName: lead?.company?.name || 'Prospect Company',
          notes,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setConfirmedBooking(data.data);
        if (onBookingConfirmed) {
          onBookingConfirmed(data.data);
        }
      } else {
        // Fallback for demo mock
        const fallbackBooking = {
          bookingId: `CAL-BOOK-${Math.floor(1000 + Math.random() * 9000)}`,
          date: selectedDate,
          timeSlot: selectedSlot.time,
          timezone: timezone.split(' ')[0],
          leadName: contactName,
          companyName: lead?.company?.name || 'Prospect Company',
          meetingLink: 'https://meet.intentos.ai/room/discovery-scoping',
        };
        setConfirmedBooking(fallbackBooking);
        if (onBookingConfirmed) {
          onBookingConfirmed(fallbackBooking);
        }
      }
    } catch {
      const fallbackBooking = {
        bookingId: `CAL-BOOK-8821`,
        date: selectedDate,
        timeSlot: selectedSlot.time,
        timezone: timezone.split(' ')[0],
        leadName: contactName,
        companyName: lead?.company?.name || 'Prospect Company',
        meetingLink: 'https://meet.intentos.ai/room/discovery-scoping',
      };
      setConfirmedBooking(fallbackBooking);
      if (onBookingConfirmed) {
        onBookingConfirmed(fallbackBooking);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(calendlyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <Card className="max-w-2xl w-full bg-white border border-[#DCE5EF] shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="p-5 bg-gradient-to-r from-[#0069FF] to-[#0A85EA] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-black text-white text-lg shadow-inner">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-white">
                  Calendly Direct Scheduling
                </span>
                <span className="text-white/80 text-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Live Team Slots
                </span>
              </div>
              <h2 className="text-lg font-bold mt-0.5 text-white">
                IntentOS Solutions Engineering Team
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SMS DISPATCHED BANNER */}
        {initialSmsData && (
          <div className="bg-[#EFF6FF] border-b border-[#2563EB]/20 px-5 py-2.5 flex items-center justify-between text-xs text-[#1E40AF]">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#2563EB]" />
              <span>
                <strong>SMS Delivered:</strong> Sent to{' '}
                <span className="font-mono font-semibold">
                  {initialSmsData.recipientPhone || contactPhone}
                </span>{' '}
                with direct booking link.
              </span>
            </div>
            <button
              onClick={handleCopyLink}
              className="text-[11px] font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
            >
              {copiedLink ? 'Link Copied! ✓' : 'Copy Calendly Link'}
            </button>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {confirmedBooking ? (
            /* SUCCESS CONFIRMATION STATE */
            <div className="py-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">
                  Call Confirmed with Solutions Engineering!
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Lead has been scheduled for direct human consultation. Both calendar invites and confirmation text have been dispatched.
                </p>
              </div>

              <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Booking Reference</span>
                  <span className="font-mono font-bold text-blue-600">
                    {confirmedBooking.bookingId}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Scheduled Date & Time</span>
                  <span className="font-bold text-slate-900">
                    {confirmedBooking.date} &bull; {confirmedBooking.timeSlot} (
                    {confirmedBooking.timezone || 'EST'})
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Target Lead</span>
                  <span className="font-semibold text-slate-900">
                    {confirmedBooking.leadName} ({confirmedBooking.companyName})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Assigned Specialists</span>
                  <span className="font-semibold text-slate-900">
                    Senior Solutions Architecture Team
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  onClick={onClose}
                  className="bg-[#0069FF] hover:bg-[#0052cc] text-white px-6 font-semibold text-xs h-9"
                >
                  Return to Call Cockpit
                </Button>
              </div>
            </div>
          ) : (
            /* BOOKING FORM STATE */
            <div className="space-y-5">
              {/* Meeting Scope Info */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#0069FF] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h4 className="font-bold text-slate-900">
                    30-Minute Technical Scoping & Architecture Review
                  </h4>
                  <p className="text-slate-500 mt-0.5">
                    Connect directly with a dedicated Senior Solutions Engineer to scope architecture, migration timelines, and custom requirements.
                  </p>
                </div>
              </div>

              {/* DATE SELECTOR */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#0069FF]" />
                  1. Select Available Date
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {dates.map((d) => (
                    <button
                      key={d.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(d.dateStr)}
                      className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                        selectedDate === d.dateStr
                          ? 'border-[#0069FF] bg-[#0069FF]/5 ring-2 ring-[#0069FF]/30 font-bold text-[#0069FF]'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="block text-[11px] font-semibold">{d.label.split(',')[0]}</span>
                      <span className="block text-slate-500 text-[10px] mt-0.5">
                        {d.label.split(',')[1] || d.dateStr}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* PREFERRED TIMESLOTS (FROM CALENDLY) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#0069FF]" />
                    2. Select Preferred Timeslot (Preset in Calendly)
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Duration: 30 minutes
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {PRESET_CALENDLY_TIMESLOTS.map((slot) => {
                    const isSelected = selectedSlot.id === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? 'border-[#0069FF] bg-[#0069FF]/10 ring-2 ring-[#0069FF] shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold ${
                              isSelected ? 'text-[#0069FF]' : 'text-slate-900'
                            }`}
                          >
                            {slot.time}
                          </span>
                          {slot.recommended && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-100 text-blue-700 font-bold">
                              RECOMMENDED
                            </span>
                          )}
                          {slot.availability === 'Fastest Response' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-100 text-emerald-700 font-bold">
                              FASTEST
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-1">
                          {slot.period} &bull; {slot.availability}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TIMEZONE & PROSPECT DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0069FF]"
                  >
                    <option value="EST (Eastern Time)">EST (Eastern Time - UTC-5)</option>
                    <option value="PST (Pacific Time)">PST (Pacific Time - UTC-8)</option>
                    <option value="CST (Central Time)">CST (Central Time - UTC-6)</option>
                    <option value="GMT (London Time)">GMT (London Time - UTC+0)</option>
                    <option value="IST (India Standard)">IST (India Standard - UTC+5:30)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    Prospect Name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0069FF]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    Work Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0069FF]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    Mobile (SMS Recipient)
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0069FF]"
                  />
                </div>
              </div>

              {/* NOTES / DISCUSSION POINTS */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Topics for Technical Scoping
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0069FF]"
                />
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        {!confirmedBooking && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Selected:{' '}
              <strong className="text-slate-800">
                {selectedDate} &bull; {selectedSlot.time}
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-9 text-xs border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isSubmitting}
                size="sm"
                className="h-9 text-xs bg-[#0069FF] hover:bg-[#0052cc] text-white font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Calendar className="w-4 h-4" />
                <span>{isSubmitting ? 'Booking Timeslot...' : 'Confirm Call with Team'}</span>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
