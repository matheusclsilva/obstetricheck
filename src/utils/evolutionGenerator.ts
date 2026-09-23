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

  if (isPuerpera) {
    const isCesarea = d.deliveryType?.includes('cesarea');
    const partoTipo = isCesarea ? 'CESÁRIA' : 'PARTO NORMAL';
    const dataParto = d.deliveryDate || bed.admissionDate || new Date().toLocaleDateString('pt-BR');
    const dataEntrada = bed.admissionDate || dataParto;
    const horaEntrada = bed.admissionTime ? ` ÀS ${bed.admissionTime}` : '';
    const queixas = bed.intercorrencias ? `, A ${bed.intercorrencias.toUpperCase()}` : '';

    return `EM ${dataParto} DE PÓS ${partoTipo}, DEU ENTRADA AO SERVIÇO EM ${dataEntrada}${horaEntrada}${queixas}${bpPart}${sulfatadaPart}`;
  } else if (isGestante) {
    const igStr = `${d.gestationalAge || 32} SEMANAS${d.gestationalDays ? ` E ${d.gestationalDays} DIAS` : ''}`;
    const dataEntrada = bed.admissionDate || new Date().toLocaleDateString('pt-BR');
    const horaEntrada = bed.admissionTime ? ` ÀS ${bed.admissionTime}` : '';
    const motivo = d.admissionReason?.join(', ').toUpperCase() || bed.diagnosis?.toUpperCase() || 'QUADRO OBSTÉTRICO';
    const queixas = d.imminenceSigns?.length ? ` REFERINDO ${d.imminenceSigns.join(' E ').toUpperCase()}` : '';

    return `GESTANTE COM IG DE ${igStr} (${d.gestationalAgeMethod || 'ALEGADA'}), DEU ENTRADA AO SERVIÇO EM ${dataEntrada}${horaEntrada} POR ${motivo}${queixas}${bpPart}${sulfatadaPart}`;
  } else if (isCuretagem) {
    const dataEntrada = bed.admissionDate || new Date().toLocaleDateString('pt-BR');
    const horaEntrada = bed.admissionTime ? ` ÀS ${bed.admissionTime}` : '';
    return `ADMITIDA EM ${dataEntrada}${horaEntrada} DEVIDO QUADRO DE ABORTAMENTO INCOMPLETO. SUBMETIDA A CURETAGEM UTERINA SOB RAQUIANESTESIA.`;
  } else {
    return `INTERNADA NO LEITO ${bed.label} EM ${bed.admissionDate || 'DATA NÃO INFORMADA'}.`;
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

  let body = extractHdaBody(bed.hda, paridade);
  if (!body) {
    body = generateDefaultHdaBody(bed);
  }

  const hdaText = `${prefixoFixo} ${body}`.trim();

  // 2. COMORBIDADES
  const comorbidadesText = bed.comorbidades || 'NEGA';

  // 3. MUC
  const mucText = bed.muc || 'NEGA';

  // 4. ALERGIA
  let alergiaLine = 'NEGA ALERGIA';
  if (bed.alergias) {
    const alUpper = bed.alergias.toUpperCase();
    if (alUpper.includes('NEGA')) {
      alergiaLine = 'NEGA ALERGIA';
    } else if (alUpper.startsWith('ALERGIA')) {
      alergiaLine = alUpper;
    } else {
      alergiaLine = `ALERGIA: ${alUpper}`;
    }
  }

  // 5. EVOLUÇÃO
  const internment = bed.internmentDays || 1;
  let evolucaoText = '';
  if (isPuerpera) {
    const isCesarea = d.deliveryType?.includes('cesarea');
    const dpoStr = d.postpartumDay
      ? d.postpartumDay.includes('D')
        ? `${d.postpartumDay.replace('D', '')}° DPO`
        : d.postpartumDay
      : '1° DPO';
    const dietStr = d.oralDiet === 'jejum' ? 'EM JEJUM' : 'ACEITANDO BEM A DIETA';
    const deambStr = d.deambulation === 'ausente' ? 'AINDA NÃO DEAMBULOU' : 'DEAMBULANDO SEM AUXILIO';
    const elimStr = d.eliminations?.includes('svd_em_uso')
      ? 'DIURESE POR SVD, FLATOS PRESENTES E EVACUAÇÕES'
      : 'DIURESE E FLATOS PRESENTE E EVACUAÇÕES';
    const queixasStr = d.painLevel === '0' ? 'NEGA QUEIXAS NO MOMENTO' : `QUEIXA-SE DE DOR LEVE/MODERADA EM FO (EVA ${d.painLevel}/10)`;

    evolucaoText = `PACIENTE EM ${internment}° DIA DE INTERNAÇÃO DE LEITO DE ENFERMARIA E ${dpoStr} DE ${isCesarea ? 'CASÁRIA' : 'PARTO NORMAL'}. ${dietStr}, ${deambStr}, ${elimStr}. ${queixasStr}`;
  } else if (isGestante) {
    const igStr = `${d.gestationalAge || 32} SEMANAS${d.gestationalDays ? ` E ${d.gestationalDays} DIAS` : ''}`;
    const dietStr = d.oralDiet === 'jejum' ? 'EM JEJUM' : 'ACEITANDO BEM A DIETA';
    const deambStr = d.deambulation === 'ausente' ? 'EM REPOUSO NO LEITO' : 'DEAMBULANDO SEM AUXILIO';
    const queixasStr = d.painLevel === '0' ? 'NEGA QUEIXAS NO MOMENTO' : 'QUEIXAS ÁLGICAS LEVES';

    evolucaoText = `PACIENTE EM ${internment}° DIA DE INTERNAÇÃO DE LEITO DE ENFERMARIA COM IG DE ${igStr}. ${dietStr}, ${deambStr}, DIURESE E FLATOS PRESENTE E EVACUAÇÕES. ${queixasStr}`;
  } else if (isCuretagem) {
    evolucaoText = `PACIENTE EM ${internment}° DIA DE INTERNAÇÃO DE LEITO DE ENFERMARIA EM POI DE CURETAGEM UTERINA. ACEITANDO BEM A DIETA, DEAMBULANDO SEM AUXILIO, DIURESE E FLATOS PRESENTE E EVACUAÇÕES. NEGA QUEIXAS NO MOMENTO`;
  } else {
    evolucaoText = `PACIENTE EM ${internment}° DIA DE INTERNAÇÃO DE LEITO DE ENFERMARIA. ACEITANDO BEM A DIETA, DEAMBULANDO SEM AUXILIO, DIURESE E FLATOS PRESENTE. NEGA QUEIXAS NO MOMENTO`;
  }

  // 6. EXAME FÍSICO
  let exameFisicoText = '';
  if (isPuerpera) {
    const isCesarea = d.deliveryType?.includes('cesarea');
    const mamasStr = d.breasts?.includes('apojadura')
      ? 'MAMAS COM APOJADURA FISIOLÓGICA'
      : d.breasts?.includes('ingurgitamento')
      ? 'MAMAS INGURGITADAS'
      : 'MAMAS FLÁCIDAS';
    const foStr = isCesarea ? 'FO BOM ASPECTO' : 'PERÍNEO ÍNTEGRO';
    const loquiosStr = d.lochia === 'aumentado' ? 'LÓQUIOS AUMENTADOS' : d.lochia === 'fetido' ? 'LÓQUIOS FÉTIDOS' : 'LÓQUIOS FISIOLÓGICOS';

    exameFisicoText = `BEG, CORADA, AFEBRIL, CONSCIENTE, ORIENTADA, EUPNEICA, ${mamasStr}, ABDOME FLÁCIDO, INDOLOR A PALPAÇÃO DIFUSA, ÚTERO CONTRAÍDO ABAIXO DA CICATRIZ UMBILICAL, ${foStr}, ${loquiosStr}, MMII SEM EDEMAS.`;
  } else if (isGestante) {
    if ((d.gestationalAge || 32) >= 20) {
      const dinamicaStr = d.dynamics === 'ativo' ? 'PRESENTE' : d.dynamics === 'irregular' ? 'IRREGULAR' : 'AUSENTE';
      const perdasStr = d.vaginalLosses === 'sangramento' ? 'COM SANGRAMENTO VAGINAL ATIVO' : d.vaginalLosses === 'liquido_claro' ? 'LÍQUIDO CLARO' : 'AUSENTES';
      const edemasStr = d.edema === 'ausente' || !d.edema ? 'SEM EDEMAS' : `COM EDEMA ${d.edema}`;

      exameFisicoText = `BEG, CORADA, AFEBRIL, CONSCIENTE, ORIENTADA, EUPNEICA, ABDOME FLÁCIDO, INDOLOR A PALPAÇÃO DIFUSA, DINÂMICA UTERINA ${dinamicaStr}, TÔNUS UTERINO NORMAL, BCF: ${d.fhrValue || 140} BPM, TOQUE VAGINAL NÃO REALIZADO, MMII ${edemasStr}, PERDAS VAGINAIS ${perdasStr}.`;
    } else {
      const perdasStr = d.vaginalLosses === 'sangramento' ? 'SANGRAMENTO VAGINAL ATIVO' : 'AUSENTES';
      exameFisicoText = `BEG, CORADA, AFEBRIL, CONSCIENTE, ORIENTADA, EUPNEICA, ABDOME FLÁCIDO, INDOLOR A PALPAÇÃO DIFUSA, DINÂMICA UTERINA AUSENTE, TÔNUS NORMAL, BCF: ${d.fhrValue || 140} BPM, FORRO VAGINAL COM SANGRAMENTO ${perdasStr}, MMII SEM EDEMAS.`;
    }
  } else if (isCuretagem) {
    const sangrStr = d.bleeding === 'ausente' ? 'AUSENTE' : d.bleeding?.toUpperCase() || 'LEVE';
    exameFisicoText = `BEG, CORADA, AFEBRIL, CONSCIENTE, ORIENTADA, EUPNEICA, ABDOME FLÁCIDO, INDOLOR A PALPAÇÃO DIFUSA, FORRO VAGINAL SANGRAMENTO ${sangrStr}, MMII SEM EDEMAS.`;
  } else {
    exameFisicoText = `BEG, CORADA, AFEBRIL, CONSCIENTE, ORIENTADA, EUPNEICA, ABDOME FLÁCIDO, INDOLOR A PALPAÇÃO DIFUSA, MMII SEM EDEMAS.`;
  }

  // 7. SSVV (PA, TX, FC)
  const bpRaw = getBedBP(bed);
  const bpEval = parseAndEvaluateBP(bpRaw);
  const bpFormatted = bpEval.shortFormatted
    ? `${bpEval.shortFormatted.toUpperCase()}MMHG`
    : `${bpRaw.replace('/', 'X')}MMHG`;
  const txFormatted = d.temperature === 'febril' ? '38,0°C' : '36,4°C';
  const fcFormatted = `${d.heartRate || '60'} BPM`;

  const ssvvLine = `PA ${bpFormatted}, TX ${txFormatted}, FC ${fcFormatted},`;

  // 8. EXAMES COMPLEMENTARES
  let examesLabText = bed.examesLabText;
  if (!examesLabText) {
    const todayShort = new Date().toLocaleDateString('pt-BR');
    if (d.labExams?.hb) {
      examesLabText = `LAB ${todayShort}: HB: ${d.labExams.hb}| HT: ${d.labExams.ht || '32'}| LEUCO: ${d.labExams.leuco || '9.980'}| PLAQ: ${d.labExams.plaq || '201.000'}| TS: ${d.labExams.tipagemMae || 'O+'}| TR SÍFILIS: ${d.labExams.trSifilis?.toUpperCase() || 'NÃO REAGENTE'}`;
    } else {
      examesLabText = `LAB ${todayShort}: HB: 11,3| HT: 32| LEUCO: 9.980| PLAQ: 201.000| TS: O+| SÍFILIS: NÃO REAGENTE| HIV: NÃO REAGENTE`;
    }
  }

  // 9. HD (HIPÓTESE DIAGNÓSTICA)
  const hdText = bed.hdText || bed.diagnosis?.toUpperCase() || (isPuerpera ? 'PUERPÉRIO PÓS PARTO' : isGestante ? 'GESTAÇÃO TÓPICA' : 'ABORTO INCOMPLETO');

  // 10. CONDUTA
  let condutaText = bed.condutaText;
  if (!condutaText) {
    if (bpEval.isHypertensiveCrisis) {
      condutaText = `SUPORTE CLÍNICO\nPROTOCOLO ZUSPAN / SULFATO DE MAGNÉSIO\nHIDRALAZINA 5MG EV SE PAS>=160 OU PAD>=110\nCONTROLE DE PA DE 1/1H\nSOLICITO LAB DE ROTINA`;
    } else if (bpEval.isElevated) {
      condutaText = `SUPORTE CLÍNICO\nCONTROLE DE PA DE 4/4H\nAVALIAR METILDOPA\nPESQUISA DE SINAIS DE IMINÊNCIA\nSOLICITO LAB`;
    } else if (isPuerpera) {
      condutaText = `SUPORTE CLÍNICO\nPRESCRIÇÃO ORAL\nOBSERVAR SANGRAMENTO VAGINAL\nAVALIAR ALTA`;
    } else if (isGestante) {
      condutaText = `SUPORTE CLÍNICO\nCONTROLE DE SSVV E BCF DE 4/4H\nSOLICITO LAB\nAVALIAR EVOLUÇÃO CLÍNICA`;
    } else {
      condutaText = `SUPORTE CLÍNICO\nOBSERVAR FORRO VAGINAL\nORIENTAÇÕES DE ALTA`;
    }
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

  lines.push(`DOCUMENTOS A IMPRIMIR CONFORME PROTOCOLO:`);
  lines.push(`[ ] 1. Evolução e Prescrição (1 via)`);
  lines.push(`[ ] 2. SUMÁRIO DE ALTA (2 vias)`);
  lines.push(`[ ] 3. Receituário Médico (1 via)`);
  lines.push(`[ ] 4. Atestado Médico ou Licença Maternidade (1 via)`);
  lines.push(`[ ] 5. Folha de Orientações da Puérpera (1 via)`);

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
