import type { ChecklistItem, JourneyDetails, KnowledgeArticle, PassengerProfile } from '../types';
import { VERIFIED_KNOWLEDGE_ARTICLES } from './verifiedKnowledgeBase';
import { calculateReadinessScore } from './travelRequirementsEngine';
import { getContent } from '../utils/opsStore';

/**
 * Pearl Travel assistant brain.
 * Scope is deliberately narrow: Uganda border travel (Malaba OSBP and related rules) and how to use this app.
 * Everything it says comes from the verified knowledge base, admin-published FAQs, or the traveller's own data.
 * Anything else gets a polite out-of-scope reply instead of a guess.
 */

export interface AssistantContext {
  profile?: PassengerProfile | null;
  journey?: JourneyDetails | null;
  checklist: ChecklistItem[];
  lastArticleId?: string | null;
}

export interface AssistantReply {
  text: string;
  citations: string[];
  followUps: string[];
  articleId?: string;
  kind: 'greeting' | 'personal' | 'knowledge' | 'app' | 'followup' | 'no-data' | 'out-of-scope';
}

export const OUT_OF_SCOPE_TEXT =
  "I can only help with travelling to Uganda through the border (visas, passports, Yellow Fever, customs, vehicles, Malaba clearance) and with using the Pearl Travel app. I can't help with that topic, but I'm happy to answer something in those areas.";

const DOMAIN_WORDS = [
  'uganda', 'ugandan', 'malaba', 'busia', 'katuna', 'entebbe', 'osbp', 'border', 'immigration', 'dcic', 'ura', 'customs', 'duty',
  'visa', 'evisa', 'passport', 'permit', 'yellow', 'fever', 'vaccin', 'health', 'travel', 'traveller', 'traveler', 'trip', 'journey',
  'entry', 'enter', 'exit', 'cross', 'crossing', 'clearance', 'checkpoint', 'document', 'documents', 'ticket', 'invitation', 'insurance',
  'luggage', 'baggage', 'cash', 'currency', 'declare', 'vehicle', 'car', 'drive', 'bus', 'transit', 'eac', 'kenya', 'tanzania', 'rwanda',
  'congo', 'sudan', 'burundi', 'somalia', 'accommodation', 'hotel', 'stay', 'qr', 'checklist', 'readiness', 'score', 'profile', 'offline',
  'notification', 'alert', 'app', 'pearl', 'officer', 'biometric', 'fingerprint', 'stamp', 'quarantine', 'comesa', 'drone', 'tourist',
];

const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'do', 'does', 'i', 'to', 'for', 'of', 'in', 'on', 'at', 'and', 'or', 'my', 'me', 'can', 'what', 'how', 'when', 'where', 'which', 'need', 'have', 'there', 'it', 'with', 'about', 'any', 'will', 'should', 'this', 'that', 'be']);

const tokens = (s: string) => s.toLowerCase().replace(/[^a-z0-9$\s]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w));
const hasWord = (q: string, w: string) => new RegExp(`\\b${w}`).test(q);

function firstName(profile?: PassengerProfile | null) {
  return (profile?.firstName || profile?.fullName?.split(' ')[0] || 'traveller').trim();
}

const CAPABILITIES = [
  'Border rules: visas, passports, Yellow Fever, customs, vehicles, transit',
  'How Malaba One-Stop Border Post clearance works',
  'Your own readiness: what is missing and what to do next',
  'How to use the app: checklist, QR pass, offline mode, alerts',
];

function bullets(article: KnowledgeArticle, max = 4): string[] {
  return article.detailedContent
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^(\d+\.|•|-)\s/.test(l))
    .map((l) => l.replace(/^(\d+\.|•|-)\s*/, ''))
    .slice(0, max);
}

