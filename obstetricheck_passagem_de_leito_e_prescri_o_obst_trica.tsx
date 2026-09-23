import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Baby,
  HeartPulse,
  Activity,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Copy,
  Printer,
  Trash2,
  RotateCcw,
  Sparkles,
  ClipboardList,
  FileText,
  Clock,
  Bed,
  Check,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Info,
  Calendar,
  Layers,
  Thermometer,
  Pill,
  Send
} from 'lucide-react';

const INITIAL_BEDS_COUNT = 10;

const createEmptyPuerpera = () => ({
  deliveryType: 'cesarea_eletiva', // 'vaginal', 'forceps', 'cesarea_eletiva', 'cesarea_urgencia'
  postpartumDay: 'D1', // 'D0', 'D1', 'D2', 'D3+'
  breasts: ['apojadura', 'pega_ok'], // 'flacidas', 'apojadura', 'ingurgitamento', 'fissura', 'pega_ok', 'pega_dificil'
  uterus: 'contraido', // 'contraido', 'hipotonico', 'subinvoluido', 'doloroso'
  lochia: 'fisiologico', // 'fisiologico', 'aumentado', 'coagulos', 'fetido'
  wound: 'curativo_limpo', // 'curativo_limpo', 'curativo_sangrante', 'perineo_integro', 'laceracao_suturada', 'hematoma_perineal'
  eliminations: ['diurese_espontanea', 'flatos_presentes', 'acesso_pervio'], // 'diurese_espontanea', 'retencao_globo', 'svd_em_uso', 'retirar_svd', 'flatos_presentes', 'constipacao', 'acesso_pervio', 'suspender_venoclise'
  painLevel: '1-3', // '0', '1-3', '4-6', '7-10'
  tevRisk: 'baixo', // 'baixo', 'alto'
  rhScreening: 'rh_pos', // 'rh_pos', 'rh_neg_rn_pos', 'nao_aplica'
  temperature: 'afebril', // 'afebril', 'febril'
  customNotes: ''
});

const createEmptyGestante = () => ({
  gestationalAge: 32, // 20 - 41
  admissionReason: ['ameaca_tpp'], // 'tp_latente', 'tp_ativo', 'ruprema', 'hipertensao', 'dmg', 'itu_pielonefrite', 'ameaca_tpp'
  bloodPressure: 'normal', // 'normal', 'elevada' (>=140/90)
  imminenceSigns: [], // 'cefaleia', 'escotomas', 'epigastralgia'
  fetalVitality: 'bcf_normal', // 'bcf_normal', 'bcf_anormal', 'mov_ativo'
  fhrValue: 142,
  dynamics: 'irregular', // 'ausente', 'irregular', 'ativo'
  vaginalLosses: 'ausente', // 'ausente', 'tampao', 'liquido_claro', 'liquido_meconial', 'sangramento'
  painLevel: '1-3', // '0', '1-3', '4-6', '7-10'
  customNotes: ''
});

const INITIAL_BEDS = [
  {
    id: 1,
    label: 'Leito 01',
    patientName: 'M.S.O. (28a)',
    type: 'puerpera',
    isReviewed: true,
    data: {
      ...createEmptyPuerpera(),
      deliveryType: 'cesarea_eletiva',
      postpartumDay: 'D1',
      uterus: 'contraido',
      wound: 'curativo_limpo',
      painLevel: '1-3'
    }
  },
  {
    id: 2,
    label: 'Leito 02',
    patientName: 'A.P.L. (34a)',
    type: 'puerpera',
    isReviewed: false,
    data: {
      ...createEmptyPuerpera(),
      deliveryType: 'vaginal',
      postpartumDay: 'D0',
      breasts: ['flacidas', 'pega_ok'],
      wound: 'laceracao_suturada',
      painLevel: '4-6',
      rhScreening: 'rh_neg_rn_pos' // precisa de Anti-D
    }
  },
  {
    id: 3,
    label: 'Leito 03',
    patientName: 'C.R.F. (22a)',
    type: 'gestante',
    isReviewed: true,
    data: {
      ...createEmptyGestante(),
      gestationalAge: 31,
      admissionReason: ['ameaca_tpp'],
      bloodPressure: 'normal',
      dynamics: 'irregular'
    }
  },
  {
    id: 4,
    label: 'Leito 04',
    patientName: 'G.M.T. (39a)',
    type: 'gestante',
    isReviewed: false,
    data: {
      ...createEmptyGestante(),
      gestationalAge: 35,
      admissionReason: ['hipertensao'],
      bloodPressure: 'elevada',
      imminenceSigns: ['cefaleia'], // Red flag!
      dynamics: 'ausente'
    }
  },
  {
    id: 5,
    label: 'Leito 05',
    patientName: 'Vago',
    type: 'vago',
    isReviewed: false,
    data: createEmptyPuerpera()
  },
  {
    id: 6,
    label: 'Leito 06',
    patientName: 'R.D.S. (25a)',
    type: 'puerpera',
    isReviewed: false,
    data: {
      ...createEmptyPuerpera(),
      deliveryType: 'cesarea_urgencia',
      postpartumDay: 'D0',
      uterus: 'hipotonico', // Red flag!
      lochia: 'aumentado',
      tevRisk: 'alto'
    }
  },
  {
    id: 7,
    label: 'Leito 07',
    patientName: 'J.A.C. (19a)',
    type: 'puerpera',
    isReviewed: true,
    data: {
      ...createEmptyPuerpera(),
      deliveryType: 'vaginal',
      postpartumDay: 'D2',
      breasts: ['apojadura', 'fissura', 'pega_dificil']
    }
  },
  {
    id: 8,
    label: 'Leito 08',
    patientName: 'F.B.N. (31a)',
    type: 'gestante',
    isReviewed: false,
    data: {
      ...createEmptyGestante(),
      gestationalAge: 38,
      admissionReason: ['ruprema'],
      vaginalLosses: 'liquido_claro'
    }
  },
  {
    id: 9,
    label: 'Leito 09',
    patientName: 'Vago',
    type: 'vago',
    isReviewed: false,
    data: createEmptyPuerpera()
  },
  {
    id: 10,
    label: 'Leito 10',
    patientName: 'Vago',
    type: 'vago',
    isReviewed: false,
    data: createEmptyPuerpera()
  }
];

const analyzeBedAlerts = (bed) => {
  const alerts = [];
  if (!bed || bed.type === 'vago') return alerts;

  if (bed.type === 'puerpera') {
    const d = bed.data;
    if (d.uterus === 'hipotonico') {
      alerts.push({
        severity: 'critical',
        title: 'ATONIA / HIPOTONIA UTERINA',
        desc: 'Risco iminente de Hemorragia Pós-Parto (HPP). Iniciar massagem bimanual, ocitocina rápida e considerar misoprostol/ergotrate.'
      });
    }
    if (d.lochia === 'fetido') {
      alerts.push({
        severity: 'high',
        title: 'SUSPEITA DE ENDOMETRITE',
        desc: 'Lóquios fétidos. Avaliar febre, dolorimento uterino e necessidade de Clindamicina + Gentamicina EV.'
      });
    }
    if (d.rhScreening === 'rh_neg_rn_pos') {
      alerts.push({
        severity: 'medium',
        title: 'PROFILAXIA ANTI-D PENDENTE',
        desc: 'Mãe Rh Negativo e RN Rh Positivo com Coombs Indireto negativo. Prescrever Imunoglobulina Anti-D 300 mcg IM em até 72h.'
      });
    }
    if (d.eliminations.includes('retencao_globo')) {
      alerts.push({
        severity: 'medium',
        title: 'RETENÇÃO URINÁRIA AGUDA',
        desc: 'Globo vesical palpável pós-parto/raqui. Estimular micção espontânea ou sondagem de alívio estéril.'
      });
    }
    if (d.temperature === 'febril') {
      alerts.push({
        severity: 'high',
        title: 'PICO FEBRIL NO PUERPÉRIO',
        desc: 'Investigar sítio infeccioso (mamas, ferida operatória, trato urinário, cavidade uterina).'
      });
    }
  } else if (bed.type === 'gestante') {
    const d = bed.data;
    if (d.bloodPressure === 'elevada' && d.imminenceSigns.length > 0) {
      alerts.push({
        severity: 'critical',
        title: 'IMINÊNCIA DE ECLÂMPSIA',
        desc: `PA >= 140/90 associada a sintomas (${d.imminenceSigns.join(', ')}). Iniciar imediatamente Sulfato de Magnésio (Esquema Zuspan)!`
      });
    } else if (d.bloodPressure === 'elevada') {
      alerts.push({
        severity: 'high',
        title: 'HIPERTENSÃO GESTACIONAL DESCOMPENSADA',
        desc: 'PA aferida >= 140/90 mmHg. Reavaliar anti-hipertensivo (Metildopa / Hidralazina) e monitorar proteinúria.'
      });
    }
    if (d.fetalVitality === 'bcf_anormal') {
      alerts.push({
        severity: 'critical',
        title: 'VITALIDADE FETAL PREJUDICADA',
        desc: 'Batimentos cardíacos fetais anormais (taquicardia > 160 bpm ou bradicardia < 110 bpm). Realizar CTG e DLE imediato.'
      });
    }
    if (d.vaginalLosses === 'sangramento') {
      alerts.push({
        severity: 'critical',
        title: 'SANGRAMENTO VAGINAL ATIVO',
        desc: 'Avaliar descolamento prematuro de placenta (DPP), placenta prévia ou dilatação cervical acelerada.'
      });
    }
    if (d.vaginalLosses === 'liquido_meconial') {
      alerts.push({
        severity: 'high',
        title: 'LÍQUIDO MECONIAL',
        desc: 'Sinal de estresse fetal intrauterino. Vigilância contínua da ausculta e avaliar termo de gestação.'
      });
    }
    if (d.admissionReason.includes('ameaca_tpp') && d.gestationalAge < 34) {
      alerts.push({
        severity: 'medium',
        title: 'MATURAÇÃO PULMONAR FETAL',
        desc: `Gestação prematura (${d.gestationalAge} sem). Garantir Betametasona 12 mg IM (2 doses em 24h) e neuroproteção se < 32 sem.`
      });
    }
  }

  return alerts;
};

