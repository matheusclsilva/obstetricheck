import { Bed } from '../types/bed';
import { ClinicalAlert } from '../types/clinical';
import { parseAndEvaluateBP, getBedBP } from './bpAnalyzer';

export const analyzeBedAlerts = (bed: Bed): ClinicalAlert[] => {
  const alerts: ClinicalAlert[] = [];
  if (!bed || bed.type === 'vago') return alerts;

  // --- AVALIAÇÃO CENTRAL DE PRESSÃO ARTERIAL (AUTO-DETECTADA PARA TODAS AS PACIENTES) ---
  const rawBP = getBedBP(bed);
  const bpEval = parseAndEvaluateBP(rawBP);

  if (bpEval.isHypertensiveCrisis) {
    alerts.push({
      severity: 'critical',
      title: 'ALERTA: CRISE HIPERTENSIVA (PA ≥ 160x110)',
      desc: `PA aferida: ${bpEval.shortFormatted} mmHg. Alto risco de AVC e Eclâmpsia. CHAMAR PLANTONISTA IMEDIATAMENTE E QUESTIONAR SOBRE SULFATAÇÃO (ZUSPAN) + HIDRALAZINA!`,
      actionRequired: 'Chamar plantonista + Sulfatação (Zuspan)'
    });
  } else if (bpEval.isElevated) {
    alerts.push({
      severity: 'high',
      title: 'HIPERTENSÃO / PA ELEVADA (≥ 140x90)',
      desc: `PA aferida: ${bpEval.shortFormatted} mmHg. Monitorar proteinúria, sintomas de iminência, controle de 4/4h e avaliar Metildopa.`
    });
  } else if (bpEval.isHypotensive) {
    alerts.push({
      severity: 'medium',
      title: 'HIPOTENSÃO ARTERIAL (< 90x60)',
      desc: `PA aferida: ${bpEval.shortFormatted} mmHg. Avaliar perdas volêmicas / sangramento pós-parto, hidratação e sinais de choque.`
    });
  }

  // --- PUÉRPERA ---
  if (bed.type === 'puerpera') {
    const d = bed.data;
    if (!d) return alerts;

    // Atonia / Hipotonia
    if (d.uterus === 'hipotonico') {
      alerts.push({
        severity: 'critical',
        title: 'ATONIA / HIPOTONIA UTERINA',
        desc: 'Risco iminente de Hemorragia Pós-Parto (HPP). Iniciar massagem bimanual, ocitocina rápida e considerar misoprostol/ergotrate.',
        actionRequired: 'Massagem bimanual + Ocitocina EV rápida'
      });
    }

    // Endometrite
    if (d.lochia === 'fetido') {
      alerts.push({
        severity: 'high',
        title: 'SUSPEITA DE ENDOMETRITE',
        desc: 'Lóquios fétidos. Avaliar febre, dolorimento uterino e necessidade de Clindamicina + Gentamicina EV.'
      });
    }

    // Profilaxia Anti-D (MATERGAN)
    if (d.rhScreening === 'rh_neg_rn_pos') {
      alerts.push({
        severity: 'medium',
        title: 'PROFILAXIA ANTI-D PENDENTE (MATERGAN)',
        desc: 'Mãe Rh Negativo com RN Rh Positivo. Prescrever MATERGAN: 1 ampola, IM, AGORA (em até 72h).',
        actionRequired: 'MATERGAN 1 AMP IM AGORA'
      });
    }

    // Retenção Urinária
    if (d.eliminations?.includes('retencao_globo')) {
      alerts.push({
        severity: 'medium',
        title: 'RETENÇÃO URINÁRIA AGUDA',
        desc: 'Globo vesical palpável pós-parto/raqui. Estimular micção espontânea ou sondagem de alívio estéril.'
      });
    }

    // SVD retirada pós 12h
    if (d.deliveryType?.includes('cesarea') && d.postpartumDay !== 'D0' && d.eliminations?.includes('svd_em_uso')) {
      alerts.push({
        severity: 'info',
        title: 'RETIRADA DE SVD (>12h PÓS-CESÁREA)',
        desc: 'Protocolo da enfermaria: Sentar a paciente e retirar a sonda vesical 12h após a cesariana.'
      });
    }

    // Pico Febril
    if (d.temperature === 'febril') {
      alerts.push({
        severity: 'high',
        title: 'PICO FEBRIL NO PUERPÉRIO',
        desc: 'Tax >= 37.8°C. Investigar sítio infeccioso (mamas, ferida operatória, trato urinário, cavidade uterina).'
      });
    }

    // Exames pendentes de alta
    if (d.labExams?.trSifilis === 'reagente') {
      alerts.push({
        severity: 'high',
        title: 'TR SÍFILIS REAGENTE',
        desc: 'Solicitar VDRL quantitativo e notificar. Iniciar tratamento com Penicilina conforme protocolo.',
        actionRequired: 'Solicitar VDRL + Prescrever Penicilina'
      });
    }
  }

  // --- GESTANTE ---
  else if (bed.type === 'gestante') {
    const d = bed.data;
    if (!d) return alerts;

    // Sintomas de Iminência de Eclâmpsia
    if (d.imminenceSigns?.length > 0) {
      alerts.push({
        severity: 'critical',
        title: 'SINAIS DE IMINÊNCIA DE ECLÂMPSIA',
        desc: `Paciente referindo: ${d.imminenceSigns.join(', ').toUpperCase()}. Risco iminente de convulsão! Notificar plantonista e avaliar sulfatação imediata.`,
        actionRequired: 'Avaliar Sulfatação Imediata'
      });
    }

    // Vitalidade Fetal
    const fhr = d.fhrValue || 140;
    if (fhr < 110 || fhr > 160 || d.fetalVitality === 'bcf_anormal') {
      alerts.push({
        severity: 'critical',
        title: 'VITALIDADE FETAL PREJUDICADA',
        desc: `BCF ${fhr} bpm (${fhr < 110 ? 'Bradicardia fetal sustentada' : 'Taquicardia fetal sustentada'}). Realizar CTG e DLE imediato.`,
        actionRequired: 'Decúbito Lateral Esquerdo + CTG Urgente'
      });
    }

    // Sangramento Vaginal
    if (d.vaginalLosses === 'sangramento') {
      alerts.push({
        severity: 'critical',
        title: 'SANGRAMENTO VAGINAL ATIVO',
        desc: 'Avaliar descolamento prematuro de placenta (DPP), placenta prévia ou dilatação cervical acelerada.'
      });
    }

    // Líquido Meconial
    if (d.vaginalLosses === 'liquido_meconial') {
      alerts.push({
        severity: 'high',
        title: 'LÍQUIDO AMNIÓTICO MECONIAL',
        desc: 'Sinal de sofrimento fetal intrauterino. Vigilância contínua da ausculta e avaliar resolução do parto.'
      });
    }

    // Maturação Pulmonar (Indicada entre 24 e 33 semanas e 6 dias)
    if (d.admissionReason?.includes('ameaca_tpp') && d.gestationalAge >= 24 && d.gestationalAge < 34) {
      alerts.push({
        severity: 'medium',
        title: 'MATURAÇÃO PULMONAR FETAL',
        desc: `Gestação de ${d.gestationalAge} sem em risco de TPP. Garantir Betametasona 12 mg IM (2 doses em 24h) e neuroproteção se < 32 sem.`
      });
    }

    // Gestação < 20 semanas (Pré-viabilidade / Ameaça de aborto)
    if (d.gestationalAge < 20) {
      if (d.admissionReason?.includes('ameaca_aborto') || d.admissionReason?.includes('sangramento_1tri') || d.vaginalLosses === 'sangramento') {
        alerts.push({
          severity: 'high',
          title: 'GESTAÇÃO < 20 SEMANAS (RISCO DE ABORTO)',
          desc: `Gestação inicial/pré-viável (${d.gestationalAge} sem). Repouso, antiespasmódico se cólicas e solicitar USG obstétrico/transvaginal para avaliar vitalidade embrionária/fetal e hematoma subcoriônico.`
        });
      }
    }
  }

  // --- CURETAGEM ---
  else if (bed.type === 'curetagem') {
    const d = bed.data;
    if (d?.bleeding === 'intenso') {
      alerts.push({
        severity: 'critical',
        title: 'HEMORRAGIA PÓS-CURETAGEM',
        desc: 'Sangramento vaginal intenso no forro. Avaliar perfuração uterina, restos ovulares ou atonia.'
      });
    }
  }

  return alerts;
};
