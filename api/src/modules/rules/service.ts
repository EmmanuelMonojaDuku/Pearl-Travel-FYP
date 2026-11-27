import type { QueryExecutor } from '../../database/types.js';
import {
  evaluateRules,
  type EvaluationProfile,
  type EvaluationResult,
  type NationalityGroupConfig,
  type RuleRecord,
} from '../../../../shared/rulesEvaluator.js';

interface RuleRow {
  code: string;
  category: RuleRecord['category'];
  title: string;
  summary: string;
  simple_explanation: string;
  applicable_condition: string;
  official_source: string;
  mandatory: boolean;
  version: number;
  rule_metadata: {
    order?: number;
    when?: RuleRecord['when'];
    checklist?: RuleRecord['checklist'];
    verification?: RuleRecord['verification'];
  };
  workflow_status: string;
}

export function mapRuleRow(r: RuleRow): RuleRecord {
  const m = r.rule_metadata ?? {};
  return {
    code: r.code,
    category: r.category,
    title: r.title,
    summary: r.summary,
    simpleExplanation: r.simple_explanation,
    applicableCondition: r.applicable_condition,
    officialSource: r.official_source,
    mandatory: r.mandatory,
    order: m.order ?? 1000,
    version: r.version,
    when: m.when ?? {},
    checklist: m.checklist ?? null,
    verification: m.verification ?? { status: 'pending', verifiedAt: null },
  };
}

const EMPTY_GROUPS: NationalityGroupConfig = { citizen: ['Uganda'], eac: [], visaExempt: [] };

export class RulesService {
  constructor(private readonly db: QueryExecutor) {}

  public async getGroups(): Promise<NationalityGroupConfig> {
    const r = await this.db.query<{ value_json: NationalityGroupConfig }>(
      `SELECT value_json FROM public.pt_admin_settings WHERE key = 'nationality_groups'`
    );
    return r.rows[0]?.value_json ?? EMPTY_GROUPS;
  }

  /** Published rules only: draft, pending and archived records never reach travellers. */
  public async getPublishedRules(): Promise<RuleRecord[]> {
    const r = await this.db.query<RuleRow>(
      `SELECT code, category, title, summary, simple_explanation, applicable_condition, official_source,
              mandatory, version, rule_metadata, workflow_status
         FROM public.pt_admin_requirements
        WHERE workflow_status = 'published'
        ORDER BY code`
    );
    return r.rows.map(mapRuleRow);
  }

  public async snapshot() {
    const [rules, groups] = await Promise.all([this.getPublishedRules(), this.getGroups()]);
    const version = rules.reduce((sum, x) => sum + x.version, 0);
    return { generatedAt: new Date().toISOString(), version, groups, rules };
  }

  public async evaluate(profile: EvaluationProfile): Promise<EvaluationResult & { rulesVersion: number }> {
    const snap = await this.snapshot();
    return { ...evaluateRules(profile, snap.rules, snap.groups), rulesVersion: snap.version };
  }
}
