export type Sector = 'enf_08' | 'enf_09' | 'enf_10' | 'enf_11' | 'especiais' | 'outro';

export type BedType = 'puerpera' | 'gestante' | 'curetagem' | 'vago';

export interface PuerperaData {
  deliveryType: 'vaginal' | 'forceps' | 'cesarea_eletiva' | 'cesarea_urgencia';
  deliveryDate?: string;
  deliveryTime?: string;
  postpartumDay: 'D0' | 'D1' | 'D2' | 'D3+';
  breasts: string[]; // 'flacidas', 'apojadura', 'ingurgitamento', 'fissura', 'pega_ok', 'pega_dificil'
  uterus: 'contraido' | 'hipotonico' | 'subinvoluido' | 'doloroso';
  lochia: 'fisiologico' | 'aumentado' | 'coagulos' | 'fetido';
  wound: 'curativo_limpo' | 'curativo_sangrante' | 'perineo_integro' | 'laceracao_suturada' | 'hematoma_perineal';
  eliminations: string[]; // 'diurese_espontanea', 'retencao_globo', 'svd_em_uso', 'retirar_svd', 'flatos_presentes', 'constipacao', 'acesso_pervio', 'suspender_venoclise'
  deambulation: 'presente' | 'ausente' | 'com_auxilio';
  oralDiet: 'aceitando_bem' | 'pouco' | 'recusando' | 'jejum';
  painLevel: '0' | '1-3' | '4-6' | '7-10';
  tevRisk: 'baixo' | 'alto';
  rhScreening: 'rh_pos' | 'rh_neg_rn_pos' | 'nao_aplica';
  temperature: 'afebril' | 'febril';
  bloodPressure: string;
  heartRate: string;
  obstetricHistory?: string; // ex: 'G03P03(n03 C 00)A00'
  labExams: {
    hb?: string;
    ht?: string;
    leuco?: string;
    plaq?: string;
    trSifilis?: 'nao_reagente' | 'reagente' | 'pendente';
    trHiv?: 'nao_reagente' | 'reagente' | 'pendente';
    trHepatites?: 'nao_reagente' | 'reagente' | 'pendente';
    tipagemMae?: string;
    tipagemBebe?: string;
    vdrl?: string;
  };
  atestadoPaciente?: 'nao' | 'sim' | 'licenca_maternidade';
  atestadoPacienteDias?: string;
  atestadoAcompanhante?: 'nao' | 'sim';
  atestadoAcompanhanteNome?: string;
  atestadoAcompanhanteDias?: string;
  alergias?: string;
  alergiaStatus?: 'nao' | 'sim';
  comorbidades?: string;
  muc?: string;
  queixasAdicionais?: string;
  hdaDetails?: string;
  customNotes: string;
}

export interface GestanteData {
  gestationalAge: number; // 1 - 42 semanas
  gestationalDays?: number; // 0 - 6 dias
  gestationalAgeMethod?: 'DUM' | 'USG' | 'Alegada'; // Método da IG
  gestationalAgeText?: string; // ex: '8s3d' ou texto livre alegado
  admissionReason: string[]; // 'ameaca_tpp', 'tp_latente', 'tp_ativo', 'ruprema', 'hipertensao', 'dmg', 'itu_pielonefrite', 'dor_abdominal'
  bloodPressure: 'normal' | 'elevada' | 'grave'; // normal (<140/90), elevada (>=140/90), grave (PAS>=160 ou PAD>=110)
  bpValue: string; // ex: '120/80'
  imminenceSigns: string[]; // 'cefaleia', 'escotomas', 'epigastralgia'
  fetalVitality: 'bcf_normal' | 'bcf_anormal' | 'mov_ativo';
  fhrValue: number; // 110 - 160
  uterineTone: 'normal' | 'hipertonia';
  dynamics: 'ausente' | 'irregular' | 'ativo';
  vaginalLosses: 'ausente' | 'tampao' | 'liquido_claro' | 'liquido_meconial' | 'sangramento';
  edema: 'ausente' | '1+' | '2+' | '3+' | '4+';
  vaginalExam: 'nao_realizado' | 'fechado' | 'dilatando';
  painLevel: '0' | '1-3' | '4-6' | '7-10';
  obstetricHistory?: string; // ex: 'G03P03(n03 C 00)A00'
  atestadoPaciente?: 'nao' | 'sim' | 'licenca_maternidade';
  atestadoPacienteDias?: string;
  atestadoAcompanhante?: 'nao' | 'sim';
  atestadoAcompanhanteNome?: string;
  atestadoAcompanhanteDias?: string;
  alergias?: string;
  alergiaStatus?: 'nao' | 'sim';
  comorbidades?: string;
  muc?: string;
  queixasAdicionais?: string;
  hdaDetails?: string;
  customNotes: string;
}