const generatePrescriptionText = (bed) => {
  if (!bed || bed.type === 'vago') {
    return 'Leito vago no momento. Selecione o tipo de paciente acima para iniciar o plano terapêutico.';
  }

  const lines = [];
  const today = new Date().toLocaleDateString('pt-BR');
  lines.push(`HOSPITAL MATERNIDADE - PRESCRIÇÃO MÉDICA OBSTÉTRICA`);
  lines.push(`LEITO: ${bed.label} | PACIENTE: ${bed.patientName || 'Não identificada'} | DATA: ${today}`);
  lines.push(`--------------------------------------------------------------------------------`);

  if (bed.type === 'puerpera') {
    const d = bed.data;
    const isCesarea = d.deliveryType.includes('cesarea');

    // 1. DIETA
    lines.push(`1. DIETA:`);
    if (d.deliveryType === 'cesarea_urgencia' && d.postpartumDay === 'D0') {
      lines.push(`   - Dieta líquida restrita/branda após recuperação anestésica plena.`);
    } else {
      lines.push(`   - Dieta geral obstétrica hiperproteica com incentivo à ingesta hídrica livre (mínimo 2,5 L/dia).`);
    }

    // 2. HIDRATAÇÃO / VENÓCLISE
    lines.push(`\n2. HIDRATAÇÃO VENOSA & ACESSOS:`);
    if (d.eliminations.includes('suspender_venoclise')) {
      lines.push(`   - Suspender venóclise contínua; manter apenas salinizado para analgesia.`);
    } else if (d.postpartumDay === 'D0') {
      lines.push(`   - Soro Ringer Lactato ou SF 0,9% 1000ml EV em 12h (conforme balanço anestésico).`);
    } else {
      lines.push(`   - Manter acesso venoso periférico salinizado pérvio.`);
    }

    // 3. ANALGESIA BASAL
    lines.push(`\n3. ANALGESIA & ANTI-INFLAMATÓRIO:`);
    lines.push(`   - Dipirona 1g EV ou VO a cada 6 horas (Horário regular se dor persistente).`);
    if (isCesarea || d.wound === 'laceracao_suturada') {
      lines.push(`   - Cetoprofeno 100mg EV de 12/12h (manter por até 48h) OU Ibuprofeno 600mg VO 8/8h após refeições.`);
    }

    // 4. ANALGESIA DE RESGATE
    if (d.painLevel === '4-6' || d.painLevel === '7-10') {
      lines.push(`\n4. ANALGESIA DE RESGATE (SE DOR MODERADA/FORTE):`);
      lines.push(`   - Tramadol 50mg a 100mg EV diluído em 100ml SF 0,9% infundir em 30 min (se EVA > 5, máx 8/8h).`);
    }

    // 5. GASTRO & SINTOMÁTICOS
    lines.push(`\n5. SINTOMÁTICOS GASTROINTESTINAIS:`);
    lines.push(`   - Ondansetrona 4mg a 8mg EV de 8 em 8 horas se náuseas ou êmese.`);
    if (d.eliminations.includes('flatos_presentes') || isCesarea) {
      lines.push(`   - Simeticona 40 gotas VO de 8 em 8 horas se queixas de gases ou distensão.`);
    }

    // 6. TERAPÊUTICA ESPECÍFICA & PROFILAXIA
    lines.push(`\n6. PROFILAXIAS & TERAPÊUTICA ESPECÍFICA:`);
    if (d.tevRisk === 'alto') {
      lines.push(`   - [ALTO RISCO TEV] Enoxaparina 40mg SC 1x ao dia (iniciar 12h após retirada do bloqueio raquidiano).`);
    } else {
      lines.push(`   - Profilaxia mecânica de TEV: Estimular deambulação precoce.`);
    }

    if (d.rhScreening === 'rh_neg_rn_pos') {
      lines.push(`   - [IMUNOBIOLÓGICO] Imunoglobulina Humana Anti-D 300 mcg (1500 UI) IM em dose única.`);
    }

    if (d.uterus === 'hipotonico') {
      lines.push(`   - [ATENÇÃO ATONIA] Ocitocina 20 UI em 500ml SF 0,9% EV em infusão rápida contínua + Manobra bimanual.`);
      lines.push(`   - Se refratário: Misoprostol 800 mcg via retal ou Metilergometrina 0,2mg IM (se normotensa).`);
    }

    if (d.lochia === 'fetido' || d.temperature === 'febril') {
      lines.push(`   - [SUSPEITA INFECCIOSA] Clindamicina 900mg EV 8/8h + Gentamicina 5mg/kg/dia EV 1x/dia (a critério médico).`);
    }

    // 7. HEMATÍNICOS
    lines.push(`\n7. HEMATÍNICOS (SUPLEMENTAÇÃO PUERPERAL):`);
    lines.push(`   - Sulfato Ferroso 200mg (40mg ferro elementar) VO 1x ao dia em jejum.`);
    lines.push(`   - Ácido Fólico 5mg VO 1x ao dia.`);

    // 8. CUIDADOS DE ENFERMAGEM
    lines.push(`\n8. CUIDADOS DE ENFERMAGEM:`);
    lines.push(`   - Controle de SSVV (PA, FC, Temp, FR, Escala de Dor) a cada 6 horas.`);
    lines.push(`   - Avaliação rigorosa da contração uterina (Globo de Pinard) e volume dos lóquios.`);
    if (d.eliminations.includes('retirar_svd')) {
      lines.push(`   - RETIRAR Sonda Vesical de Demora (SVD) e estimular primeira micção espontânea em até 4 a 6 horas.`);
    }
    if (isCesarea) {
      lines.push(`   - Curativo da Ferida Operatória: Lavar com água e sabonete suave no banho, secar bem e manter aberto.`);
    } else {
      lines.push(`   - Higiene perineal com água corrente morninha após cada micção/evacuação.`);
    }
    lines.push(`   - Apoio integral e incentivo ao Aleitamento Materno Exclusivo em livre demanda.`);
    if (d.breasts.includes('ingurgitamento') || d.breasts.includes('pega_dificil')) {
      lines.push(`   - Auxiliar e orientar técnica correta de pega/ordenha manual de alívio da aréola antes das mamadas.`);
    }

  } else if (bed.type === 'gestante') {
    const d = bed.data;

    // 1. DIETA
    lines.push(`1. DIETA:`);
    if (d.admissionReason.includes('dmg')) {
      lines.push(`   - Dieta balanceada fracionada para Diabetes Mellitus Gestacional (DMG), 6 refeições/dia.`);
    } else if (d.bloodPressure === 'elevada') {
      lines.push(`   - Dieta hipossódica para hipertensão gestacional.`);
    } else {
      lines.push(`   - Dieta branda para gestante.`);
    }

    // 2. REPOUSO & POSICIONAMENTO
    lines.push(`\n2. CUIDADOS POSTURAIS:`);
    lines.push(`   - Repouso no leito com orientação para Decúbito Lateral Esquerdo (DLE) prioritário.`);

    // 3. MEDICAÇÕES ESPECÍFICAS
    lines.push(`\n3. TERAPÊUTICA FARMACOLÓGICA:`);
    if (d.bloodPressure === 'elevada') {
      lines.push(`   - Metildopa 500mg VO de 8 em 8 horas (Ajustar dose conforme mapa pressórico até 2g/dia).`);
      if (d.imminenceSigns.length > 0) {
        lines.push(`   - [EMERGÊNCIA OBSTÉTRICA - PROTOCOLO ZUSPAN]:`);
        lines.push(`     * Ataque: Sulfato de Magnésio 50% 4g (8ml) + 12ml SG 5% EV lento em 15 a 20 minutos.`);
        lines.push(`     * Manutenção: Sulfato de Magnésio 1g/hora a 2g/hora em BIC contínua por 24 horas.`);
        lines.push(`     * Ter à beira do leito: Gluconato de Cálcio 10% 1 ampola (antídoto).`);
        lines.push(`     * Se PAS >= 160 ou PAD >= 110: Hidralazina 5mg EV lento em bolus (repetir a cada 20 min SN).`);
      }
    }

    if (d.admissionReason.includes('ameaca_tpp') && d.gestationalAge < 34) {
      lines.push(`   - [MATURAÇÃO PULMONAR] Betametasona 12mg IM profunda (dose 1 de 2, repetir em 24h).`);
      if (d.dynamics === 'ativo' || d.dynamics === 'irregular') {
        lines.push(`   - [TOCOLÍSE] Nifedipino 20mg VO ataque, seguido de 10mg a 20mg a cada 6-8h por até 48h.`);
      }
      if (d.gestationalAge < 32) {
        lines.push(`   - [NEUROPROTEÇÃO FETAL] Sulfato de Magnésio 4g EV ataque + 1g/h se parto iminente.`);
      }
    }

    if (d.admissionReason.includes('ruprema')) {
      if (d.gestationalAge < 34) {
        lines.push(`   - [LATÊNCIA RUPREMA] Ampicilina 2g EV 6/6h por 48h + Azitromicina 1g VO dose única; após, Amoxicilina 500mg 8/8h.`);
      } else {
        lines.push(`   - Gestação a termo com RUPREMA: Avaliar indução do parto com Ocitocina ou Misoprostol (Bishop).`);
      }
    }

    if (d.admissionReason.includes('itu_pielonefrite')) {
      lines.push(`   - Ceftriaxona 1g EV 1x ao dia OU Cefazolina 1g EV de 8/8h + Hidratação venosa vigorosa.`);
    }

    // 4. SINTOMÁTICOS
    lines.push(`\n4. SINTOMÁTICOS & ANALGESIA:`);
    lines.push(`   - Dipirona 1g EV ou VO a cada 6h se cefaleia leve ou dor em baixo ventre.`);
    lines.push(`   - Metoclopramida 10mg EV 8/8h se náuseas.`);

    // 5. CUIDADOS DE ENFERMAGEM
    lines.push(`\n5. VIGILÂNCIA OBSTÉTRICA & ENFERMAGEM:`);
    lines.push(`   - Ausculta intermitente de BCF com detector Doppler a cada 4 horas (valor normal: 110-160 bpm).`);
    lines.push(`   - Aferir PA de 4/4 horas (ou 1/1h se síndrome hipertensiva / uso de Sulfato).`);
    lines.push(`   - Monitorar dinâmica uterina (número de contrações em 10 minutos) e perdas vaginais.`);
    lines.push(`   - Vigilância de sintomas de pré-eclâmpsia: Cefaleia, escotomas cintilantes, dor epigástrica em barra.`);
    lines.push(`   - Cardiotocografia (CTG) basal diária.`);
  }

  lines.push(`--------------------------------------------------------------------------------`);
  lines.push(`Médico(a) / Enfermeiro(a) Responsável: _______________________________ CRM/COREN: _________`);
  return lines.join('\n');
};

