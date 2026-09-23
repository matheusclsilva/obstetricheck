export interface ProtocolRule {
  title: string;
  items: string[];
}

export const HOSPITAL_PROTOCOLS: Record<string, ProtocolRule> = {
  altaDocs: {
    title: 'Documentos Obrigatórios na Alta Hospitalar',
    items: [
      'Evolução e Prescrição Médica (1 via)',
      'Sumário de Alta Hospitalar (2 vias)',
      'Receituário de Medicamentos (1 via)',
      'Atestado Médico / Licença Maternidade (1 via)',
      'Orientações de Alta Puerperal (1 via)'
    ]
  },
  puerperioGeral: {
    title: 'Diretrizes Clínicas do Posto',
    items: [
      'Liberar dieta após 6 horas da cesariana.',
      'Dieta liberada imediatamente após o parto normal.',
      'Sentar a paciente e retirar a SVD 12 horas após a cesariana.',
      'No 1º pós-operatório (D1), TODA medicação deve ser prescrita por via ORAL.',
      'Previsão de alta hospitalar: após 48h para Cesariana e após 24h para Parto Normal.',
      'Critério de alta: Paciente só pode receber alta com Hemograma, Testes Rápidos e Tipagem Sanguínea realizados.'
    ]
  },
  antiD: {
    title: 'Profilaxia Anti-D (Mãe Rh Negativo com RN Rh Positivo)',
    items: [
      'Nome no sistema: MATERGAN',
      'Prescrição padrão: Fazer 1 ampola, IM, AGORA (em até 72h pós-parto).'
    ]
  },
  sifilis: {
    title: 'Rastreio de Sífilis',
    items: [
      'Se Teste Rápido (TR) Sífilis Reagente: Solicitar VDRL quantitativo imediatamente.',
      'Notificar e iniciar esquema de Penicilina Benzatina / Cristalina para o binômio.'
    ]
  },
  emergenciaPressorica: {
    title: 'Protocolo de Hipertensão Grave',
    items: [
      'Se PAS > 160 mmHg ou PAD > 110 mmHg: CHAMAR IMEDIATAMENTE O PLANTONISTA.',
      'Questionar e preparar para Sulfatação (Protocolo Zuspan - Sulfato de Magnésio).'
    ]
  }
};

export const DISCHARGE_PRESCRIPTIONS = {
  cesarea: [
    '1. DIPIRONA 500MG ----------------------------- 01 CX\n   Tomar 01 comprimido VO de 6/6h se dor.',
    '2. IBUPROFENO 600MG -------------------------- 01 CX\n   Tomar 01 comprimido VO de 8/8h por 03 dias.',
    '3. LUFTAL (SIMETICONA) ---------------------- 01 CX\n   Tomar 01 comprimido ou 40 gotas VO de 8/8h por 03 dias.',
    '4. SULFATO FERROSO 200MG -------------------- 90 COMP\n   Tomar 01 comprimido VO 1x ao dia por 90 dias.'
  ],
  partoNormal: [
    '1. DIETA GERAL LAXATIVA',
    '2. DIPIRONA 500MG ----------------------------- 01 CX\n   Tomar 01 comprimido VO de 6/6h se dor.',
    '3. IBUPROFENO 600MG -------------------------- 01 CX\n   Tomar 01 comprimido VO de 8/8h por 03 dias.',
    '4. SULFATO FERROSO 40MG --------------------- 90 COMP\n   Tomar 01 comprimido VO 1x ao dia por 90 dias.',
    '5. OBSERVAR SANGRAMENTO VAGINAL',
    '6. CONTROLE DE SSVV + CCGG'
  ],
  curetagem: [
    '1. DIPIRONA 1G ------------------------------- 01 CX\n   Tomar 01 comprimido VO de 6/6h se dor.',
    '2. SULFATO FERROSO 200MG -------------------- 90 COMP\n   Tomar 01 comprimido VO 1x ao dia por 90 dias.'
  ]
};

export const DISCHARGE_GUIDELINES = {
  cesarea: [
    '• Abstinência sexual por 30 dias.',
    '• Acompanhamento na Unidade Básica de Saúde (UBS) em 7 dias.',
    '• Higiene da Ferida Operatória com água e sabonete 4x ao dia; manter limpa e seca.',
    '• Retorno imediato à maternidade se febre, hemorragia vaginal, vermelhidão/dor intensa ou saída de secreção pela FO.'
  ],
  partoNormal: [
    '• Abstinência sexual por 30 dias.',
    '• Acompanhamento na UBS em 7 dias com o recém-nascido.',
    '• Higiene perineal com água morna após cada evacuação/micção.',
    '• Retorno imediato se febre, hemorragia ou corrimento fétido.'
  ],
  curetagem: [
    '• Abstinência sexual por 15 dias.',
    '• Acompanhamento na UBS de referência.',
    '• Retorno ao hospital em caso de febre, cólicas fortes ou hemorragia.'
  ]
};
