import { Bed } from '../types/bed';

export const generatePrescriptionText = (bed: Bed): string => {
  if (!bed || bed.type === 'vago') {
    return 'Leito vago no momento. Selecione o perfil clínico da paciente para gerar a prescrição médica.';
  }

  const lines: string[] = [];
  const today = new Date().toLocaleDateString('pt-BR');
  lines.push(`HOSPITAL MATERNIDADE - PRESCRIÇÃO MÉDICA OBSTÉTRICA`);
  lines.push(`LEITO: ${bed.label} | PACIENTE: ${bed.patientName || 'Não identificada'} | DATA: ${today}`);
  lines.push(`--------------------------------------------------------------------------------`);

  // --- PUÉRPERA ---
  if (bed.type === 'puerpera') {
    const d = bed.data || {};
    const isCesarea = d.deliveryType?.includes('cesarea');
    const isD1OrMore = d.postpartumDay !== 'D0';

    // 1. DIETA
    lines.push(`1. DIETA:`);
    if (isCesarea && d.postpartumDay === 'D0') {
      lines.push(`   - Dieta líquida restrita/branda liberada após 6 horas da cesariana.`);
    } else if (!isCesarea) {
      lines.push(`   - Dieta geral obstétrica laxativa (liberada imediatamente pós-parto normal).`);
    } else {
      lines.push(`   - Dieta geral obstétrica hiperproteica; incentivar ingesta hídrica abundante.`);
    }

    // 2. HIDRATAÇÃO / ACESSOS
    lines.push(`\n2. ACESSOS VENOSOS & HIDRATAÇÃO:`);
    if (isD1OrMore) {
      lines.push(`   - Protocolo D1+: TODA medicação por via ORAL. Suspender venóclise contínua.`);
      lines.push(`   - Manter acesso venoso periférico (${bed.avpSite || 'MSD'}) apenas salinizado para eventuais resgates.`);
    } else if (d.eliminations?.includes('suspender_venoclise')) {
      lines.push(`   - Suspender venóclise contínua; manter apenas salinizado para analgesia.`);
    } else {
      lines.push(`   - Soro Ringer Lactato ou SF 0,9% 1000ml EV em 12h conforme balanço hídrico.`);
    }

    // 3. ANALGESIA BASAL
    lines.push(`\n3. ANALGESIA E ANTI-INFLAMATÓRIO:`);
    if (isD1OrMore) {
      lines.push(`   - Dipirona 500mg VO a cada 6 horas se dor.`);
      lines.push(`   - Ibuprofeno 600mg VO de 8 em 8 horas por até 3 dias (após refeições).`);
    } else {
      lines.push(`   - Dipirona 1g EV a cada 6 horas (horário fixo se dor presente).`);
      if (isCesarea || d.wound === 'laceracao_suturada') {
        lines.push(`   - Cetoprofeno 100mg EV de 12 em 12 horas por até 48 horas.`);
      }
    }

    // 4. ANALGESIA DE RESGATE
    if (d.painLevel === '4-6' || d.painLevel === '7-10') {
      lines.push(`\n4. ANALGESIA DE RESGATE (DOR MODERADA / FORTE):`);
      lines.push(`   - Tramadol 50mg a 100mg EV diluído em 100ml SF 0,9% infundir em 30 min (se EVA > 5, máx 8/8h).`);
    }

    // 5. GASTRO / SINTOMÁTICOS
    lines.push(`\n5. SINTOMÁTICOS GASTROINTESTINAIS:`);
    lines.push(`   - Luftal (Simeticona) 40 gotas VO ou 1 comprimido VO de 8 em 8 horas se queixas de gases/distensão.`);
    lines.push(`   - Ondansetrona 4mg a 8mg EV/VO de 8 em 8 horas se náuseas ou vômitos.`);

    // 6. PROFILAXIAS & ESPECÍFICOS (Regras de evolucao.txt)
    lines.push(`\n6. PROFILAXIAS & TERAPÊUTICA ESPECÍFICA:`);
    if (d.rhScreening === 'rh_neg_rn_pos') {
      lines.push(`   - [IMUNOPROFILAXIA ANTI-D]:`);
      lines.push(`     * Nome no sistema: MATERGAN`);
      lines.push(`     * Prescrição: FAZER 1 AMP, IM, AGORA (em até 72h pós-parto).`);
    }

    if (d.labExams?.trSifilis === 'reagente') {
      lines.push(`   - [SÍFILIS DETECTADA]:`);
      lines.push(`     * Solicitar VDRL quantitativo urgente.`);
      lines.push(`     * Penicilina G Benzatina 2.400.000 UI IM (1.200.000 UI em cada glúteo) dose 1.`);
    }

    if (d.uterus === 'hipotonico') {
      lines.push(`   - [URGÊNCIA - ATONIA UTERINA]:`);
      lines.push(`     * Ocitocina 20 UI em 500ml SF 0,9% EV em infusão rápida contínua + Massagem bimanual.`);
      lines.push(`     * Se refratário: Misoprostol 800mcg via retal ou Metilergometrina 0,2mg IM (se normotensa).`);
    }

    if (d.lochia === 'fetido' || d.temperature === 'febril') {
      lines.push(`   - [SUSPEITA DE ENDOMETRITE]:`);
      lines.push(`     * Clindamicina 900mg EV 8/8h + Gentamicina 5mg/kg EV 1x/dia.`);
    }

    if (d.tevRisk === 'alto') {
      lines.push(`   - [ALTO RISCO TEV] Enoxaparina 40mg SC 1x ao dia (iniciar 12h após bloqueio raquidiano).`);
    }

    // 7. SUPLEMENTAÇÃO
    lines.push(`\n7. SUPLEMENTAÇÃO HEMATÍNICA:`);
    lines.push(`   - Sulfato Ferroso 200mg (ou 40mg ferro elementar) VO 1x ao dia.`);

    // 8. CUIDADOS DE ENFERMAGEM
    lines.push(`\n8. CUIDADOS DE ENFERMAGEM & VIGILÂNCIA:`);
    lines.push(`   - Controle de SSVV (PA, FC, Tax) de 6 em 6 horas.`);
    lines.push(`   - Avaliação contínua da involução uterina (Globo de Pinard) e lóquios.`);
    if (isCesarea) {
      lines.push(`   - [SONDA VESICAL]: Sentar a paciente e retirar a SVD 12 horas após a cesariana.`);
      lines.push(`   - Curativo da FO: Lavar com água e sabonete neutro no banho 4x/dia, secar bem e manter aberto.`);
    } else {
      lines.push(`   - Higiene perineal suave com água morna corrente após cada micção/evacuação.`);
    }
    lines.push(`   - Apoio integral ao Aleitamento Materno Exclusivo (AMEX) em livre demanda.`);
    lines.push(`   - Estimular deambulação precoce.`);
  }

  // --- GESTANTE ---
  else if (bed.type === 'gestante') {
    const d = bed.data || {};
    const isSevereBP = d.bloodPressure === 'grave' ||
      (d.bpValue && (parseInt(d.bpValue.split('/')[0]) >= 160 || parseInt(d.bpValue.split('/')[1]) >= 110));

    // 1. DIETA
    lines.push(`1. DIETA:`);
    if (d.admissionReason?.includes('dmg')) {
      lines.push(`   - Dieta balanceada fracionada para Diabetes Mellitus Gestacional (DMG), 6 refeições/dia.`);
    } else if (d.bloodPressure === 'elevada' || isSevereBP) {
      lines.push(`   - Dieta hipossódica para gestante hipertensa.`);
    } else {
      lines.push(`   - Dieta geral/branda para gestante.`);
    }

    // 2. REPOUSO & POSIÇÃO
    lines.push(`\n2. CUIDADOS POSTURAIS:`);
    lines.push(`   - Repouso no leito em Decúbito Lateral Esquerdo (DLE) preferencial.`);

    // 3. TERAPÊUTICA FARMACOLÓGICA
    lines.push(`\n3. TERAPÊUTICA FARMACOLÓGICA:`);
    if (isSevereBP || (d.bloodPressure === 'elevada' && d.imminenceSigns?.length > 0)) {
      lines.push(`   - [EMERGÊNCIA OBSTÉTRICA - PROTOCOLO ZUSPAN / SULFATAÇÃO]:`);
      lines.push(`     * CHAMAR PLANTONISTA IMEDIATAMENTE!`);
      lines.push(`     * Ataque: Sulfato de Magnésio 50% 4g (8ml) + 12ml SG 5% EV lento em 15 a 20 minutos.`);
      lines.push(`     * Manutenção: Sulfato de Magnésio 1g/h a 2g/h em BIC contínua por 24 horas.`);
      lines.push(`     * Ter à beira do leito: Gluconato de Cálcio 10% 1 ampola (antídoto).`);
      lines.push(`     * Se PAS >= 160 ou PAD >= 110: Hidralazina 5mg EV lento em bolus (repetir se refratário).`);
    } else if (d.bloodPressure === 'elevada') {
      lines.push(`   - Metildopa 500mg VO de 8 em 8 horas (ajustar conforme mapa pressórico).`);
    }

    if (d.admissionReason?.includes('ameaca_tpp') && d.gestationalAge >= 24 && d.gestationalAge < 34) {
      lines.push(`   - [MATURAÇÃO PULMONAR FETAL]: Betametasona 12mg IM profunda (dose 1 de 2, repetir em 24h).`);
      if (d.dynamics === 'ativo' || d.dynamics === 'irregular') {
        lines.push(`   - [TOCOLÍSE]: Nifedipino 20mg VO ataque, seguido de 10mg a 20mg a cada 6-8h por até 48h.`);
      }
    }

    if (d.gestationalAge < 20 && (d.admissionReason?.includes('ameaca_aborto') || d.admissionReason?.includes('sangramento_1tri') || d.admissionReason?.includes('dor_abdominal'))) {
      lines.push(`   - [CONDUTA AMEAÇA DE ABORTO / < 20 SEMANAS]:`);
      lines.push(`     * Repouso relativo no leito.`);
      lines.push(`     * Escopolamina / Hioscina 20mg VO ou EV se cólicas em baixo ventre.`);
      lines.push(`     * Solicitar USG Obstétrica / Transvaginal urgente.`);
    }

    if (d.admissionReason?.includes('pielonefrite') || d.admissionReason?.includes('itu_pielonefrite')) {
      lines.push(`   - [PIELONEFRITE AGUDA]: Ceftriaxona 1g EV 1x ao dia + Hidratação venosa generosa (SF 0,9% 1000ml a 1500ml/dia) + Curva térmica de 4/4h.`);
    } else if (d.admissionReason?.includes('itu')) {
      lines.push(`   - [ITU BAIXA / CISTITE]: Cefalexina 500mg VO de 6/6h por 7 a 10 dias (ou conforme antibiograma) + Hidratação oral abundante.`);
    }

    if (d.admissionReason?.includes('ruprema')) {
      lines.push(`   - Ampicilina 2g EV 6/6h por 48h + Azitromicina 1g VO dose única; após, Amoxicilina 500mg 8/8h.`);
    }

    // 4. SINTOMÁTICOS
    lines.push(`\n4. SINTOMÁTICOS:`);
    lines.push(`   - Dipirona 1g EV ou VO 6/6h se cefaleia leve ou dores.`);
    lines.push(`   - Metoclopramida 10mg EV 8/8h se náuseas.`);

    // 5. CUIDADOS DE ENFERMAGEM
    lines.push(`\n5. CUIDADOS DE ENFERMAGEM & VIGILÂNCIA:`);
    lines.push(`   - Ausculta intermitente de BCF com sonar Doppler a cada 4 horas (valor normal: 110-160 bpm).`);
    lines.push(`   - Controle de PA de 4/4h (ou de 1/1h se em uso de Sulfato de Magnésio).`);
    lines.push(`   - Cardiotocografia (CTG) basal diária.`);
    lines.push(`   - Observar dinâmica uterina e perdas vaginais.`);
  }

  // --- CURETAGEM ---
  else if (bed.type === 'curetagem') {
    lines.push(`1. DIETA:`);
    lines.push(`   - Dieta branda/geral após recuperação anestésica plena.`);
    lines.push(`\n2. ACESSO VENOSO:`);
    lines.push(`   - Manter acesso venoso periférico (${bed.avpSite || 'MSD'}) salinizado.`);
    lines.push(`\n3. ANALGESIA:`);
    lines.push(`   - Dipirona 1g VO ou EV de 6 em 6 horas se dores ou cólicas.`);
    lines.push(`\n4. SUPLEMENTAÇÃO:`);
    lines.push(`   - Sulfato Ferroso 200mg VO 1x ao dia por 90 dias.`);
    lines.push(`\n5. CUIDADOS DE ENFERMAGEM:`);
    lines.push(`   - Observar rigorosamente sangramento no forro vaginal.`);
    lines.push(`   - Controle de SSVV (PA, FC, Tax) de 6/6h.`);
    lines.push(`   - Estimular deambulação assistida.`);
  }

  lines.push(`--------------------------------------------------------------------------------`);
  lines.push(`Responsável pelo Plantão: ________________________________ CRM: _________________`);
  return lines.join('\n');
};
