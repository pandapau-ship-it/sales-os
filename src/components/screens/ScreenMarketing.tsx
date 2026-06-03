/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Megaphone, Sparkles, Link2, FileText, ArrowRight } from 'lucide-react';
import type { LinkedInPostIdea } from '@/types';

interface ScreenMarketingProps {
  ideas: LinkedInPostIdea[];
  onPublishPost: (id: string, text: string) => void;
}

export default function ScreenMarketing({
  ideas,
  onPublishPost: _onPublishPost
}: ScreenMarketingProps) {
  const [subTab, setSubTab] = useState<'posts' | 'campaigns'>('posts');
  const [activeIdeaId, setActiveIdeaId] = useState<string | null>('idea-1');
  
  // Custom creator
  const [customTopic, setCustomTopic] = useState('');
  const [customKeywords, setCustomKeywords] = useState('');
  const [aiDraftOutput, setAiDraftOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateLinkedInPost = async () => {
    if (!customTopic) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/gemini/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: customTopic,
          keywords: customKeywords.split(',').map(s => s.trim())
        })
      });
      const data = await response.json();
      setAiDraftOutput(data.post || 'Konnte keinen Entwurf erstellen.');
    } catch (e) {
      setAiDraftOutput(`LinkedIn Post Entwurf:\n\nInteressantes Thema: ${customTopic}!\n\nIn der heutigen weichen SaaS-Landschaft ist besonders ${customKeywords} entscheidend. Was denken eure AMs?\n\n#B2BSales #CustomerSuccess`);
    } finally {
      setIsGenerating(false);
    }
  };

  const getActiveIdeaDraft = () => {
    if (activeIdeaId === 'custom') return aiDraftOutput;
    return ideas.find(i => i.id === activeIdeaId)?.draft || '';
  };

  const setActiveDraftValue = (val: string) => {
    if (activeIdeaId === 'custom') {
      setAiDraftOutput(val);
    } else {
      const idea = ideas.find(i => i.id === activeIdeaId);
      if (idea) idea.draft = val;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in font-sans pb-12">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-semibold text-text-primary tracking-tight">Marketing Hub & Thought Leadership</h1>
        <p className="text-[12px] text-text-muted mt-0.5">Generiere Reichweite auf LinkedIn und erstelle qualifizierte Inhalte für B2B Sales.</p>
      </div>

      {/* Sub Nav */}
      <div className="flex gap-2 p-1.5 bg-app-surface rounded-pill shadow-[0_4px_20px_rgb(0,0,0,0.04)] w-fit items-center">
        <button
          onClick={() => setSubTab('posts')}
          className={`px-4.5 py-1.5 text-[12px] font-medium transition-all rounded-pill cursor-pointer flex items-center gap-1.5 ${
            subTab === 'posts' ? 'bg-sherloq-primary text-white' : 'text-text-body hover:bg-app-bg'
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span>LinkedIn Kampagnen & Posts</span>
        </button>
        <button
          onClick={() => setSubTab('campaigns')}
          className={`px-4.5 py-1.5 text-[12px] font-medium transition-all rounded-pill cursor-pointer flex items-center gap-1.5 ${
            subTab === 'campaigns' ? 'bg-sherloq-primary text-white' : 'text-text-body hover:bg-app-bg'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Inbound Newsletter Kampagnen</span>
        </button>
      </div>

      {subTab === 'posts' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Left Selection list */}
          <div className="md:col-span-1 bg-app-surface rounded-[32px] p-6 flex flex-col gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider">Themenvorschläge</span>
            
            <div className="flex flex-col gap-2">
              {ideas.map((idea) => (
                <button
                  key={idea.id}
                  onClick={() => setActiveIdeaId(idea.id)}
                  className={`p-3.5 rounded-[16px] border text-left cursor-pointer transition-all ${
                    activeIdeaId === idea.id
                      ? 'bg-[var(--sherloq-light)] border-sherloq-primary/20 text-sherloq-primary'
                      : 'bg-app-surface border-border hover:bg-app-bg text-text-body'
                  }`}
                >
                  <h4 className="text-[12px] font-semibold leading-tight">{idea.topic}</h4>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {idea.keywords.slice(0, 2).map((k, i) => (
                      <span key={i} className="text-[9px] font-mono bg-app-surface/60 text-stone-500 border border-stone-200/50 px-1.5 py-0.5 rounded-pill">
                        #{k}
                      </span>
                    ))}
                  </div>
                </button>
              ))}

              <button
                onClick={() => {
                  setActiveIdeaId('custom');
                  if (!aiDraftOutput) {
                    setCustomTopic('B2B Sales Ramping der Zukunft');
                    setCustomKeywords('BDR Ramping, Sales Enablement, Sherloq OS');
                  }
                }}
                className={`p-3.5 rounded-[16px] border text-left cursor-pointer transition-all ${
                  activeIdeaId === 'custom'
                    ? 'bg-[var(--sherloq-light)] border-sherloq-primary/20 text-sherloq-primary'
                    : 'bg-app-bg border-dashed border-[#C1C9D0] text-text-muted hover:bg-[#F1F3F5]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[12px]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Eigener AI-Post Creator</span>
                </div>
                <p className="text-[10px] text-text-muted mt-1 leading-snug">Erstelle einen eigenen Post mit Gemini</p>
              </button>
            </div>
          </div>

          {/* Right Editor panel */}
          <div className="md:col-span-2 flex flex-col gap-4">
            {activeIdeaId === 'custom' && (
              <div className="bg-[var(--sherloq-light)]/60 rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-sherloq-primary/5">
                <span className="text-[11px] font-mono text-sherloq-primary font-bold">GEMINI GENERATOR FORMULAR</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mb-1">LinkedIn Thema</label>
                    <input 
                      type="text"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="z.B. Wie Sales Ops SDRs entlastet..."
                      className="w-full text-[12px] bg-app-surface border border-border focus:border-sherloq-primary rounded-[12px] px-3.5 py-2 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mb-1">Hashtags / Key-Phrases</label>
                    <input 
                      type="text"
                      value={customKeywords}
                      onChange={(e) => setCustomKeywords(e.target.value)}
                      placeholder="z.B. SalesOps, SDR, Automatisierung"
                      className="w-full text-[12px] bg-app-surface border border-border focus:border-sherloq-primary rounded-[12px] px-3.5 py-2 focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={handleGenerateLinkedInPost}
                  disabled={isGenerating || !customTopic}
                  className="mt-4 bg-sherloq-primary hover:bg-sherloq-primary/95 text-white font-sans text-[12px] font-semibold px-4.5 py-2 rounded-pill cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isGenerating ? 'Wird entworfen...' : 'Entwurf generieren'}
                </button>
              </div>
            )}

            <div className="bg-app-surface rounded-[32px] p-6 flex flex-col gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex justify-between items-center border-b border-[var(--app-bg)] pb-3">
                <span className="text-[12px] font-mono text-text-muted">Texteditor & Campaign Preview</span>
                <span className="text-[11px] font-mono text-sherloq-primary bg-[var(--sherloq-light)] px-2 py-0.5 rounded-pill">Optimal Sentiment</span>
              </div>

              {activeIdeaId === 'custom' && !aiDraftOutput && !isGenerating ? (
                <div className="p-8 text-center text-text-muted border border-dashed border-[#C1C9D0] rounded-[16px]">
                  Gib links ein Thema ein und klicke auf "Entwurf generieren", um die Magie der Gemini API zu erleben.
                </div>
              ) : (
                <textarea
                  value={getActiveIdeaDraft()}
                  onChange={(e) => setActiveDraftValue(e.target.value)}
                  className="w-full text-[13px] font-mono leading-relaxed p-4 bg-app-bg border border-border focus:border-sherloq-primary rounded-[16px] focus:outline-none"
                  rows={10}
                />
              )}

              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getActiveIdeaDraft());
                    alert("Entwurf in die Zwischenablage kopiert! Bereit für LinkedIn.");
                  }}
                  className="bg-app-bg text-text-body text-[12px] border border-border hover:bg-[var(--border)] font-semibold rounded-pill px-4.5 py-2 cursor-pointer transition-all"
                >
                  Post kopieren
                </button>
                <button
                  onClick={() => {
                    alert("Simulation gestartet! Der Post wird für Ihren Social Profile Queue eingeplant.");
                  }}
                  className="bg-sherloq-primary hover:bg-sherloq-primary/95 text-white text-[12px] font-semibold rounded-pill px-5 py-2 cursor-pointer transition-all shadow-sm"
                >
                  LinkedIn Veröffentlichen (Simulation)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === 'campaigns' && (
        <div className="bg-app-surface rounded-[32px] p-8 text-center max-w-xl mx-auto shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <FileText className="w-10 h-10 text-sherloq-primary mx-auto opacity-80" />
          <h3 className="text-[14px] font-semibold text-text-primary mt-3">SDR Inbound Newsletter</h3>
          <p className="text-[12px] text-text-muted mt-1">
            Erstelle automatisierte Inbound-Newsletter-Sequenzen, die deine Leads basierend auf deren Engagement-Score erhalten.
          </p>

          <div className="bg-app-bg rounded-[24px] p-6 text-left mt-6 flex flex-col gap-3">
            <span className="text-[11px] font-mono text-sherloq-primary font-bold">AUTOMATISIERTE WORKFLOW KAMPAIGN: "SDR-Raming"</span>
            
            <div className="h-[120px] bg-app-surface border border-border p-4 rounded-card flex flex-col justify-between">
              <span className="text-[10px] font-mono text-cyan-700 bg-[var(--sherloq-light)] px-2 py-0.5 rounded-pill w-fit">Trigger Event</span>
              <p className="text-[11px] font-bold text-text-primary">Lead hat Heat-Status "WARM" erreicht (Inbound Demo)</p>
              <div className="flex items-center gap-1.5 text-[11px] text-text-body">
                <ArrowRight className="w-3.5 h-3.5 text-sherloq-primary" />
                <span>Nächste Aktion: Sende Mail "Einfacher BDR Coaching Guide" in 48 Stunden</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
