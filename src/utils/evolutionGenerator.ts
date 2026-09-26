import { Bed } from '../types/bed';
import { DISCHARGE_PRESCRIPTIONS, DISCHARGE_GUIDELINES } from '../constants/evolutionTemplates';
import { parseAndEvaluateBP, getBedBP } from './bpAnalyzer';

/**
 * Extrai apenas o corpo da HDA (sem os prefixos "HDA:" e "PACIENTE [PARIDADE]").
 * Permite que a paridade seja mantida como fixa e inalterável no início.
 */
export const extractHdaBody = (rawHda?: string, currentParidade?: string): string => {
  if (!rawHda) return '';
  let cleaned = rawHda.trim();

  // 1. Remove "HDA:" se presente
  cleaned = cleaned.replace(/^HDA:\s*/i, '').trim();

  // 2. Se a paridade atual for conhecida, remove o prefixo exato "PACIENTE <paridade>"
  if (currentParidade) {
    const escaped = currentParidade.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp('^PACIENTE\\s+' + escaped + '\\s*', 'i'), '').trim();
  }

  // 3. Remove variações genéricas de "PACIENTE [G...P...] "
  cleaned = cleaned.replace(/^PACIENTE(\s+[Gg]\d[^\s,]*(\s*\([^)]*\))?[^\s,]*)?\s*/i, '').trim();

  // 4. Se sobrou apenas vírgula ou traço inicial, remove
  cleaned = cleaned.replace(/^[,;.\-–—]\s*/, '').trim();

  return cleaned;
};

/**
 * Dicionário de motivos de internação para exibição médica formal em maiúsculas na evolução.
 * Evita que identificadores brutos como "ITU_PIELONEFRITE" sejam impressos no prontuário.
 */
export const formatAdmissionReason = (reason: string): string => {
  if (!reason) return '';
  const key = reason.toLowerCase().trim();
  const map: Record<string, string> = {
    itu: 'ITU (INFECÇÃO DO TRATO URINÁRIO)',
    pielonefrite: 'PIELONEFRITE AGUDA',
    itu_pielonefrite: 'ITU / PIELONEFRITE',
    hipertensao: 'SÍNDROME HIPERTENSIVA GESTACIONAL',
    preeclampsia: 'PRÉ-ECLÂMPSIA (PE)',
    ameaca_tpp: 'AMEAÇA DE TRABALHO DE PARTO PREMATURO (TPP)',
    tp_latente: 'TRABALHO DE PARTO EM FASE LATENTE',
    tp_ativo: 'TRABALHO DE PARTO EM FASE ATIVA',
    ruprema: 'RUPREMA (ROTURA PREMATURA DE MEMBRANAS)',
    dmg: 'DIABETES MELLITUS GESTACIONAL (DMG)',
    ameaca_aborto: 'AMEAÇA DE ABORTO',
    hiperemese: 'HIPERÊMESE GRAVÍDICA',
    sangramento_1tri: 'SANGRAMENTO DE 1º/2º TRIMESTRE',
    dor_abdominal: 'DOR ABDOMINAL A ESCLARECER',
    rcf: 'RESTRIÇÃO DE CRESCIMENTO FETAL (RCF)',
    alteracao_liquido: 'ALTERAÇÃO DO LÍQUIDO AMNIÓTICO'
  };
  return map[key] || reason.replace(/_/g, ' ').toUpperCase();
};

export const formatAdmissionReasonsList = (reasons?: string[]): string => {
  if (!reasons || reasons.length === 0) return '';
  return reasons.map(formatAdmissionReason).filter(Boolean).join(', ');
};

/**
 * Gera o corpo clínico padrão da HDA (sem o prefixo "PACIENTE [PARIDADE]").
 */