export interface CuretagemData {
  admissionReason: string;
  curetageDate: string;
  curetageTime: string;
  anesthesia: string; // 'Raquianestesia', etc.
  bleeding: 'ausente' | 'leve' | 'moderado' | 'intenso';
  bloodPressure?: string; // ex: '120/80'
  heartRate?: string;
  painLevel: '0' | '1-3' | '4-6' | '7-10';
  obstetricHistory?: string; // ex: 'G03P03(n03 C 00)A00'
  atestadoPaciente?: 'nao' | 'sim' | 'licenca_maternidade';
  atestadoPacienteDias?: string;
  atestadoAcompanhante?: 'nao' | 'sim';
  atestadoAcompanhanteNome?: string;
  atestadoAcompanhanteDias?: string;
  alergias?: string;
  alergiaStatus?: 'nao' | 'sim';
  comorbidades?: string;
  muc?: string;
  queixasAdicionais?: string;
  hdaDetails?: string;
  customNotes: string;
}

export interface RNData {
  feeding: 'AMEX' | 'LML' | 'FI' | 'SNG';
  physiologicalEliminations: boolean;
  heartTest: 'ok' | 'agendado' | 'nao_aplica';
  heartTestDate?: string;
  weight?: string;
  vdrlStatus?: 'coletado' | 'pendente' | 'nao_aplica';
  notes?: string;
}

export interface Bed {
  id: number;
  label: string; // ex: '08/01', '08/02', 'LÍRIO 01', 'UCINCO 1'
  sector: Sector;
  patientName: string;
  age: string; // ex: '28a' ou '16d'
  admissionDate: string;
  admissionTime: string;
  diagnosis: string;
  type: BedType;
  isReviewed: boolean;
  avpSite: string; // ex: 'MSD', 'MSE', 'Sem acesso'
  avpDate: string; // ex: '18/09'
  pendencias: string;
  intercorrencias: string;
  obstetricHistory?: string; // ex: 'G03P03(n03 C 00)A00'
  bloodPressure?: string; // ex: '120/80' ou '160x111'
  atestadoPaciente?: 'nao' | 'sim' | 'licenca_maternidade';
  atestadoPacienteDias?: string;
  atestadoAcompanhante?: 'nao' | 'sim';
  atestadoAcompanhanteNome?: string;
  atestadoAcompanhanteDias?: string;
  // Campos da Evolução Médica (conforme modelo evolucao.txt)
  hda?: string;
  hdaDetails?: string;
  comorbidades?: string;
  muc?: string;
  alergias?: string;
  alergiaStatus?: 'nao' | 'sim';
  queixasAdicionais?: string;
  internmentDays?: number;
  examesLabText?: string;
  hdText?: string;
  condutaText?: string;
  rn?: RNData;
  /** Carimbo de tempo da última versão recebida do servidor (controle de sincronização). */
  updatedAt?: string;
  data: PuerperaData | GestanteData | CuretagemData | any;
}
