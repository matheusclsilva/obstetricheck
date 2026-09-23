export type AlertSeverity = 'critical' | 'high' | 'medium' | 'info';

export interface ClinicalAlert {
  severity: AlertSeverity;
  title: string;
  desc: string;
  actionRequired?: string;
}

export interface StatsSummary {
  puerperas: number;
  gestantes: number;
  curetagem: number;
  vagos: number;
  reviewed: number;
  alertCount: number;
  total: number;
}