const generateSoapEvolutionText = (bed) => {
  if (!bed || bed.type === 'vago') {
    return 'Leito vago. Sem evolução a ser gerada.';
  }

  const today = new Date().toLocaleDateString('pt-BR');
  const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const lines = [];

  lines.push(`EVOLUÇÃO CLÍNICA OBSTÉTRICA - ${today} às ${now}`);
  lines.push(`LEITO: ${bed.label} | IDENTIFICAÇÃO: ${bed.patientName}`);
  lines.push(`--------------------------------------------------------------------------------`);

  if (bed.type === 'puerpera') {
    const d = bed.data;
    const deliveryLabel = {
      vaginal: 'Parto Normal Eutócico',
      forceps: 'Parto Instrumentalizado (Fórceps)',
      cesarea_eletiva: 'Cesárea Eletiva',
      cesarea_urgencia: 'Cesárea de Urgência'
    }[d.deliveryType] || d.deliveryType;

    // S - Subjetivo
    lines.push(`[S] SUBJETIVO:`);
    const sDetails = [];
    sDetails.push(`Puérpera em ${d.postpartumDay} de ${deliveryLabel}.`);
    if (d.painLevel === '0') sDetails.push('Nega queixas álgicas no momento.');
    else sDetails.push(`Refere dor nível ${d.painLevel}/10 em sítio cirúrgico/períneo.`);

    if (d.eliminations.includes('diurese_espontanea')) sDetails.push('Diurese espontânea presente, clara e sem disúria.');
    if (d.eliminations.includes('retencao_globo')) sDetails.push('Refere dificuldade miccional e sensação de bexigoma.');
    if (d.eliminations.includes('flatos_presentes')) sDetails.push('Flatos eliminados, sem queixas de náuseas.');
    if (d.breasts.includes('pega_ok')) sDetails.push('Amamentando sob livre demanda com boa aceitação pelo RN.');
    if (d.breasts.includes('fissura')) sDetails.push('Refere desconforto e dor mamilar ao amamentar.');
    lines.push(`   ${sDetails.join(' ')}`);

    // O - Objetivo
    lines.push(`\n[O] OBJETIVO:`);
    const oDetails = [];
    oDetails.push(`BEG, LOTE, corada, hidratada, anictérica, ${d.temperature === 'febril' ? 'FEBRIL no plantão' : 'afebril'}.`);
    
    // Mamas
    const breastMap = {
      flacidas: 'flácidas',
      apojadura: 'com apojadura fisiológica',
      ingurgitamento: 'ingurgitadas e hipertensas',
      fissura: 'com fissuras mamilares visíveis'
    };
    const breastStatus = d.breasts.map(b => breastMap[b]).filter(Boolean).join(', ');
    oDetails.push(`Mamas ${breastStatus || 'normais'}.`);

    // Abdome / Útero
    const uterusMap = {
      contraido: 'útero contraído no nível da cicatriz umbilical (Globo de Pinard presente e firme)',
      hipotonico: 'útero hipo/atônico, amolecido acima da cicatriz umbilical',
      subinvoluido: 'útero subinvoluído',
      doloroso: 'útero palpável e doloroso à palpação profunda'
    };
    oDetails.push(`Abdome: ${uterusMap[d.uterus] || 'flácido'}.`);

    // Ferida / Períneo
    const woundMap = {
      curativo_limpo: 'FO com curativo limpo e seco, sem sangramentos.',
      curativo_sangrante: 'FO com sangramento/exsudato visível em curativo.',
      perineo_integro: 'Períneo íntegro, sem edema ou equimose.',
      laceracao_suturada: 'Períneo suturado, sem hematoma ou deiscência.',
      hematoma_perineal: 'Períneo com hematoma volumoso/edema acentuado.'
    };
    oDetails.push(woundMap[d.wound] || '');

    // Lóquios
    const lochiaMap = {
      fisiologico: 'Lóquios fisiológicos (rubros em moderada quantidade, odor característico).',
      aumentado: 'Lóquios aumentados em quantidade anormal.',
      coagulos: 'Eliminação de coágulos volumosos.',
      fetido: 'Lóquios fétidos purulentos.'
    };
    oDetails.push(lochiaMap[d.lochia] || '');
    lines.push(`   ${oDetails.join(' ')}`);

    // A - Avaliação
    lines.push(`\n[A] AVALIAÇÃO:`);
    lines.push(`   - Puerpério imediato (${d.postpartumDay}) pós-${deliveryLabel}.`);
    if (d.uterus === 'hipotonico') lines.push(`   - ALERTA CLÍNICO: Atonia uterina em manejo.`);
    if (d.lochia === 'fetido') lines.push(`   - Investigação de infecção puerperal / endometrite.`);
    if (d.rhScreening === 'rh_neg_rn_pos') lines.push(`   - Mãe Rh(-) com concepto Rh(+): Indicação de imunoprofilaxia Anti-D.`);
    if (d.tevRisk === 'alto') lines.push(`   - Alto risco de tromboembolismo venoso (TEV).`);

    // P - Plano
    lines.push(`\n[P] PLANO:`);
    lines.push(`   1. Manter analgesia escalonada e vigilância de sangramento vaginal;`);
    lines.push(`   2. Estimular deambulação precoce e ingesta de líquidos;`);
    if (d.eliminations.includes('retirar_svd')) lines.push(`   3. Retirar SVD e atentar para micção espontânea;`);
    if (d.rhScreening === 'rh_neg_rn_pos') lines.push(`   4. Administrar Imunoglobulina Anti-D 300mcg IM em até 72h;`);
    lines.push(`   5. Orientações sobre pega e amamentação em livre demanda;`);
    lines.push(`   6. Estimativa de alta hospitalar em 48h (cesárea) ou 24h (parto normal) se estabilidade.`);

  } else if (bed.type === 'gestante') {
    const d = bed.data;

    // S - Subjetivo
    lines.push(`[S] SUBJETIVO:`);
    lines.push(`   Gestante com IG de ${d.gestationalAge} semanas, internada por ${d.admissionReason.join(', ')}.`);
    lines.push(`   ${d.imminenceSigns.length > 0 ? `Queixa-se de ${d.imminenceSigns.join(' e ')}.` : 'Nega cefaleia, alterações visuais ou dor epigástrica.'}`);
    lines.push(`   Refere ${d.fetalVitality === 'mov_ativo' || d.fetalVitality === 'bcf_normal' ? 'movimentação fetal preservada' : 'redução de movimentação fetal'}.`);

    // O - Objetivo
    lines.push(`\n[O] OBJETIVO:`);
    lines.push(`   - PA: ${d.bloodPressure === 'elevada' ? '>= 140/90 mmHg (ELEVADA)' : '< 140/90 mmHg (Normotensa)'};`);
    lines.push(`   - Ausculta Fetal: BCF ${d.fhrValue || 140} bpm (${d.fetalVitality === 'bcf_normal' ? 'Rítmico e regular' : 'ANORMAL / TAQUI OU BRADICARDIA'});`);
    lines.push(`   - Dinâmica Uterina: ${d.dynamics === 'ativo' ? 'Trabalho de parto ativo (3-4 contr/10 min)' : d.dynamics === 'irregular' ? 'Irregular/incoordenada' : 'Ausente'};`);
    lines.push(`   - Exame Especular / Perdas: ${d.vaginalLosses === 'liquido_claro' ? 'Líquido amniótico claro com grumos' : d.vaginalLosses === 'sangramento' ? 'SANGRAMENTO VIVO ATIVO' : d.vaginalLosses === 'liquido_meconial' ? 'Líquido com mecônio espesso' : 'Sem perdas vaginais anormais'}.`);

    // A - Avaliação
    lines.push(`\n[A] AVALIAÇÃO:`);
    lines.push(`   - Gestação tópica de ${d.gestationalAge} semanas com ${d.admissionReason.join(' + ')}.`);
    if (d.bloodPressure === 'elevada' && d.imminenceSigns.length > 0) {
      lines.push(`   - ALERTA CRÍTICO: Pré-eclâmpsia com sinais de iminência de eclâmpsia.`);
    }

    // P - Plano
    lines.push(`\n[P] PLANO:`);
    lines.push(`   1. Monitoramento intensivo de PA e BCF;`);
    if (d.admissionReason.includes('ameaca_tpp') && d.gestationalAge < 34) {
      lines.push(`   2. Corticoterapia com Betametasona para maturação pulmonar + Tocolítico;`);
    }
    if (d.bloodPressure === 'elevada' && d.imminenceSigns.length > 0) {
      lines.push(`   3. Iniciar Protocolo de Sulfato de Magnésio (Zuspan) + Anti-hipertensivo EV de resgate;`);
    }
    lines.push(`   4. CTG periódica e exames laboratoriais obstétricos complementares.`);
  }

  lines.push(`--------------------------------------------------------------------------------`);
  return lines.join('\n');
};

