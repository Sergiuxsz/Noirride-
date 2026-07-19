import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const HelpPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'concierge' | 'protocol' | 'faq' | 'contact'>('concierge');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const faqs = [
    {
      question: "How does the VIP Executive Chauffeur Protocol function?",
      answer: "Every NoirRide chauffeur is security-cleared and rigorously trained in executive protective driving, discretion, and diplomatic etiquette. Vehicles arrive 15 minutes prior to scheduled departure equipped with customized climate, refreshments, and secure Wi-Fi."
    },
    {
      question: "Can I request armored or specialized high-security transit?",
      answer: "Yes. Our Tier-1 Fleet includes VR6/VR7 certified armored luxury sedans and SUVs upon advance request through our 24/7 Concierge desk."
    },
    {
      question: "What is the cancellation and rescheduling policy?",
      answer: "VIP reservations may be modified or cancelled without penalty up to 2 hours prior to scheduled pickup for standard luxury vehicles, and up to 12 hours prior for specialized or armored fleet dispatches."
    },
    {
      question: "How are airport transfers and private terminal pickups coordinated?",
      answer: "Our operations desk monitors real-time flight telemetry and coordinates directly with FBOs (Fixed Base Operators) and private aviation terminals to ensure your chauffeur is staged tarmac-side or at VIP arrivals prior to touchdown."
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="container-custom py-10 px-4 max-w-4xl mx-auto min-h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[11px] font-semibold tracking-widest uppercase mb-3">
          Support Protocol
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#F8FAFC] font-bold tracking-tight">
          24/7 VIP Concierge & Support Desk
        </h1>
        <p className="text-xs sm:text-sm text-[#94A3B8] max-w-xl mx-auto mt-2 leading-relaxed">
          Our dedicated operations team is standing by to assist with bespoke itinerary adjustments, security briefings, and real-time dispatch inquiries.
        </p>
      </div>

      {/* Category Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8">
        {[
          { id: 'concierge', label: 'Live Concierge', icon: '💎' },
          { id: 'protocol', label: 'Security & Fleet', icon: '🛡️' },
          { id: 'faq', label: 'Protocol FAQ', icon: '📜' },
          { id: 'contact', label: 'Priority Dispatch', icon: '🛰️' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id as any);
              setIsSubmitted(false);
            }}
            className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between h-20 ${
              selectedCategory === cat.id
                ? 'bg-[#12141C] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10'
                : 'bg-[#12141C]/50 border-white/10 hover:border-white/20'
            }`}
          >
            <span className="text-lg">{cat.icon}</span>
            <span className={`text-xs font-semibold ${selectedCategory === cat.id ? 'text-[#D4AF37]' : 'text-white'}`}>
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      {/* Dynamic Section Content */}
      <div className="bg-[#12141C] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
        {selectedCategory === 'faq' ? (
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-bold text-white mb-4">Frequently Asked Questions</h3>
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-white/10 rounded-xl overflow-hidden transition-colors bg-[#0A0B0E]/50"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full text-left p-4 flex items-center justify-between font-semibold text-sm text-[#F8FAFC] hover:text-[#D4AF37] transition-colors"
                >
                  <span>{faq.question}</span>
                  <span className="text-lg font-mono text-[#D4AF37] ml-4">
                    {activeFaq === index ? '−' : '+'}
                  </span>
                </button>
                {activeFaq === index && (
                  <div className="px-4 pb-4 text-xs text-[#94A3B8] leading-relaxed border-t border-white/5 pt-3 animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : selectedCategory === 'concierge' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-block px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold tracking-wider uppercase border border-emerald-500/20">
                • Operations Live Active
              </div>
              <h3 className="font-serif text-2xl font-bold text-white">Direct Chauffeur Desk</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Connect instantly with our Global Operations Center in Zurich and London for immediate dispatch override or private aviation tarmac transfers.
              </p>
              <div className="space-y-2 pt-2 text-xs">
                <div className="flex items-center gap-3 text-white">
                  <span className="text-[#D4AF37] font-semibold">Priority Line:</span>
                  <span className="font-mono text-sm tracking-wider">+41 (0) 44 580 9900</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <span className="text-[#D4AF37] font-semibold">Concierge Email:</span>
                  <span className="font-mono text-sm">concierge@noirride.vip</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <span className="text-[#D4AF37] font-semibold">Encrypted Line:</span>
                  <span className="font-mono text-xs text-emerald-400">Signal / Threema Verified</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0A0B0E] p-6 rounded-xl border border-white/10 space-y-4">
              <h4 className="font-bold text-sm text-white flex items-center justify-between">
                <span>Immediate Callback Request</span>
                <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping"></span>
              </h4>
              <Input label="Your Contact Number" placeholder="+40 700 000 000" />
              <Button variant="primary" className="w-full py-2.5 text-xs font-bold uppercase tracking-wider">
                Request Priority Call
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-white mb-2">Send Dispatch Inquiry</h3>
                <Input
                  label="Inquiry Subject"
                  placeholder="e.g. Armored Fleet Request for Geneva Summit"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
                    Detailed Request / Itinerary Notes
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide specific requirements, tail numbers, or security protocol details..."
                    className="w-full bg-[#0A0B0E] text-[#F8FAFC] placeholder-[#64748B] border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                    required
                  />
                </div>
                <Button type="submit" variant="primary" className="w-full py-3 text-xs font-bold tracking-widest uppercase mt-2">
                  Transmit Secure Message
                </Button>
              </form>
            ) : (
              <div className="text-center py-8 space-y-3 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  ✓
                </div>
                <h3 className="font-serif text-lg font-bold text-white">Transmission Acknowledged</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Your request has been prioritized and routed to the Duty Operations Officer. Expect a callback or encrypted briefing within 10 minutes.
                </p>
                <Button
                  onClick={() => setIsSubmitted(false)}
                  variant="secondary"
                  className="mt-4 text-xs"
                >
                  Submit Another Inquiry
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