export const generateDefaultHdaBody = (bed: Bed): string => {
  if (!bed || bed.type === 'vago') return '';

  const d = bed.data || {};
  const isPuerpera = bed.type === 'puerpera';
  const isGestante = bed.type === 'gestante';
  const isCuretagem = bed.type === 'curetagem';

  const rawBP = getBedBP(bed);
  const bpEval = parseAndEvaluateBP(rawBP);
  const bpPart = bpEval.shortFormatted && (bpEval.isElevated || bpEval.isHypertensiveCrisis)
    ? ` E PA ELEVADA DE ${bpEval.shortFormatted.toUpperCase()}MMHG`
    : '';
  const sulfatadaPart = bpEval.isHypertensiveCrisis || bed.intercorrencias?.toLowerCase().includes('sulfat')
    ? '. SENDO SULFATADA.'
    : '.';

  const rawHdaDetails = (bed.hdaDetails || d.hdaDetails || '').trim();
  let detailsPart = '';
  if (rawHdaDetails) {
    const clean = rawHdaDetails.trim().replace(/\.+$/, '');
    const isPrefixed = /^(PACIENTE|QUADRO|HIST[OÓ]RIA|REFERE|RELATA|INICIOU|APRESENTA|NEGA)/i.test(clean);
    detailsPart = isPrefixed ? ` ${clean.toUpperCase()}.` : ` HISTÓRIA CLÍNICA: ${clean.toUpperCase()}.`;
  }

  if (isPuerpera) {
    const isCesarea = d.deliveryType?.includes('cesarea');
    const partoTipo = isCesarea ? 'CESÁREA' : 'PARTO NORMAL';
    // Data não informada sai como lacuna para preencher (não assume data de hoje nem a da admissão)
    const dataParto = d.deliveryDate || '__/__/__';
    const dataEntrada = bed.admissionDate || '__/__/__';
    const horaEntrada = bed.admissionTime ? ` ÀS ${bed.admissionTime}` : '';
    const queixas = bed.intercorrencias ? `, A ${bed.intercorrencias.toUpperCase()}` : '';

    return `EM ${dataParto} DE PÓS ${partoTipo}, DEU ENTRADA AO SERVIÇO EM ${dataEntrada}${horaEntrada}${queixas}${bpPart}${sulfatadaPart}${detailsPart}`;
  } else if (isGestante) {
    const igStr = `${d.gestationalAge || 32} SEMANAS${d.gestationalDays ? ` E ${d.gestationalDays} DIAS` : ''}`;
    const dataEntrada = bed.admissionDate || '__/__/__';
    const horaEntrada = bed.admissionTime ? ` ÀS ${bed.admissionTime}` : '';
    const motivosFormatados = formatAdmissionReasonsList(d.admissionReason);
    const motivo = motivosFormatados || bed.diagnosis?.toUpperCase() || 'QUADRO OBSTÉTRICO';
    const queixas = d.imminenceSigns?.length
      ? ` REFERINDO ${d.imminenceSigns.map((s: string) => s === 'cefaleia' ? 'CEFALEIA' : s === 'escotomas' ? 'ESCOTOMAS CINTILANTES' : s === 'epigastralgia' ? 'EPIGASTRALGIA' : s.toUpperCase()).join(' E ')}`
      : '';

    return `GESTANTE COM IG DE ${igStr} (${d.gestationalAgeMethod || 'ALEGADA'}), DEU ENTRADA AO SERVIÇO EM ${dataEntrada}${horaEntrada} POR ${motivo}${queixas}${bpPart}${sulfatadaPart}${detailsPart}`;
  } else if (isCuretagem) {
    const dataEntrada = bed.admissionDate || '__/__/__';
    const horaEntrada = bed.admissionTime ? ` ÀS ${bed.admissionTime}` : '';
    const motivo = (d.admissionReason || 'ABORTAMENTO INCOMPLETO').toString().toUpperCase();
    const dataCuretagem = d.curetageDate ? ` EM ${d.curetageDate}` : '';
    const horaCuretagem = d.curetageTime ? ` ÀS ${d.curetageTime}` : '';
    const anestesia = d.anesthesia ? ` SOB ${d.anesthesia.toUpperCase()}` : '';
    return `ADMITIDA EM ${dataEntrada}${horaEntrada} DEVIDO QUADRO DE ${motivo}. SUBMETIDA A CURETAGEM UTERINA${dataCuretagem}${horaCuretagem}${anestesia}.${detailsPart}`;
  } else {
    return `INTERNADA NO LEITO ${bed.label} EM ${bed.admissionDate || 'DATA NÃO INFORMADA'}.${detailsPart}`;
  }
};

/**
 * Gera o texto padrão completo da HDA com o prefixo fixo: "PACIENTE [PARIDADE] [CORPO]".
 */