function related(article: KnowledgeArticle): string[] {
  const picks = VERIFIED_KNOWLEDGE_ARTICLES.filter((a) => a.id !== article.id).slice(0, 2);
  const titles: Record<string, string> = {
    'kb-malaba-osbp-clearing': 'How does clearance work at Malaba?',
    'kb-yellow-fever': 'What are the Yellow Fever card rules?',
    'kb-eac-free-movement': 'Can EAC citizens enter with a National ID?',
    'kb-evisa-application': 'How do I apply for a Uganda eVisa?',
    'kb-road-vehicle-clearance': 'What do I need to drive a car across?',
    'kb-customs-allowances': 'What are the customs allowances?',
    'kb-transit-rules': 'What are the transit rules through Uganda?',
  };
  return picks.map((p) => titles[p.id] || p.title);
}

// Words that appear in many articles say little about the topic, so they never count on their own.
const GENERIC = new Set(['malaba', 'border', 'kenya', 'uganda', 'road', 'travel', 'osbp', 'east africa', 'citizen', 'procedure', 'route', 'online', 'health', 'medical', 'stop', 'post', 'operating', 'procedures', 'international']);

function scoreArticle(q: string, a: KnowledgeArticle): number {
  let s = 0;
  for (const kw of a.keywords) if (!GENERIC.has(kw) && q.includes(kw)) s += 2;
  for (const tw of a.title.toLowerCase().split(/[^a-z]+/)) if (tw.length > 3 && !GENERIC.has(tw) && q.includes(tw)) s += 1.5;
  return s;
}

function personalNote(a: KnowledgeArticle, ctx: AssistantContext): string {
  const nationality = ctx.profile?.nationality || '';
  if (a.id === 'kb-eac-free-movement' || a.id === 'kb-evisa-application') {
    if (!nationality) return 'Add your nationality in your profile and I can tell you which applies to you.\n\n';
    const eac = ['Uganda', 'Kenya', 'Tanzania', 'Rwanda', 'Burundi', 'South Sudan', 'Democratic Republic of the Congo', 'Somalia'].includes(nationality);
    return eac
      ? `Your profile nationality is ${nationality}, so you are eligible for EAC visa-exempt entry.\n\n`
      : `Your profile nationality is ${nationality}, so you will need an approved Uganda eVisa or East Africa Tourist Visa.\n\n`;
  }
  return '';
}

function articleReply(a: KnowledgeArticle, ctx: AssistantContext, full = false): AssistantReply {
  const points = bullets(a, full ? 20 : 4);
  const body = full
    ? `${personalNote(a, ctx)}${a.detailedContent}`
    : `${personalNote(a, ctx)}${a.summary}${points.length ? '\n\n' + points.map((p) => `• ${p}`).join('\n') : ''}`;
  return {
    text: body,
    articleId: a.id,
    kind: 'knowledge',
    citations: [a.officialAuthority, `Reviewed ${a.lastReviewedDate}`],
    followUps: full ? related(a) : ['Tell me more about this', ...related(a).slice(0, 2)],
  };
}