export default function App() {
  const [beds, setBeds] = useState(() => {
    try {
      const saved = localStorage.getItem('obstetricheck_beds');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao ler localStorage', e);
    }
    return INITIAL_BEDS;
  });

  const [activeBedId, setActiveBedId] = useState(1);
  const [activeTab, setActiveTab] = useState('checklist'); // 'checklist', 'prescription', 'soap', 'shift_summary'
  const [toastMessage, setToastMessage] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'puerpera', 'gestante', 'alerts'
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('obstetricheck_beds', JSON.stringify(beds));
    } catch (e) {
      console.error('Erro ao salvar no localStorage', e);
    }
  }, [beds]);

  const activeBed = useMemo(() => {
    return beds.find((b) => b.id === activeBedId) || beds[0];
  }, [beds, activeBedId]);

  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const copyToClipboard = (text, type = 'Texto') => {
    if (!navigator?.clipboard) {
      showToast('Área de transferência indisponível');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${type} copiado com sucesso!`);
    }).catch(() => {
      showToast('Erro ao copiar.');
    });
  };

  const updateActiveBedData = (updater) => {
    setBeds((prevBeds) =>
      prevBeds.map((bed) => {
        if (bed.id !== activeBedId) return bed;
        const currentData = bed.data || {};
        const updatedData = typeof updater === 'function' ? updater(currentData) : { ...currentData, ...updater };
        return {
          ...bed,
          data: updatedData
        };
      })
    );
  };

  const setBedType = (type) => {
    setBeds((prev) =>
      prev.map((b) => {
        if (b.id !== activeBedId) return b;
        let newData = b.data;
        if (type === 'puerpera' && b.type !== 'puerpera') newData = createEmptyPuerpera();
        if (type === 'gestante' && b.type !== 'gestante') newData = createEmptyGestante();
        return {
          ...b,
          type,
          data: newData,
          patientName: type === 'vago' ? 'Vago' : (b.patientName === 'Vago' ? 'Paciente ' + b.label : b.patientName)
        };
      })
    );
  };

  const toggleReviewed = (bedId) => {
    setBeds((prev) =>
      prev.map((b) => {
        if (b.id !== bedId) return b;
        const newStatus = !b.isReviewed;
        showToast(newStatus ? `${b.label} marcado como REVISADO` : `${b.label} marcado como PENDENTE`);
        return { ...b, isReviewed: newStatus };
      })
    );
  };

  const clearBed = (bedId) => {
    setBeds((prev) =>
      prev.map((b) => {
        if (b.id !== bedId) return b;
        return {
          ...b,
          type: 'vago',
          patientName: 'Vago',
          isReviewed: false,
          data: createEmptyPuerpera()
        };
      })
    );
    showToast(`Leito ${activeBed.label} resetado / Alta registrada.`);
  };

  const resetAllBeds = () => {
    setBeds(INITIAL_BEDS);
    showToast('Todos os leitos foram restaurados para o padrão.');
  };

  const toggleArrayItem = (key, value) => {
    updateActiveBedData((prev) => {
      const arr = prev[key] || [];
      const exists = arr.includes(value);
      const nextArr = exists ? arr.filter((x) => x !== value) : [...arr, value];
      return { ...prev, [key]: nextArr };
    });
  };

  const stats = useMemo(() => {
    let puerperas = 0;
    let gestantes = 0;
    let vagos = 0;
    let reviewed = 0;
    let alertCount = 0;

    beds.forEach((bed) => {
      if (bed.type === 'puerpera') puerperas++;
      else if (bed.type === 'gestante') gestantes++;
      else vagos++;

      if (bed.isReviewed) reviewed++;
      const alerts = analyzeBedAlerts(bed);
      if (alerts.length > 0) alertCount++;
    });

    return { puerperas, gestantes, vagos, reviewed, alertCount, total: beds.length };
  }, [beds]);

  const activeAlerts = useMemo(() => analyzeBedAlerts(activeBed), [activeBed]);
  const prescriptionText = useMemo(() => generatePrescriptionText(activeBed), [activeBed]);
  const soapText = useMemo(() => generateSoapEvolutionText(activeBed), [activeBed]);

  const filteredBeds = useMemo(() => {
    return beds.filter((b) => {
      if (filterType === 'puerpera' && b.type !== 'puerpera') return false;
      if (filterType === 'gestante' && b.type !== 'gestante') return false;
      if (filterType === 'alerts') {
        const al = analyzeBedAlerts(b);
        if (al.length === 0) return false;
      }
      if (searchFilter.trim()) {
        const term = searchFilter.toLowerCase();
        return (
          b.label.toLowerCase().includes(term) ||
          b.patientName?.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [beds, filterType, searchFilter]);

  const Chip = ({ active, onClick, label, icon: Icon, badge, color = 'emerald' }) => {
    const colorClasses = {
      emerald: active
        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200'
        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50',
      purple: active
        ? 'bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-200'
        : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/50',
      sky: active
        ? 'bg-sky-600 text-white border-sky-600 shadow-sm ring-2 ring-sky-200'
        : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:bg-sky-50/50',
      amber: active
        ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-200'
        : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50',
      rose: active
        ? 'bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-200'
        : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300 hover:bg-rose-50/50'
    };

    return (
      <button
        type="button"
        onClick={onClick}
        className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 active:scale-95 text-left cursor-pointer ${colorClasses[color] || colorClasses.emerald}`}
      >
        {Icon && <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-400'}`} />}
        <span>{label}</span>
        {badge && (
          <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  const SectionCard = ({ title, icon: Icon, color = 'text-emerald-700', bg = 'bg-emerald-50', children, badge }) => (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs mb-3 transition-all hover:border-slate-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm tracking-tight">{title}</h3>
        </div>
        {badge && (
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 text-sm flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Main Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-xs">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 text-base tracking-tight">ObstetriCheck</h1>
                <span className="hidden sm:inline-block bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-200">
                  Passagem de Leito & Prescrição
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Enfermaria Obstétrica e Maternidade de Baixa/Média Complexidade
              </p>
            </div>
          </div>

          {/* Quick Handover Statistics Badges */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-3 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Puérperas: <strong className="text-slate-800">{stats.puerperas}</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                Gestantes: <strong className="text-slate-800">{stats.gestantes}</strong>
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Revisados: <strong className="text-slate-800">{stats.reviewed}/{stats.total}</strong>
              </span>
              {stats.alertCount > 0 && (
                <span className="flex items-center gap-1 bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md font-bold">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  {stats.alertCount} Alertas
                </span>
              )}
            </div>

            <button
              onClick={() => setActiveTab('shift_summary')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                activeTab === 'shift_summary'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Resumo Plantão</span>
              <span className="sm:hidden">Plantão</span>
            </button>

            <button
              onClick={() => window.print()}
              title="Imprimir relatório"
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-all text-xs"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {}
        <div className="bg-slate-50 border-t border-slate-200/80 px-3 sm:px-6 py-2 overflow-x-auto scrollbar-none flex items-center gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Leitos:</span>
          </div>
          {beds.map((bed) => {
            const isSelected = bed.id === activeBedId;
            const bedAlerts = analyzeBedAlerts(bed);
            const hasAlerts = bedAlerts.length > 0;

            let badgeColor = 'bg-slate-200 text-slate-600';
            let dotColor = 'bg-slate-400';
            if (bed.type === 'puerpera') {
              badgeColor = 'bg-purple-100 text-purple-700 border-purple-200';
              dotColor = 'bg-purple-500';
            } else if (bed.type === 'gestante') {
              badgeColor = 'bg-sky-100 text-sky-700 border-sky-200';
              dotColor = 'bg-sky-500';
            }

            return (
              <button
                key={bed.id}
                onClick={() => {
                  setActiveBedId(bed.id);
                  if (activeTab === 'shift_summary') setActiveTab('checklist');
                }}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all ${
                  isSelected
                    ? 'bg-white border-slate-900 shadow-sm text-slate-900 ring-2 ring-slate-900/10'
                    : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                  <span className="font-semibold">{bed.label}</span>
                </div>

                {bed.type !== 'vago' && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-medium border ${badgeColor}`}>
                    {bed.type === 'puerpera' ? 'P' : 'G'}
                  </span>
                )}

                {bed.isReviewed && (
                  <Check className="w-3.5 h-3.5 text-emerald-600" title="Revisado" />
                )}

                {hasAlerts && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Alerta clínico"></span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {}
      {activeTab !== 'shift_summary' && (
        <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                  {activeBed.label.replace('Leito ', '')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={activeBed.patientName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBeds((prev) =>
                          prev.map((b) => (b.id === activeBedId ? { ...b, patientName: val } : b))
                        );
                      }}
                      placeholder="Nome / Iniciais da Paciente"
                      className="text-sm font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:outline-none transition-all"
                    />
                    <span className="text-xs text-slate-400">({activeBed.label})</span>
                  </div>

                  {/* Bed Type Switcher */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <button
                      onClick={() => setBedType('puerpera')}
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold transition-all border ${
                        activeBed.type === 'puerpera'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      Puérpera (Pós-Parto)
                    </button>
                    <button
                      onClick={() => setBedType('gestante')}
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold transition-all border ${
                        activeBed.type === 'gestante'
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                      }`}
                    >
                      Gestante (Pré-Parto)
                    </button>
                    <button
                      onClick={() => setBedType('vago')}
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold transition-all border ${
                        activeBed.type === 'vago'
                          ? 'bg-slate-700 text-white border-slate-700'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      Leito Vago
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bed Actions (Reviewed, Clear/Discharge) */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => toggleReviewed(activeBed.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  activeBed.isReviewed
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${activeBed.isReviewed ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{activeBed.isReviewed ? 'Revisado no Plantão' : 'Marcar Revisado'}</span>
              </button>

              <button
                onClick={() => clearBed(activeBed.id)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all flex items-center gap-1"
                title="Registrar alta ou esvaziar leito"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Alta / Limpar</span>
              </button>
            </div>
          </div>

          {/* Sub Tab Switcher: Checklist vs Prescrição vs SOAP */}
          <div className="max-w-7xl mx-auto flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'checklist'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>1. Checklist da Passagem</span>
            </button>

            <button
              onClick={() => setActiveTab('prescription')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'prescription'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Pill className="w-3.5 h-3.5" />
              <span>2. Prescrição Médica</span>
            </button>

            <button
              onClick={() => setActiveTab('soap')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'soap'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>3. Evolução SOAP</span>
            </button>

            {activeAlerts.length > 0 && (
              <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                {activeAlerts.length} Alerta{activeAlerts.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {}
      {activeAlerts.length > 0 && activeTab !== 'shift_summary' && (
        <div className="bg-rose-50 border-b border-rose-200 px-3 sm:px-6 py-2.5">
          <div className="max-w-7xl mx-auto space-y-1.5">
            {activeAlerts.map((alt, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-rose-900 bg-white/80 p-2 rounded-xl border border-rose-200 shadow-2xs">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-rose-700">{alt.title}:</strong> {alt.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 flex-1 w-full">
        {/* VIEW 1: CHECKLIST TAB */}
        {activeTab === 'checklist' && (
          <div>
            {activeBed.type === 'vago' ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto my-8 shadow-xs">
                <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bed className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-800 text-base mb-1">Leito Vago / Desocupado</h3>
                <p className="text-xs text-slate-500 mb-6">
                  Para iniciar a passagem de leito deste leito, selecione o perfil clínico da paciente internada:
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={() => setBedType('puerpera')}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Baby className="w-4 h-4" />
                    <span>Admitir Puérpera (Pós-Parto)</span>
                  </button>
                  <button
                    onClick={() => setBedType('gestante')}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <HeartPulse className="w-4 h-4" />
                    <span>Admitir Gestante (Pré-Parto)</span>
                  </button>
                </div>
              </div>
            ) : activeBed.type === 'puerpera' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Form Column */}
                <div className="lg:col-span-8 space-y-3">
                  {/* 1. Parto & Tempo */}
                  <SectionCard title="Parto e Cronologia Puerperal" icon={Baby} color="text-purple-700" bg="bg-purple-100">
                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Tipo de Parto Realizado:
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          <Chip
                            color="purple"
                            active={activeBed.data.deliveryType === 'vaginal'}
                            onClick={() => updateActiveBedData({ deliveryType: 'vaginal' })}
                            label="Parto Normal Eutócico"
                          />
                          <Chip
                            color="purple"
                            active={activeBed.data.deliveryType === 'forceps'}
                            onClick={() => updateActiveBedData({ deliveryType: 'forceps' })}
                            label="Fórceps / Instrumental"
                          />
                          <Chip
                            color="purple"
                            active={activeBed.data.deliveryType === 'cesarea_eletiva'}
                            onClick={() => updateActiveBedData({ deliveryType: 'cesarea_eletiva' })}
                            label="Cesárea Eletiva"
                          />
                          <Chip
                            color="purple"
                            active={activeBed.data.deliveryType === 'cesarea_urgencia'}
                            onClick={() => updateActiveBedData({ deliveryType: 'cesarea_urgencia' })}
                            label="Cesárea de Urgência"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Dia Pós-Parto:
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {['D0', 'D1', 'D2', 'D3+'].map((day) => (
                            <Chip
                              key={day}
                              color="purple"
                              active={activeBed.data.postpartumDay === day}
                              onClick={() => updateActiveBedData({ postpartumDay: day })}
                              label={day === 'D0' ? 'D0 (Imediato)' : day}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  {/* 2. Mamas e Lactação */}
                  <SectionCard title="Mamas e Lactação" icon={HeartPulse} color="text-rose-700" bg="bg-rose-100">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Status da Mama e Amamentação:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <Chip
                        color="rose"
                        active={activeBed.data.breasts.includes('flacidas')}
                        onClick={() => toggleArrayItem('breasts', 'flacidas')}
                        label="Mamas Flácidas / Colostro"
                      />
                      <Chip
                        color="rose"
                        active={activeBed.data.breasts.includes('apojadura')}
                        onClick={() => toggleArrayItem('breasts', 'apojadura')}
                        label="Apojadura Fisiológica"
                      />
                      <Chip
                        color="rose"
                        active={activeBed.data.breasts.includes('ingurgitamento')}
                        onClick={() => toggleArrayItem('breasts', 'ingurgitamento')}
                        label="Ingurgitamento Doloroso"
                        badge="Alívio"
                      />
                      <Chip
                        color="rose"
                        active={activeBed.data.breasts.includes('fissura')}
                        onClick={() => toggleArrayItem('breasts', 'fissura')}
                        label="Fissura Mamilar"
                      />
                      <Chip
                        color="rose"
                        active={activeBed.data.breasts.includes('pega_ok')}
                        onClick={() => toggleArrayItem('breasts', 'pega_ok')}
                        label="Pega Adequada"
                      />
                      <Chip
                        color="rose"
                        active={activeBed.data.breasts.includes('pega_dificil')}
                        onClick={() => toggleArrayItem('breasts', 'pega_dificil')}
                        label="Dificuldade de Pega"
                      />
                    </div>
                  </SectionCard>

                  {/* 3. Útero e Involução */}
                  <SectionCard title="Útero & Involução (Globo de Pinard)" icon={Activity} color="text-amber-700" bg="bg-amber-100">
                    <div className="flex flex-wrap gap-1.5">
                      <Chip
                        color="amber"
                        active={activeBed.data.uterus === 'contraido'}
                        onClick={() => updateActiveBedData({ uterus: 'contraido' })}
                        label="Contraído Firme (Nível Umbilical)"
                      />
                      <Chip
                        color="amber"
                        active={activeBed.data.uterus === 'hipotonico'}
                        onClick={() => updateActiveBedData({ uterus: 'hipotonico' })}
                        label="Hipotônico / Atonia"
                        badge="URGENTE"
                      />
                      <Chip
                        color="amber"
                        active={activeBed.data.uterus === 'subinvoluido'}
                        onClick={() => updateActiveBedData({ uterus: 'subinvoluido' })}
                        label="Subinvoluído"
                      />
                      <Chip
                        color="amber"
                        active={activeBed.data.uterus === 'doloroso'}
                        onClick={() => updateActiveBedData({ uterus: 'doloroso' })}
                        label="Doloroso à Palpação"
                      />
                    </div>
                  </SectionCard>

                  {/* 4. Lóquios */}
                  <SectionCard title="Lóquios Puerperais" icon={Sparkles} color="text-indigo-700" bg="bg-indigo-100">
                    <div className="flex flex-wrap gap-1.5">
                      <Chip
                        color="purple"
                        active={activeBed.data.lochia === 'fisiologico'}
                        onClick={() => updateActiveBedData({ lochia: 'fisiologico' })}
                        label="Fisiológicos (Rubros Moderados)"
                      />
                      <Chip
                        color="purple"
                        active={activeBed.data.lochia === 'aumentado'}
                        onClick={() => updateActiveBedData({ lochia: 'aumentado' })}
                        label="Hemorragia / Lóquios Aumentados"
                        badge="Alerta"
                      />
                      <Chip
                        color="purple"
                        active={activeBed.data.lochia === 'coagulos'}
                        onClick={() => updateActiveBedData({ lochia: 'coagulos' })}
                        label="Coágulos Volumosos"
                      />
                      <Chip
                        color="purple"
                        active={activeBed.data.lochia === 'fetido'}
                        onClick={() => updateActiveBedData({ lochia: 'fetido' })}
                        label="Lóquios Fétidos (Suspeita Endometrite)"
                        badge="Infeccioso"
                      />
                    </div>
                  </SectionCard>

                  {/* 5. Ferida Operatória / Períneo */}
                  <SectionCard title="Ferida Operatória / Períneo" icon={ShieldCheck} color="text-teal-700" bg="bg-teal-100">
                    <div className="flex flex-wrap gap-1.5">
                      <Chip
                        color="emerald"
                        active={activeBed.data.wound === 'curativo_limpo'}
                        onClick={() => updateActiveBedData({ wound: 'curativo_limpo' })}
                        label="FO: Curativo Limpo e Seco"
                      />
                      <Chip
                        color="emerald"
                        active={activeBed.data.wound === 'curativo_sangrante'}
                        onClick={() => updateActiveBedData({ wound: 'curativo_sangrante' })}
                        label="FO: Curativo Sangrante/Úmido"
                      />
                      <Chip
                        color="emerald"
                        active={activeBed.data.wound === 'perineo_integro'}
                        onClick={() => updateActiveBedData({ wound: 'perineo_integro' })}
                        label="Períneo Íntegro"
                      />
                      <Chip
                        color="emerald"
                        active={activeBed.data.wound === 'laceracao_suturada'}
                        onClick={() => updateActiveBedData({ wound: 'laceracao_suturada' })}
                        label="Laceração / Episio Suturada s/ Edema"
                      />
                      <Chip
                        color="emerald"
                        active={activeBed.data.wound === 'hematoma_perineal'}
                        onClick={() => updateActiveBedData({ wound: 'hematoma_perineal' })}
                        label="Edema / Hematoma Perineal"
                        badge="Gelo"
                      />
                    </div>
                  </SectionCard>

                  {/* 6. Eliminações & Acessos */}
                  <SectionCard title="Eliminações, Trânsito e Acessos" icon={Layers} color="text-sky-700" bg="bg-sky-100">
                    <div className="flex flex-wrap gap-1.5">
                      <Chip
                        color="sky"
                        active={activeBed.data.eliminations.includes('diurese_espontanea')}
                        onClick={() => toggleArrayItem('eliminations', 'diurese_espontanea')}
                        label="Diurese Espontânea"
                      />
                      <Chip
                        color="sky"
                        active={activeBed.data.eliminations.includes('retencao_globo')}
                        onClick={() => toggleArrayItem('eliminations', 'retencao_globo')}
                        label="Retenção / Globo Vesical"
                        badge="Sondagem"
                      />
                      <Chip
                        color="sky"
                        active={activeBed.data.eliminations.includes('svd_em_uso')}
                        onClick={() => toggleArrayItem('eliminations', 'svd_em_uso')}
                        label="Sonda Vesical Demora (SVD) em Uso"
                      />
                      <Chip
                        color="sky"
                        active={activeBed.data.eliminations.includes('retirar_svd')}
                        onClick={() => toggleArrayItem('eliminations', 'retirar_svd')}
                        label="Retirar SVD Hoje"
                        badge="Ordem"
                      />
                      <Chip
                        color="sky"
                        active={activeBed.data.eliminations.includes('flatos_presentes')}
                        onClick={() => toggleArrayItem('eliminations', 'flatos_presentes')}
                        label="Flatos Presentes"
                      />
                      <Chip
                        color="sky"
                        active={activeBed.data.eliminations.includes('constipacao')}
                        onClick={() => toggleArrayItem('eliminations', 'constipacao')}
                        label="Constipação Intestinal"
                      />
                      <Chip
                        color="sky"
                        active={activeBed.data.eliminations.includes('acesso_pervio')}
                        onClick={() => toggleArrayItem('eliminations', 'acesso_pervio')}
                        label="Acesso Venoso Pérvio"
                      />
                      <Chip
                        color="sky"
                        active={activeBed.data.eliminations.includes('suspender_venoclise')}
                        onClick={() => toggleArrayItem('eliminations', 'suspender_venoclise')}
                        label="Suspender Venóclise (Salinizar)"
                      />
                    </div>
                  </SectionCard>
                </div>

                {/* Right Form Column: Risk, Pain & Rh */}
                <div className="lg:col-span-4 space-y-3">
                  {/* Dor */}
                  <SectionCard title="Escala Visual da Dor" icon={Activity} color="text-rose-600" bg="bg-rose-50">
                    <div className="grid grid-cols-2 gap-1.5">
                      <Chip
                        color="emerald"
                        active={activeBed.data.painLevel === '0'}
                        onClick={() => updateActiveBedData({ painLevel: '0' })}
                        label="Sem Dor (0)"
                      />
                      <Chip
                        color="emerald"
                        active={activeBed.data.painLevel === '1-3'}
                        onClick={() => updateActiveBedData({ painLevel: '1-3' })}
                        label="Leve (1 a 3)"
                      />
                      <Chip
                        color="amber"
                        active={activeBed.data.painLevel === '4-6'}
                        onClick={() => updateActiveBedData({ painLevel: '4-6' })}
                        label="Moderada (4 a 6)"
                        badge="Resgate"
                      />
                      <Chip
                        color="rose"
                        active={activeBed.data.painLevel === '7-10'}
                        onClick={() => updateActiveBedData({ painLevel: '7-10' })}
                        label="Forte (7 a 10)"
                        badge="Opioide"
                      />
                    </div>
                  </SectionCard>

                  {/* Triagem Rh & Profilaxia Anti-D */}
                  <SectionCard title="Triagem Rh & Anti-D" icon={ShieldAlert} color="text-purple-700" bg="bg-purple-50">
                    <div className="space-y-1.5">
                      <Chip
                        color="purple"
                        active={activeBed.data.rhScreening === 'rh_pos'}
                        onClick={() => updateActiveBedData({ rhScreening: 'rh_pos' })}
                        label="Mãe Rh Positivo (Sem indicação)"
                      />
                      <Chip
                        color="purple"
                        active={activeBed.data.rhScreening === 'rh_neg_rn_pos'}
                        onClick={() => updateActiveBedData({ rhScreening: 'rh_neg_rn_pos' })}
                        label="Mãe Rh(-) com RN Rh(+) [Prescrever Anti-D]"
                        badge="300mcg IM"
                      />
                      <Chip
                        color="purple"
                        active={activeBed.data.rhScreening === 'nao_aplica'}
                        onClick={() => updateActiveBedData({ rhScreening: 'nao_aplica' })}
                        label="Não se Aplica / Tipagem Pendente"
                      />
                    </div>
                  </SectionCard>

                  {/* Risco de TEV */}
                  <SectionCard title="Escore TEV (Tromboprofilaxia)" icon={ShieldCheck} color="text-teal-700" bg="bg-teal-50">
                    <div className="space-y-1.5">
                      <Chip
                        color="teal"
                        active={activeBed.data.tevRisk === 'baixo'}
                        onClick={() => updateActiveBedData({ tevRisk: 'baixo' })}
                        label="Baixo Risco (Deambulação precoce)"
                      />
                      <Chip
                        color="teal"
                        active={activeBed.data.tevRisk === 'alto'}
                        onClick={() => updateActiveBedData({ tevRisk: 'alto' })}
                        label="Risco Moderado/Alto (IMC>30, Urgência, PE)"
                        badge="Enoxaparina 40mg"
                      />
                    </div>
                  </SectionCard>

                  {/* Temperatura */}
                  <SectionCard title="Temperatura Axilar" icon={Thermometer} color="text-orange-600" bg="bg-orange-50">
                    <div className="grid grid-cols-2 gap-1.5">
                      <Chip
                        color="emerald"
                        active={activeBed.data.temperature === 'afebril'}
                        onClick={() => updateActiveBedData({ temperature: 'afebril' })}
                        label="Afebril (<37.8°C)"
                      />
                      <Chip
                        color="rose"
                        active={activeBed.data.temperature === 'febril'}
                        onClick={() => updateActiveBedData({ temperature: 'febril' })}
                        label="Pico Febril (>=37.8°C)"
                        badge="Investigar"
                      />
                    </div>
                  </SectionCard>

                  {/* Quick Action to Prescription */}
                  <button
                    onClick={() => setActiveTab('prescription')}
                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <span>Gerar Prescrição Médica</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Gestante Left Column */}
                <div className="lg:col-span-8 space-y-3">
                  {/* 1. Idade Gestacional & Motivo */}
                  <SectionCard title="Idade Gestacional & Admissão" icon={Calendar} color="text-sky-700" bg="bg-sky-100">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            Idade Gestacional: <strong className="text-sky-700 text-sm">{activeBed.data.gestationalAge} Semanas</strong>
                          </label>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            activeBed.data.gestationalAge < 34
                              ? 'bg-rose-100 text-rose-700'
                              : activeBed.data.gestationalAge < 37
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {activeBed.data.gestationalAge < 34 ? 'Prematuro Extremo/Moderado' : activeBed.data.gestationalAge < 37 ? 'Prematuro Tardio' : 'Termo'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="41"
                          value={activeBed.data.gestationalAge}
                          onChange={(e) => updateActiveBedData({ gestationalAge: parseInt(e.target.value) })}
                          className="w-full accent-sky-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                          <span>20 sem (Viabilidade)</span>
                          <span>28 sem</span>
                          <span>34 sem (Corticoterapia limite)</span>
                          <span>37 sem (Termo)</span>
                          <span>41 sem</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Motivo(s) da Internação:
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          <Chip
                            color="sky"
                            active={activeBed.data.admissionReason.includes('tp_latente')}
                            onClick={() => toggleArrayItem('admissionReason', 'tp_latente')}
                            label="Trabalho de Parto (Latente)"
                          />
                          <Chip
                            color="sky"
                            active={activeBed.data.admissionReason.includes('tp_ativo')}
                            onClick={() => toggleArrayItem('admissionReason', 'tp_ativo')}
                            label="Trabalho de Parto (Ativo)"
                          />
                          <Chip
                            color="sky"
                            active={activeBed.data.admissionReason.includes('ruprema')}
                            onClick={() => toggleArrayItem('admissionReason', 'ruprema')}
                            label="RUPREMA (Bolsa Rota)"
                            badge="Latência"
                          />
                          <Chip
                            color="sky"
                            active={activeBed.data.admissionReason.includes('hipertensao')}
                            onClick={() => toggleArrayItem('admissionReason', 'hipertensao')}
                            label="Síndrome Hipertensiva / PE"
                            badge="PA"
                          />
                          <Chip
                            color="sky"
                            active={activeBed.data.admissionReason.includes('dmg')}
                            onClick={() => toggleArrayItem('admissionReason', 'dmg')}
                            label="DMG (Diabetes Gestacional)"
                          />
                          <Chip
                            color="sky"
                            active={activeBed.data.admissionReason.includes('itu_pielonefrite')}
                            onClick={() => toggleArrayItem('admissionReason', 'itu_pielonefrite')}
                            label="ITU / Pielonefrite"
                          />
                          <Chip
                            color="sky"
                            active={activeBed.data.admissionReason.includes('ameaca_tpp')}
                            onClick={() => toggleArrayItem('admissionReason', 'ameaca_tpp')}
                            label="Ameaça de TPP"
                            badge="Corticoide"
                          />
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  {/* 2. Pressão Arterial & Sinais de Iminência */}
                  <SectionCard title="Pressão Arterial e Sinais de Iminência" icon={Activity} color="text-rose-700" bg="bg-rose-100">
                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Nível Pressórico Atual:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <Chip
                            color="emerald"
                            active={activeBed.data.bloodPressure === 'normal'}
                            onClick={() => updateActiveBedData({ bloodPressure: 'normal' })}
                            label="PA Normal (< 140/90 mmHg)"
                          />
                          <Chip
                            color="rose"
                            active={activeBed.data.bloodPressure === 'elevada'}
                            onClick={() => updateActiveBedData({ bloodPressure: 'elevada' })}
                            label="PA Elevada (>= 140/90 mmHg)"
                            badge="ALERTA"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Pesquisa de Sintomas de Iminência de Eclâmpsia:
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          <Chip
                            color="rose"
                            active={activeBed.data.imminenceSigns.includes('cefaleia')}
                            onClick={() => toggleArrayItem('imminenceSigns', 'cefaleia')}
                            label="Cefaleia Refratária"
                          />
                          <Chip
                            color="rose"
                            active={activeBed.data.imminenceSigns.includes('escotomas')}
                            onClick={() => toggleArrayItem('imminenceSigns', 'escotomas')}
                            label="Escotomas Cintilantes / Turvação"
                          />
                          <Chip
                            color="rose"
                            active={activeBed.data.imminenceSigns.includes('epigastralgia')}
                            onClick={() => toggleArrayItem('imminenceSigns', 'epigastralgia')}
                            label="Epigastralgia / Dor em Barra"
                          />
                        </div>
                        {activeBed.data.imminenceSigns.length > 0 && activeBed.data.bloodPressure === 'elevada' && (
                          <div className="mt-2 p-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>Indicação imediata de Sulfato de Magnésio (Protocolo Zuspan)!</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </SectionCard>

                  {/* 3. Dinâmica Uterina e Perdas */}
                  <SectionCard title="Dinâmica Uterina & Perdas Vaginais" icon={Activity} color="text-teal-700" bg="bg-teal-100">
                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Dinâmica Uterina (Contrações):
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          <Chip
                            color="teal"
                            active={activeBed.data.dynamics === 'ausente'}
                            onClick={() => updateActiveBedData({ dynamics: 'ausente' })}
                            label="Ausente (Tônus normal)"
                          />
                          <Chip
                            color="teal"
                            active={activeBed.data.dynamics === 'irregular'}
                            onClick={() => updateActiveBedData({ dynamics: 'irregular' })}
                            label="Irregular / Incoordenada (1-2/10min)"
                          />
                          <Chip
                            color="teal"
                            active={activeBed.data.dynamics === 'ativo'}
                            onClick={() => updateActiveBedData({ dynamics: 'ativo' })}
                            label="Trabalho de Parto Ativo (3-4/10min)"
                            badge="Parto"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Perdas Vaginais:
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          <Chip
                            color="teal"
                            active={activeBed.data.vaginalLosses === 'ausente'}
                            onClick={() => updateActiveBedData({ vaginalLosses: 'ausente' })}
                            label="Ausentes / Fisiológico"
                          />
                          <Chip
                            color="teal"
                            active={activeBed.data.vaginalLosses === 'tampao'}
                            onClick={() => updateActiveBedData({ vaginalLosses: 'tampao' })}
                            label="Tampão Mucoso"
                          />
                          <Chip
                            color="teal"
                            active={activeBed.data.vaginalLosses === 'liquido_claro'}
                            onClick={() => updateActiveBedData({ vaginalLosses: 'liquido_claro' })}
                            label="Líquido Amniótico Claro c/ Grumos"
                          />
                          <Chip
                            color="rose"
                            active={activeBed.data.vaginalLosses === 'liquido_meconial'}
                            onClick={() => updateActiveBedData({ vaginalLosses: 'liquido_meconial' })}
                            label="Líquido Amniótico Meconial"
                            badge="Alerta"
                          />
                          <Chip
                            color="rose"
                            active={activeBed.data.vaginalLosses === 'sangramento'}
                            onClick={() => updateActiveBedData({ vaginalLosses: 'sangramento' })}
                            label="Sangramento Vivo Ativo"
                            badge="URGÊNCIA"
                          />
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                </div>

                {/* Gestante Right Column: Vitalidade Fetal */}
                <div className="lg:col-span-4 space-y-3">
                  <SectionCard title="Vitalidade Fetal (BCF)" icon={HeartPulse} color="text-rose-600" bg="bg-rose-50">
                    <div className="space-y-2.5">
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">
                          Frequência Cardíaca Fetal (BCF):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="60"
                            max="220"
                            value={activeBed.data.fhrValue || 140}
                            onChange={(e) => updateActiveBedData({ fhrValue: parseInt(e.target.value) || 140 })}
                            className="w-24 text-center font-bold text-base px-2 py-1.5 border border-slate-300 rounded-xl focus:border-teal-500 focus:outline-none"
                          />
                          <span className="text-xs text-slate-500 font-medium">bpm (Normal: 110-160)</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Chip
                          color="emerald"
                          active={activeBed.data.fetalVitality === 'bcf_normal'}
                          onClick={() => updateActiveBedData({ fetalVitality: 'bcf_normal' })}
                          label="BCF Rítmico e Reativo (110-160)"
                        />
                        <Chip
                          color="rose"
                          active={activeBed.data.fetalVitality === 'bcf_anormal'}
                          onClick={() => updateActiveBedData({ fetalVitality: 'bcf_anormal' })}
                          label="BCF Taquicárdico / Bradicárdico"
                          badge="CTG Urgente"
                        />
                        <Chip
                          color="emerald"
                          active={activeBed.data.fetalVitality === 'mov_ativo'}
                          onClick={() => updateActiveBedData({ fetalVitality: 'mov_ativo' })}
                          label="Movimentação Fetal Ativa Sentida"
                        />
                      </div>
                    </div>
                  </SectionCard>

                  {/* Dor */}
                  <SectionCard title="Escala Visual da Dor" icon={Activity} color="text-slate-600" bg="bg-slate-100">
                    <div className="grid grid-cols-2 gap-1.5">
                      {['0', '1-3', '4-6', '7-10'].map((p) => (
                        <Chip
                          key={p}
                          color={p === '0' || p === '1-3' ? 'emerald' : p === '4-6' ? 'amber' : 'rose'}
                          active={activeBed.data.painLevel === p}
                          onClick={() => updateActiveBedData({ painLevel: p })}
                          label={p === '0' ? 'Sem dor' : `Dor ${p}`}
                        />
                      ))}
                    </div>
                  </SectionCard>

                  {/* Button to Prescription */}
                  <button
                    onClick={() => setActiveTab('prescription')}
                    className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <span>Gerar Prescrição da Gestante</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {}
        {activeTab === 'prescription' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                    Gerador Inteligente
                  </span>
                  <h2 className="text-base font-bold text-slate-900 mt-1">
                    Prescrição Médica Obstétrica - {activeBed.label}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Ajustada automaticamente conforme os parâmetros marcados no checklist.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(prescriptionText, 'Prescrição')}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Prescrição</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all text-xs"
                    title="Imprimir prescrição"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Prescription Content Box */}
              <div className="bg-slate-50/80 rounded-2xl p-4 font-mono text-xs text-slate-800 leading-relaxed border border-slate-200/80 whitespace-pre-wrap select-all">
                {prescriptionText}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-teal-600" />
                  Pressione "Copiar Prescrição" e cole diretamente no Prontuário Eletrônico do Paciente (PEP).
                </span>
                <button
                  onClick={() => setActiveTab('soap')}
                  className="font-semibold text-teal-700 hover:underline flex items-center gap-1"
                >
                  <span>Ver Evolução SOAP</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {}
        {activeTab === 'soap' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                    Nota Clínica Estruturada
                  </span>
                  <h2 className="text-base font-bold text-slate-900 mt-1">
                    Evolução SOAP - {activeBed.label}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Formato padronizado (Subjetivo, Objetivo, Avaliação, Plano) para passagem de plantão e prontuário.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(soapText, 'Evolução SOAP')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Evolução SOAP</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all text-xs"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* SOAP Content Box */}
              <div className="bg-slate-50/80 rounded-2xl p-4 font-mono text-xs text-slate-800 leading-relaxed border border-slate-200/80 whitespace-pre-wrap select-all">
                {soapText}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  Pronta para ser colada na folha de evolução de enfermagem ou médica.
                </span>
                <button
                  onClick={() => setActiveTab('checklist')}
                  className="font-semibold text-purple-700 hover:underline flex items-center gap-1"
                >
                  <span>Voltar ao Checklist</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {}
        {activeTab === 'shift_summary' && (
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-teal-600" />
                  <span>Resumo Consolidado do Plantão</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Visão panorâmica de todos os leitos da maternidade para a passagem verbal e escrita de plantão.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Filters */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
                >
                  <option value="all">Todos os Leitos ({beds.length})</option>
                  <option value="puerpera">Apenas Puérperas ({stats.puerperas})</option>
                  <option value="gestante">Apenas Gestantes ({stats.gestantes})</option>
                  <option value="alerts">Com Alertas ({stats.alertCount})</option>
                </select>

                <button
                  onClick={() => {
                    const fullSummary = beds
                      .filter((b) => b.type !== 'vago')
                      .map((b) => {
                        const al = analyzeBedAlerts(b);
                        const alText = al.length > 0 ? ` [ALERTA: ${al.map((a) => a.title).join(', ')}]` : '';
                        return `${b.label} (${b.type.toUpperCase()}): ${b.patientName}${alText} | Revisado: ${b.isReviewed ? 'SIM' : 'NÃO'}`;
                      })
                      .join('\n');
                    copyToClipboard(fullSummary, 'Resumo do Plantão');
                  }}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-slate-800"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Lista</span>
                </button>

                <button
                  onClick={resetAllBeds}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-100 flex items-center gap-1"
                  title="Restaurar dados de exemplo"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Demo</span>
                </button>
              </div>
            </div>

            {/* Handover Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredBeds.map((bed) => {
                const bedAlerts = analyzeBedAlerts(bed);
                const hasAlerts = bedAlerts.length > 0;

                return (
                  <div
                    key={bed.id}
                    onClick={() => {
                      setActiveBedId(bed.id);
                      setActiveTab('checklist');
                    }}
                    className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer hover:shadow-md hover:border-teal-400 ${
                      hasAlerts
                        ? 'border-rose-300 ring-1 ring-rose-100'
                        : bed.isReviewed
                        ? 'border-slate-200'
                        : 'border-amber-200 bg-amber-50/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{bed.label}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            bed.type === 'puerpera'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : bed.type === 'gestante'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {bed.type === 'puerpera' ? 'Puérpera' : bed.type === 'gestante' ? 'Gestante' : 'Vago'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {bed.isReviewed ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            OK
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                            Pendente
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-700 mb-2 truncate">
                      {bed.patientName || 'Não identificada'}
                    </p>

                    {bed.type === 'puerpera' && (
                      <div className="text-[11px] text-slate-500 space-y-0.5 mb-2">
                        <div>Parto: <strong className="text-slate-700">{bed.data.deliveryType} ({bed.data.postpartumDay})</strong></div>
                        <div>Útero: <span className="text-slate-700">{bed.data.uterus}</span> | Dor: <span className="text-slate-700">{bed.data.painLevel}/10</span></div>
                        {bed.data.rhScreening === 'rh_neg_rn_pos' && (
                          <div className="text-purple-700 font-bold">Anti-D 300mcg Pendente</div>
                        )}
                      </div>
                    )}

                    {bed.type === 'gestante' && (
                      <div className="text-[11px] text-slate-500 space-y-0.5 mb-2">
                        <div>IG: <strong className="text-slate-700">{bed.data.gestationalAge} semanas</strong></div>
                        <div>Diagnóstico: <span className="text-slate-700">{bed.data.admissionReason.join(', ')}</span></div>
                        <div>PA: <span className={bed.data.bloodPressure === 'elevada' ? 'text-rose-600 font-bold' : 'text-slate-700'}>{bed.data.bloodPressure}</span></div>
                      </div>
                    )}

                    {bed.type === 'vago' && (
                      <p className="text-[11px] text-slate-400 italic mb-2">Leito disponível para admissão.</p>
                    )}

                    {hasAlerts && (
                      <div className="pt-2 border-t border-rose-100 flex items-center gap-1.5 text-[11px] text-rose-700 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span className="truncate">{bedAlerts[0].title}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {}
      {activeTab === 'checklist' && activeBed.type !== 'vago' && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2.5 flex items-center gap-2 z-20 shadow-lg">
          <button
            onClick={() => toggleReviewed(activeBed.id)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
              activeBed.isReviewed ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{activeBed.isReviewed ? 'Revisado' : 'Marcar OK'}</span>
          </button>

          <button
            onClick={() => setActiveTab('prescription')}
            className="flex-1 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
          >
            <Pill className="w-4 h-4" />
            <span>Prescrição</span>
          </button>
        </div>
      )}
    </div>
  );
}