export const generateDefaultHda = (bed: Bed): string => {
  if (!bed || bed.type === 'vago') return '';
  const d = bed.data || {};
  const obstStr = bed.obstetricHistory || d.obstetricHistory || 'G01P00(n00 C 00)A00';
  const body = generateDefaultHdaBody(bed);
  return `PACIENTE ${obstStr} ${body}`.trim();
};

export const generateHospitalEvolutionText = (bed: Bed): string => {
  if (!bed || bed.type === 'vago') {
    return 'Leito vago. Sem evolução médica a ser gerada.';
  }

  const d = bed.data || {};
  const isPuerpera = bed.type === 'puerpera';
  const isGestante = bed.type === 'gestante';
  const isCuretagem = bed.type === 'curetagem';

  // 1. HDA (Com prefixo fixo sempre garantido: "PACIENTE [PARIDADE]")
  const paridade = bed.obstetricHistory || d.obstetricHistory || 'G01P00(n00 C 00)A00';
  const prefixoFixo = `PACIENTE ${paridade}`;

  const rawHdaDetails = (bed.hdaDetails || d.hdaDetails || '').trim();
  let detailsPart = '';
  if (rawHdaDetails) {
    const clean = rawHdaDetails.trim().replace(/\.+$/, '');
    const isPrefixed = /^(PACIENTE|QUADRO|HIST[OÓ]RIA|REFERE|RELATA|INICIOU|APRESENTA|NEGA)/i.test(clean);
    detailsPart = isPrefixed ? ` ${clean.toUpperCase()}.` : ` HISTÓRIA CLÍNICA: ${clean.toUpperCase()}.`;
  }

  let body = extractHdaBody(bed.hda, paridade);
  if (!body) {
    body = generateDefaultHdaBody(bed);
  } else if (detailsPart && !body.toUpperCase().includes(rawHdaDetails.toUpperCase().slice(0, Math.min(20, rawHdaDetails.length)))) {
    body = `${body.replace(/\.+$/, '')}.${detailsPart}`;
  }

  const hdaText = `${prefixoFixo} ${body}`.trim();

  // 2. COMORBIDADES
  const comorbidadesText = bed.comorbidades || d.comorbidades || 'NEGA';

  // 3. MUC
  const mucText = bed.muc || d.muc || 'NEGA';

  // 4. ALERGIA
  let alergiaLine = 'NEGA ALERGIA';
  const rawAlergias = bed.alergias || d.alergias;
  if (rawAlergias) {
    const alUpper = rawAlergias.toUpperCase().trim();
    if (alUpper.includes('NEGA') || alUpper.includes('NÃO REFERE') || alUpper === 'NÃO') {
      alergiaLine = 'NEGA ALERGIA';
    } else if (alUpper.startsWith('ALERGIA')) {
      alergiaLine = alUpper;
    } else {
      alergiaLine = `ALERGIA: ${alUpper}`;
    }
  }

  // 5. EVOLUÇÃO (reflete o que foi marcado no checklist)
  const internment = bed.internmentDays || 1;
  const painIntensity =
    d.painLevel === '7-10' ? 'FORTE' : d.painLevel === '4-6' ? 'MODERADA' : 'LEVE';
  const hasPain = d.painLevel && d.painLevel !== '0';
  let evolucaoText = '';
  if (isPuerpera) {
    const isCesarea = d.deliveryType?.includes('cesarea');
    const dpoStr = d.postpartumDay
      ? d.postpartumDay.includes('D')
        ? `${d.postpartumDay.replace('D', '')}° DPO`
        : d.postpartumDay
      : '1° DPO';
    const dietStr =
      d.oralDiet === 'jejum'
        ? 'EM JEJUM'
        : d.oralDiet === 'pouco'
        ? 'ACEITAÇÃO PARCIAL DA DIETA'
        : d.oralDiet === 'recusando'
        ? 'RECUSANDO A DIETA'
        : 'ACEITANDO BEM A DIETA';
    const deambStr =
      d.deambulation === 'ausente'
        ? 'AINDA NÃO DEAMBULOU'
        : d.deambulation === 'com_auxilio'
        ? 'DEAMBULANDO COM AUXÍLIO'
        : 'DEAMBULANDO SEM AUXÍLIO';
    const elim: string[] = d.eliminations || [];
    const diureseStr = elim.includes('svd_em_uso')
      ? 'DIURESE POR SVD'
      : elim.includes('retencao_globo')
      ? 'RETENÇÃO URINÁRIA (GLOBO VESICAL PALPÁVEL)'
      : 'DIURESE ESPONTÂNEA PRESENTE';
    const flatosStr = elim.includes('flatos_presentes') ? 'FLATOS PRESENTES' : 'FLATOS AUSENTES';
    const evacStr = elim.includes('constipacao') ? 'EVACUAÇÕES AUSENTES' : 'EVACUAÇÕES PRESENTES';
    const queixasStr = hasPain
      ? `QUEIXA-SE DE DOR ${painIntensity} ${isCesarea ? 'EM FO' : 'EM REGIÃO PERINEAL/BAIXO VENTRE'} (EVA ${d.painLevel}/10)`
      : 'NEGA QUEIXAS NO MOMENTO';

    evolucaoText = `PACIENTE EM ${internment}° DIA DE INTERNAÇÃO DE LEITO DE ENFERMARIA E ${dpoStr} DE ${isCesarea ? 'CESÁREA' : 'PARTO NORMAL'}. ${dietStr}, ${deambStr}, ${diureseStr}, ${flatosStr}, ${evacStr}. ${queixasStr}`;
  } else if (isGestante) {
    const igStr = `${d.gestationalAge || 32} SEMANAS${d.gestationalDays ? ` E ${d.gestationalDays} DIAS` : ''}`;
    const dietStr = d.oralDiet === 'jejum' ? 'EM JEJUM' : 'ACEITANDO BEM A DIETA';
    const deambStr = d.deambulation === 'ausente' ? 'EM REPOUSO NO LEITO' : 'DEAMBULANDO SEM AUXÍLIO';
    const queixasStr = hasPain ? `QUEIXA-SE DE DOR ${painIntensity} (EVA ${d.painLevel}/10)` : 'NEGA QUEIXAS NO MOMENTO';

    evolucaoText = `PACIENTE EM ${internment}° DIA DE INTERNAÇÃO DE LEITO DE ENFERMARIA COM IG DE ${igStr}. ${dietStr}, ${deambStr}, DIURESE E FLATOS PRESENTES E EVACUAÇÕES. ${queixasStr}`;
  } else if (isCuretagem) {
    const queixasStr = hasPain
      ? `REFERE CÓLICA/DOR ${painIntensity} EM BAIXO VENTRE (EVA ${d.painLevel}/10)`
      : 'NEGA QUEIXAS NO MOMENTO';
    evolucaoText = `PACIENTE EM ${internment}° DIA DE INTERNAÇÃO DE LEITO DE ENFERMARIA EM POI DE CURETAGEM UTERINA. ACEITANDO BEM A DIETA, DEAMBULANDO SEM AUXÍLIO, DIURESE E FLATOS PRESENTES E EVACUAÇÕES. ${queixasStr}`;
  } else {
    evolucaoText = `PACIENTE EM ${internment}° DIA DE INTERNAÇÃO DE LEITO DE ENFERMARIA. ACEITANDO BEM A DIETA, DEAMBULANDO SEM AUXÍLIO, DIURESE E FLATOS PRESENTES. NEGA QUEIXAS NO MOMENTO`;
  }

  // Se houver queixas adicionais escritas registradas pela equipe:
  const rawQueixasAdicionais = bed.queixasAdicionais || d.queixasAdicionais;
  if (
    rawQueixasAdicionais &&
    rawQueixasAdicionais.trim() &&
    !rawQueixasAdicionais.toUpperCase().includes('NEGA QUEIXAS')
  ) {
    evolucaoText += ` QUEIXAS ADICIONAIS: ${rawQueixasAdicionais.trim().toUpperCase()}.`;
  }

  // 6. EXAME FÍSICO (reflete o que foi marcado no checklist)
  const estadoGeral = `BEG, CORADA, ${d.temperature === 'febril' ? 'FEBRIL' : 'AFEBRIL'}, CONSCIENTE, ORIENTADA, EUPNEICA`;
  let exameFisicoText = '';
  if (isPuerpera) {
    const isCesarea = d.deliveryType?.includes('cesarea');
    const breasts: string[] = d.breasts || [];
    let mamasStr = breasts.includes('apojadura')
      ? 'MAMAS COM APOJADURA FISIOLÓGICA'
      : breasts.includes('ingurgitamento')
      ? 'MAMAS INGURGITADAS'
      : 'MAMAS FLÁCIDAS';
    if (breasts.includes('fissura')) mamasStr += ' COM FISSURA MAMILAR';
    const abdomeStr =
      d.uterus === 'doloroso'
        ? 'ABDOME FLÁCIDO, DOLOROSO À PALPAÇÃO EM HIPOGÁSTRIO'
        : 'ABDOME FLÁCIDO, INDOLOR A PALPAÇÃO DIFUSA';
    const uteroStr =
      d.uterus === 'hipotonico'
        ? 'ÚTERO HIPOTÔNICO'
        : d.uterus === 'subinvoluido'
        ? 'ÚTERO SUBINVOLUÍDO'
        : d.uterus === 'doloroso'
        ? 'ÚTERO CONTRAÍDO, DOLOROSO À PALPAÇÃO'
        : 'ÚTERO CONTRAÍDO ABAIXO DA CICATRIZ UMBILICAL';
    let feridaStr: string;
    if (isCesarea) {
      feridaStr = d.wound === 'curativo_sangrante' ? 'FO COM CURATIVO SANGRANTE' : 'FO BOM ASPECTO';
    } else {
      feridaStr =
        d.wound === 'laceracao_suturada'
          ? 'PERÍNEO COM LACERAÇÃO SUTURADA'
          : d.wound === 'hematoma_perineal'
          ? 'HEMATOMA PERINEAL'
          : 'PERÍNEO ÍNTEGRO';
    }
    const loquiosStr =
      d.lochia === 'aumentado'
        ? 'LÓQUIOS AUMENTADOS'
        : d.lochia === 'coagulos'
        ? 'LÓQUIOS COM COÁGULOS'
        : d.lochia === 'fetido'
        ? 'LÓQUIOS FÉTIDOS'
        : 'LÓQUIOS FISIOLÓGICOS';

    exameFisicoText = `${estadoGeral}, ${mamasStr}, ${abdomeStr}, ${uteroStr}, ${feridaStr}, ${loquiosStr}, MMII SEM EDEMAS.`;
  } else if (isGestante) {
    const ig = d.gestationalAge || 32;
    const bcfTexto = ig > 14
      ? `BCF: ${d.fhrValue || 140} BPM`
      : 'BCF INAUDÍVEL AO SONAR DEVIDO IG (≤ 14 SEM)';
    const dinamicaStr = d.dynamics === 'ativo' ? 'PRESENTE' : d.dynamics === 'irregular' ? 'IRREGULAR' : 'AUSENTE';
    const tonusStr = d.uterineTone === 'hipertonia' ? 'HIPERTONIA UTERINA' : 'TÔNUS UTERINO NORMAL';
    const toqueStr =
      d.vaginalExam === 'fechado'
        ? 'TOQUE VAGINAL: COLO FECHADO'
        : d.vaginalExam === 'dilatando'
        ? 'TOQUE VAGINAL: COLO EM DILATAÇÃO'
        : 'TOQUE VAGINAL NÃO REALIZADO';

    if (ig >= 20) {
      const perdasMap: Record<string, string> = {
        ausente: 'AUSENTES',
        tampao: 'TAMPÃO MUCOSO',
        liquido_claro: 'LÍQUIDO CLARO',
        liquido_meconial: 'LÍQUIDO MECONIAL',
        sangramento: 'SANGRAMENTO VAGINAL ATIVO'
      };
      const perdasStr = perdasMap[d.vaginalLosses] || 'AUSENTES';
      const edemasStr = d.edema === 'ausente' || !d.edema ? 'SEM EDEMAS' : `COM EDEMA ${d.edema}`;

      exameFisicoText = `${estadoGeral}, ABDOME FLÁCIDO, INDOLOR A PALPAÇÃO DIFUSA, DINÂMICA UTERINA ${dinamicaStr}, ${tonusStr}, ${bcfTexto}, ${toqueStr}, MMII ${edemasStr}, PERDAS VAGINAIS: ${perdasStr}.`;
    } else {
      const forroStr = d.vaginalLosses === 'sangramento' ? 'FORRO VAGINAL COM SANGRAMENTO ATIVO' : 'FORRO VAGINAL SEM SANGRAMENTO';
      exameFisicoText = `${estadoGeral}, ABDOME FLÁCIDO, INDOLOR A PALPAÇÃO DIFUSA, ${bcfTexto}, ${toqueStr}, ${forroStr}, MMII SEM EDEMAS.`;
    }
  } else if (isCuretagem) {
    const sangrStr = d.bleeding === 'ausente' ? 'AUSENTE' : d.bleeding?.toUpperCase() || 'LEVE';
    exameFisicoText = `${estadoGeral}, ABDOME FLÁCIDO, INDOLOR A PALPAÇÃO DIFUSA, FORRO VAGINAL SANGRAMENTO ${sangrStr}, MMII SEM EDEMAS.`;
  } else {
    exameFisicoText = `${estadoGeral}, ABDOME FLÁCIDO, INDOLOR A PALPAÇÃO DIFUSA, MMII SEM EDEMAS.`;
  }

  // 7. SSVV (PA, TX, FC) — valores NÃO aferidos saem como "___" para preenchimento, nunca inventados
  const bpRaw = getBedBP(bed);
  const bpEval = parseAndEvaluateBP(bpRaw);
  const bpFormatted = bpEval.shortFormatted
    ? `${bpEval.shortFormatted.toUpperCase()}MMHG`
    : bpRaw
    ? `${bpRaw.toUpperCase().replace('/', 'X')}MMHG`
    : '___X___MMHG';
  const tempValue = String(d.temperatureValue ?? '').trim();
  const txFormatted = tempValue
    ? `${tempValue.replace('.', ',')}°C`
    : d.temperature === 'febril'
    ? '___°C (FEBRIL)'
    : '___°C';
  const fcValue = String(d.heartRate ?? '').trim();
  const fcFormatted = fcValue ? `${fcValue} BPM` : '___ BPM';

  const ssvvLine = `PA ${bpFormatted}, TX ${txFormatted}, FC ${fcFormatted},`;

  // 8. EXAMES COMPLEMENTARES — só o que foi realmente registrado
  let examesLabText = (bed.examesLabText || '').trim();
  if (!examesLabText) {
    const lab = d.labExams || {};
    const trLabel = (v?: string) =>
      v === 'reagente' ? 'REAGENTE' : v === 'nao_reagente' ? 'NÃO REAGENTE' : v === 'pendente' ? 'PENDENTE' : '';
    const parts: string[] = [];
    if (lab.hb) parts.push(`HB: ${lab.hb}`);
    if (lab.ht) parts.push(`HT: ${lab.ht}`);
    if (lab.leuco) parts.push(`LEUCO: ${lab.leuco}`);
    if (lab.plaq) parts.push(`PLAQ: ${lab.plaq}`);
    if (lab.tipagemMae) parts.push(`TS: ${lab.tipagemMae}`);
    if (trLabel(lab.trSifilis)) parts.push(`TR SÍFILIS: ${trLabel(lab.trSifilis)}`);
    if (lab.vdrl) parts.push(`VDRL: ${lab.vdrl}`);
    if (trLabel(lab.trHiv)) parts.push(`HIV: ${trLabel(lab.trHiv)}`);
    if (trLabel(lab.trHepatites)) parts.push(`HEPATITES: ${trLabel(lab.trHepatites)}`);
    examesLabText = parts.length > 0 ? `LAB: ${parts.join('| ')}` : 'SEM EXAMES REGISTRADOS ATÉ O MOMENTO';
  }

  // 9. HD (HIPÓTESE DIAGNÓSTICA)
  let defaultHd = 'GESTAÇÃO TÓPICA';
  if (isPuerpera) {
    defaultHd = 'PUERPÉRIO PÓS PARTO';
  } else if (isCuretagem) {
    defaultHd = 'ABORTO INCOMPLETO';
  } else if (isGestante) {
    const motivosHd = (d.admissionReason || []).map(formatAdmissionReason).filter(Boolean);
    defaultHd = motivosHd.length > 0
      ? `GESTAÇÃO TÓPICA + ${motivosHd.join(' + ')}`
      : 'GESTAÇÃO TÓPICA';
  }

  const hdText = bed.hdText || bed.diagnosis?.toUpperCase() || defaultHd;

  // 10. CONDUTA
  const isVaginal = d.deliveryType === 'vaginal' || d.deliveryType === 'forceps';
  const isPast24hVaginal = isVaginal && (d.postpartumDay === 'D1' || d.postpartumDay === 'D2' || d.postpartumDay === 'D3+');
  const isPast48hCesarea = !isVaginal && (d.postpartumDay === 'D2' || d.postpartumDay === 'D3+');
  // Impedimentos clínicos: NÃO sugerir alta automaticamente se houver qualquer um deles
  const elimsAlta: string[] = d.eliminations || [];
  const clinicalBlockers =
    bpEval.isHypertensiveCrisis ||
    bpEval.isElevated ||
    bpEval.isHypotensive ||
    d.uterus === 'hipotonico' ||
    d.uterus === 'subinvoluido' ||
    d.uterus === 'doloroso' ||
    d.lochia === 'fetido' ||
    d.lochia === 'aumentado' ||
    d.lochia === 'coagulos' ||
    d.temperature === 'febril' ||
    d.wound === 'curativo_sangrante' ||
    d.wound === 'hematoma_perineal' ||
    d.painLevel === '7-10' ||
    elimsAlta.includes('retencao_globo');
  // Regra do posto: só vai de alta com hemograma, testes rápidos e tipagem sanguínea
  const labAlta = d.labExams || {};
  const pendenciasAlta: string[] = [];
  if (isPuerpera) {
    const hasHemograma = Boolean(labAlta.hb) || /\bHB\s*:?\s*\d/i.test(bed.examesLabText || '');
    if (!hasHemograma) pendenciasAlta.push('HEMOGRAMA');
    if (!labAlta.trSifilis || labAlta.trSifilis === 'pendente') pendenciasAlta.push('TR SÍFILIS');
    if (d.rhScreening === 'nao_aplica' && !labAlta.tipagemMae) pendenciasAlta.push('TIPAGEM SANGUÍNEA');
  }
  const isEligibleForDischarge =
    isPuerpera && (isPast24hVaginal || isPast48hCesarea) && !clinicalBlockers && pendenciasAlta.length === 0;

  let condutaText = bed.condutaText;
  if (!condutaText) {
    if (bpEval.isHypertensiveCrisis) {
      condutaText = `SUPORTE CLÍNICO\nPROTOCOLO ZUSPAN / SULFATO DE MAGNÉSIO\nHIDRALAZINA 5MG EV SE PAS>=160 OU PAD>=110\nCONTROLE DE PA DE 1/1H\nSOLICITO LAB DE ROTINA`;
    } else if (bpEval.isElevated) {
      condutaText = `SUPORTE CLÍNICO\nCONTROLE DE PA DE 4/4H\nAVALIAR METILDOPA\nPESQUISA DE SINAIS DE IMINÊNCIA\nSOLICITO LAB`;
    } else if (isPuerpera) {
      const altaLinha = isEligibleForDischarge ? 'ALTA HOSPITALAR COM ORIENTAÇÕES' : 'AVALIAR ALTA';
      const pendLinha = pendenciasAlta.length > 0 ? `\nPENDENTE PARA ALTA: ${pendenciasAlta.join(', ')}` : '';
      condutaText = `SUPORTE CLÍNICO\nPRESCRIÇÃO ORAL\nOBSERVAR SANGRAMENTO VAGINAL\n${altaLinha}${pendLinha}`;
    } else if (isGestante) {
      const ig = d.gestationalAge || 32;
      const bcfLinha = ig > 14 ? ' E BCF DE 6/6H' : ' DE 6/6H';
      condutaText = `SUPORTE CLÍNICO\nCONTROLE DE SSVV${bcfLinha}\nSOLICITO LAB\nAVALIAR EVOLUÇÃO CLÍNICA`;
    } else {
      condutaText = `SUPORTE CLÍNICO\nOBSERVAR FORRO VAGINAL\nALTA HOSPITALAR COM ORIENTAÇÕES`;
    }
  } else if (isEligibleForDischarge && /AVALIAR ALTA/i.test(condutaText)) {
    // Atualiza automaticamente texto genérico antigo "AVALIAR ALTA" para "ALTA HOSPITALAR COM ORIENTAÇÕES"
    condutaText = condutaText.replace(/AVALIAR ALTA/gi, 'ALTA HOSPITALAR COM ORIENTAÇÕES');
  }

  // MONTAGEM FINAL DO TEXTO (100% FIEL AO MODELO DO USUÁRIO)
  const output = `HDA: ${hdaText}

COMORBIDADES: ${comorbidadesText}
MUC: ${mucText}
${alergiaLine}

EVOLUÇÃO: ${evolucaoText}

EXAME FÍSICO: ${exameFisicoText}

${ssvvLine}


EXAMES COMPLEMENTARES:
${examesLabText}

HD: ${hdText}

CONDUTA:
${condutaText}`;

  return output;
};