export function answerQuestion(rawQuestion: string, ctx: AssistantContext): AssistantReply {
  const q = rawQuestion.toLowerCase().trim();
  const name = firstName(ctx.profile);
  const words = tokens(q);

  // 1. Greetings, thanks, capabilities
  if (/^(hi|hello|hey|good (morning|afternoon|evening)|habari|jambo|mambo|sasa)\b/.test(q) && words.length <= 4) {
    return {
      kind: 'greeting',
      text: `Hello ${name}! I'm your Pearl Travel assistant. I can help with:\n${CAPABILITIES.map((c) => `• ${c}`).join('\n')}\n\nWhat would you like to know?`,
      citations: [],
      followUps: ['What am I still missing?', 'Do I need a visa?', 'What are the Yellow Fever rules?'],
    };
  }
  if (/\b(thanks|thank you|asante|cheers|great|perfect)\b/.test(q) && words.length <= 5) {
    return { kind: 'greeting', text: `You're welcome, ${name}! Ask me anything else about your border crossing.`, citations: [], followUps: ['What am I still missing?', 'How does clearance work at Malaba?'] };
  }
  if (/(who are you|what can you do|what do you do|help me|^help$|what can i ask)/.test(q)) {
    return {
      kind: 'greeting',
      text: `I'm the Pearl Travel assistant. I answer only from verified Uganda immigration and customs information and from your own checklist. I can help with:\n${CAPABILITIES.map((c) => `• ${c}`).join('\n')}`,
      citations: [],
      followUps: ['What am I still missing?', 'Do I need a visa?', 'How do I use the QR pass?'],
    };
  }

  // 2. Personal readiness / checklist
  const asksStatus =
    /(what('?s| is| am i)? (still )?(missing|left|outstanding))|(am i ready)|(how ready)|(my (readiness|score|checklist|progress))|(what do i (still )?(need|lack))|(next step)/.test(q);
  if (asksStatus) {
    const r = calculateReadinessScore(ctx.checklist);
    if (r.totalCount === 0) {
      return { kind: 'personal', text: 'Your checklist is empty. Set up your journey first and I will build it for you.', citations: [], followUps: ['How do I set up my journey?'] };
    }
    if (r.missingItems.length === 0) {
      return {
        kind: 'personal',
        text: `${name}, your checklist is complete (${r.completedCount} of ${r.totalCount}) and your readiness score is ${r.score}%. Carry the original documents and show your QR summary at the border.`,
        citations: ['Your Pearl Travel checklist'],
        followUps: ['How does clearance work at Malaba?', 'How do I use the QR pass?'],
      };
    }
    const mand = r.missingItems.filter((i) => i.mandatory);
    const lines = r.missingItems.slice(0, 6).map((i) => `• ${i.title}${i.mandatory ? ' (mandatory)' : ' (optional)'}${i.status === 'expired' ? ' – expired' : ''}`);
    return {
      kind: 'personal',
      text: `${name}, your readiness score is ${r.score}%. ${r.completedCount} of ${r.totalCount} items are done and ${mand.length} mandatory item${mand.length === 1 ? ' is' : 's are'} still missing:\n${lines.join('\n')}\n\nOpen the Checklist tab and mark each document as Have It once you hold it.`,
      citations: ['Your Pearl Travel checklist'],
      followUps: ['How is my score calculated?', mand[0] ? `Tell me about: ${mand[0].title.replace(/\s*\(.*\)/, '')}` : 'What are the Yellow Fever rules?'],
    };
  }
  if (/how.*(score|readiness).*(work|calculat|compute)|score work/.test(q)) {
    return {
      kind: 'app',
      text: 'Each checklist item counts toward your score. Mandatory documents count double and optional ones count once. Items marked Have It earn their points, missing or expired items earn none, and items marked N/A are left out. You are Ready only at 100% with no mandatory item missing.',
      citations: ['Pearl Travel readiness engine'],
      followUps: ['What am I still missing?'],
    };
  }
  if (/\bwhat documents|which documents|documents (do i|should i|to) (need|carry|bring)|\bdocuments needed|show documents\b/.test(q) || (hasWord(q, 'documents') && /(need|carry|bring|required)/.test(q))) {
    const sym = (i: ChecklistItem) => (i.status === 'complete' ? '✔' : i.status === 'not_applicable' ? '–' : '✖');
    const list = ctx.checklist.map((i) => `${sym(i)} ${i.title}${i.mandatory ? '' : ' (optional)'}`);
    if (list.length) {
      return {
        kind: 'personal',
        text: `For your trip as a ${ctx.profile?.travelPurpose || 'traveller'}, here are your documents (✔ done, ✖ missing, – not applicable):\n${list.join('\n')}`,
        citations: ['Your Pearl Travel checklist', 'DCIC & Ministry of Health requirements'],
        followUps: ['What am I still missing?', 'What are the Yellow Fever rules?'],
      };
    }
  }

  // 3. App help
  const appTopics: [RegExp, string, string[]][] = [
    [/\bqr\b/, 'Open the QR Pass tab to see your readiness QR code. An officer can scan it or look you up by name. It is an informational summary, not an entry approval, and it also works offline once loaded.', ['How does clearance work at Malaba?']],
    [/offline|no internet|no network|no signal/, 'Open Offline Access from the menu to see what is saved on your device: requirements, checklist, profile, border guide and QR summary. Live AI answers and the newest updates need a connection.', ['What am I still missing?']],
    [/notification|alert/, 'The Alerts tab lists what needs attention, such as missing mandatory documents and new requirement updates. Tap an alert to jump to the right screen, or use Clear All.', []],
    [/(set ?up|configure|add|change).*(journey|trip)|journey (set ?up|details)/, 'Open Home and tap Configure Journey. Choose your purpose, border post, travel date and travel mode, then generate your requirements.', ['What am I still missing?']],
    [/profile|passport number|emergency contact/, 'Open Profile to edit your personal details, passport information and emergency contact. A complete profile improves your requirement list.', []],
  ];
  for (const [re, text, followUps] of appTopics) {
    if (re.test(q) && /(how|where|what|show|open|use|find|work)/.test(q)) {
      return { kind: 'app', text, citations: ['Pearl Travel app guide'], followUps };
    }
  }

  // 4. Follow-ups that refer to the previous topic
  const last = ctx.lastArticleId ? VERIFIED_KNOWLEDGE_ARTICLES.find((a) => a.id === ctx.lastArticleId) : undefined;
  const isFollowUp = words.length <= 6 && /^(tell me more|more|more details|details|explain|go on|continue|elaborate|and|what about|how much|cost|fee|price|how long|why|really|is that|does that|can i|do i)\b/.test(q);
  if (last && isFollowUp && !VERIFIED_KNOWLEDGE_ARTICLES.some((a) => a.id !== last.id && scoreArticle(q, a) >= 2)) {
    if (/(how much|cost|fee|price|pay|\$|ugx)/.test(q)) {
      const money = last.detailedContent.split('\n').filter((l) => /\$|UGX|fee/i.test(l)).map((l) => l.trim().replace(/^(\d+\.|•|-)\s*/, ''));
      return money.length
        ? { kind: 'followup', articleId: last.id, text: `Costs mentioned in the official guidance:\n${money.map((m) => `• ${m}`).join('\n')}`, citations: [last.officialAuthority], followUps: related(last) }
        : { kind: 'followup', articleId: last.id, text: 'The official guidance I have for this topic does not list a fee. Please confirm costs on the official DCIC or URA portal.', citations: [last.officialAuthority], followUps: related(last) };
    }
    return { ...articleReply(last, ctx, true), kind: 'followup' };
  }

  // 5. Verified knowledge base
  let best: KnowledgeArticle | null = null;
  let top = 0;
  for (const a of VERIFIED_KNOWLEDGE_ARTICLES) {
    const s = scoreArticle(q, a);
    if (s > top) { top = s; best = a; }
  }
  if (best && top >= 2) return articleReply(best, ctx);

  // 6. Administrator-published FAQs (so content added in the admin portal is answerable)
  const qTokens = new Set(words);
  const faq = getContent()
    .filter((c) => c.status === 'published' && (c.module === 'faqs' || c.module === 'requirements' || c.module === 'guidance'))
    .map((c) => ({ c, overlap: tokens(`${c.title} ${c.body}`).filter((t) => t.length > 3 && qTokens.has(t)).length }))
    .sort((x, y) => y.overlap - x.overlap)[0];
  if (faq && faq.overlap >= 2) {
    return { kind: 'knowledge', text: `${faq.c.title}\n\n${faq.c.body}`, citations: ['Pearl Travel administrator-approved content'], followUps: ['What am I still missing?'] };
  }

  // 7. In scope but no verified answer, otherwise out of scope
  const inDomain = DOMAIN_WORDS.some((w) => hasWord(q, w));
  if (inDomain) {
    return {
      kind: 'no-data',
      text: "I don't have verified information on that specific point, so I won't guess. Please check the official DCIC portal or ask the immigration officer at the border. In the meantime I can help with visas, Yellow Fever, customs, vehicles, Malaba clearance and your own checklist.",
      citations: ['Uganda Directorate of Citizenship & Immigration Control (DCIC)'],
      followUps: ['Do I need a visa?', 'What am I still missing?', 'How does clearance work at Malaba?'],
    };
  }
  return { kind: 'out-of-scope', text: OUT_OF_SCOPE_TEXT, citations: [], followUps: ['Do I need a visa?', 'What am I still missing?', 'What are the customs allowances?'] };
}