export const generateDischargePaperwork = (bed: Bed): string => {
  if (!bed || bed.type === 'vago') return 'Selecione um leito ocupado para gerar a documentação de alta.';

  const today = new Date().toLocaleDateString('pt-BR');
  const lines: string[] = [];

  lines.push(`HOSPITAL MATERNIDADE - GUIA DE ALTA HOSPITALAR & RECEITUÁRIO`);
  lines.push(`PACIENTE: ${bed.patientName} | LEITO: ${bed.label} | DATA DE ALTA: ${today}`);
  lines.push(`--------------------------------------------------------------------------------`);

  const d = bed.data || {};
  const atestadoPac = d.atestadoPaciente || bed.atestadoPaciente || 'nao';
  const atestadoPacDias = d.atestadoPacienteDias || bed.atestadoPacienteDias || '';
  const atestadoAcomp = d.atestadoAcompanhante || bed.atestadoAcompanhante || 'nao';
  const acompNome = d.atestadoAcompanhanteNome || bed.atestadoAcompanhanteNome || '';
  const acompDias = d.atestadoAcompanhanteDias || bed.atestadoAcompanhanteDias || '';

  lines.push(`DOCUMENTOS A IMPRIMIR CONFORME PROTOCOLO:`);
  lines.push(`[ ] 1. Evolução e Prescrição (1 via)`);
  lines.push(`[ ] 2. SUMÁRIO DE ALTA (2 vias)`);
  lines.push(`[ ] 3. Receituário Médico (1 via)`);

  if (atestadoPac === 'sim') {
    lines.push(`[X] 4. Atestado Médico da Paciente (1 via) - SIM (${atestadoPacDias || 'Dias a preencher'})`);
  } else if (atestadoPac === 'licenca_maternidade') {
    lines.push(`[X] 4. Licença Maternidade da Paciente (1 via) - SIM (120 dias)`);
  } else {
    lines.push(`[ ] 4. Atestado Médico da Paciente - NÃO NECESSITA`);
  }

  if (atestadoAcomp === 'sim') {
    const acompDesc = [acompNome, acompDias || 'Período de internação'].filter(Boolean).join(' - ');
    lines.push(`[X] 5. Atestado / Declaração de Acompanhante (1 via) - SIM (${acompDesc})`);
  } else {
    lines.push(`[ ] 5. Atestado de Acompanhante - NÃO NECESSITA`);
  }

  lines.push(`[ ] 6. Folha de Orientações da Puérpera/Paciente (1 via)`);

  lines.push(`\nRECEITUÁRIO DE MEDICAMENTOS (USO ORAL):`);
  const typeKey = bed.type === 'curetagem' ? 'curetagem' : (bed.data?.deliveryType?.includes('cesarea') ? 'cesarea' : 'partoNormal');
  const rxItems = DISCHARGE_PRESCRIPTIONS[typeKey] || DISCHARGE_PRESCRIPTIONS.cesarea;
  rxItems.forEach((rx) => lines.push(rx));

  lines.push(`\nORIENTAÇÕES DE ALTA HOSPITALAR:`);
  const guideItems = DISCHARGE_GUIDELINES[typeKey] || DISCHARGE_GUIDELINES.cesarea;
  guideItems.forEach((g) => lines.push(g));

  lines.push(`--------------------------------------------------------------------------------`);
  lines.push(`Assinatura e Carimbo Médico: ________________________________ CRM: ___________`);
  return lines.join('\n');
};
