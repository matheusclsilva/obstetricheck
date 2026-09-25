import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Sparkles,
  Clock,
  TrendingUp,
  Pill,
  Utensils,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Activity,
  FileText,
  AlertCircle,
  Trash2,
  Stethoscope
} from 'lucide-react';
import { Bed } from '../../types/bed';
import { SectionCard } from '../common/SectionCard';
import { generateDefaultHda } from '../../utils/evolutionGenerator';

interface HdaAnamneseChecklistSectionProps {
  bed: Bed;
  data: any;
  onUpdateField: (key: string, value: any) => void;
  onUpdateBed?: (updates: Partial<Bed>) => void;
}

type SyndromeTab =
  | 'hiperemese'
  | 'itu'
  | 'has'
  | 'ruprema'
  | 'sangramento'
  | 'tpp'
  | 'puerperio'
  | 'geral';

interface TabConfig {
  id: SyndromeTab;
  label: string;
  icon: string;
  questionPrompt: string;
  chips: { label: string; text: string }[];
}

const SYNDROME_TABS: TabConfig[] = [
  {
    id: 'hiperemese',
    label: 'Hiperêmese',
    icon: '🤢',
    questionPrompt: 'Perguntar: Frequência dos vômitos? Tolera líquidos? Perda de peso? Medicações testadas em casa?',
    chips: [
      { label: 'Vômitos frequentes (>5x/dia)', text: 'apresentando episódios frequentes de vômitos incoercíveis (>5x/dia)' },
      { label: 'Intolerância a sólidos e líquidos', text: 'com intolerância total à ingesta de sólidos e líquidos' },
      { label: 'Perda de peso referida', text: 'com relato de perda ponderal significativa recente' },
      { label: 'Usou Ondansetrona sem melhora', text: 'fez uso prévio de Ondansetrona em domicílio sem melhora clínica' },
      { label: 'Usou Dimenidrinato sem melhora', text: 'fez uso de Dimenidrinato em domicílio sem melhora dos sintomas' },
      { label: 'Sialorreia excessiva', text: 'queixa-se de sialorreia profusa' },
      { label: 'Nega febre ou diarreia', text: 'nega febre, cólicas abdominais ou episódios de diarreia' }
    ]
  },
  {
    id: 'itu',
    label: 'ITU / Pielonefrite',
    icon: '🚽',
    questionPrompt: 'Perguntar: Ardor ao urinar? Dor lombar ou nas costas? Febre/calafrios? Aspecto ou odor da urina?',
    chips: [
      { label: 'Disúria e polaciúria', text: 'queixa-se de disúria intensa associada a aumento da frequência miccional (polaciúria)' },
      { label: 'Dor lombar unilateral', text: 'relata dor lombar unilateral com piora à palpação/movimentação' },
      { label: 'Febre alta e calafrios', text: 'apresentou picos de febre alta associados a calafrios em domicílio' },
      { label: 'Urina turva / odor forte', text: 'refere urina turva e com odor fétido' },
      { label: 'Histórico de ITUs de repetição', text: 'com histórico prévio de infecções do trato urinário de repetição na gestação' },
      { label: 'Sem melhora com analgésicos', text: 'sem alívio da dor após analgesia comum em domicílio' },
      { label: 'Nega perdas vaginais', text: 'nega perdas líquidas ou sangramento vaginal' }
    ]
  },
  {
    id: 'has',
    label: 'HAS / Pré-Eclâmpsia',
    icon: '⚡',
    questionPrompt: 'Perguntar: Picos de PA em casa? Dor de cabeça refratária? Visão turva ou pontos brilhantes? Dor no estômago?',
    chips: [
      { label: 'Picos pressóricos em domicílio', text: 'aferiu níveis pressóricos elevados em domicílio' },
      { label: 'Cefaleia refratária', text: 'refere cefaleia holocraniana refratária a analgésicos' },
      { label: 'Escotomas cintilantes', text: 'queixa-se de escotomas cintilantes e turvação visual' },
      { label: 'Epigastralgia / dor em barra', text: 'refere dor epigástrica em barra no abdome superior' },
      { label: 'Edema súbito de mãos/face', text: 'com edema súbito e acentuado de mãos e face' },
      { label: 'Uso regular de Metildopa', text: 'em uso regular de Metildopa em domicílio' },
      { label: 'Nega sintomas de iminência', text: 'nega cefaleia, alterações visuais ou dor epigástrica' }
    ]
  },
  {
    id: 'ruprema',
    label: 'RUPREMA / Bolsa Rota',
    icon: '💧',
    questionPrompt: 'Perguntar: Molhou as roupas de vez? Cor do líquido? Odor de cândida/água sanitária? Movimentação fetal?',
    chips: [
      { label: 'Perda líquida súbita volumosa', text: 'relata perda súbita de líquido claro transvaginal em grande quantidade (molhou vestes/cama)' },
      { label: 'Perda contínua aos esforços', text: 'com saída contínua de líquido pelas vias vaginais aos esforços' },
      { label: 'Líquido claro com grumos', text: 'líquido de aspecto claro com pequenos grumos e odor característico de água sanitária' },
      { label: 'Líquido meconial / esverdeado', text: 'refere perda de líquido com coloração esverdeada / meconial' },
      { label: 'Movimentação fetal preservada', text: 'movimentação fetal ativa sentida e preservada' },
      { label: 'Nega febre ou odor fétido', text: 'nega febre, calafrios ou odor fétido no líquido' },
      { label: 'Nega contrações dolorosas', text: 'nega contrações uterinas dolorosas associadas' }
    ]
  },
  {
    id: 'sangramento',
    label: 'Sangramento / Aborto',
    icon: '🔴',
    questionPrompt: 'Perguntar: Volume de sangue? Cor viva ou borra? Coágulos ou restos ovulares? Cólica forte?',
    chips: [
      { label: 'Sangramento vermelho vivo moderado', text: 'apresentando sangramento vaginal vermelho vivo em quantidade moderada' },
      { label: 'Sangramento escuro tipo borra', text: 'apresentando sangramento vaginal escurecido em pequena quantidade (tipo borra de café)' },
      { label: 'Eliminação de coágulos/restos', text: 'com eliminação de coágulos e possíveis restos ovulares' },
      { label: 'Cólica progressiva em baixo ventre', text: 'associado a cólica em baixo ventre de intensidade progressiva' },
      { label: 'Sem cólica associada', text: 'nega dor ou cólica abdominal associada ao sangramento' },
      { label: 'Uso de Progesterona prévia', text: 'em uso de Progesterona natural em domicílio' },
      { label: 'Sensação de fraqueza/tontura', text: 'refere sensação de tontura e fraqueza associada' }
    ]
  },
  {
    id: 'tpp',
    label: 'Contrações / TPP',
    icon: '🩺',
    questionPrompt: 'Perguntar: Intervalo das contrações? Barriga endurece com dor? Perdeu tampão mucoso? Mexe bem?',
    chips: [
      { label: 'Contrações dolorosas frequentes', text: 'apresentando contrações uterinas dolorosas e rítmicas a cada 5-10 minutos' },
      { label: 'Endurecimento uterino frequente', text: 'com sensação de endurecimento frequente da barriga' },
      { label: 'Eliminação de tampão mucoso', text: 'relata eliminação prévia de tampão mucoso com estrias de sangue' },
      { label: 'Sensação de peso pélvico', text: 'com queixa de sensação de pressão e peso no períneo' },
      { label: 'Movimentação fetal normal', text: 'movimentação fetal ativa mantida' },
      { label: 'Nega perda líquida ou sangramento', text: 'nega perdas líquidas transvaginais ou sangramento ativo' }
    ]
  },
  {
    id: 'puerperio',
    label: 'Puerpério / Pós-Parto',
    icon: '🤱',
    questionPrompt: 'Perguntar: Dor na cesárea ou períneo? Sangramento pós-parto? Mamas e amamentação? Diurese e evacuação?',
    chips: [
      { label: 'Boa recuperação, dor controlada', text: 'em boa evolução pós-parto, com dor cirúrgica/perineal leve e controlada com analgésicos' },
      { label: 'Lóquios fisiológicos sem odor', text: 'relata lóquios fisiológicos de coloração rubra e quantidade habitual, sem odor fétido' },
      { label: 'Boa pega e amamentação eficaz', text: 'amamentação em livre demanda com boa pega e mamas secretantes com colostro' },
      { label: 'Dor mamilar / pega difícil', text: 'queixa-se de dor mamilar durante as mamadas e dificuldade de posicionamento do RN' },
      { label: 'Diurese e flatos presentes', text: 'diurese espontânea presente e eliminação de flatos restabelecida' },
      { label: 'Nega febre puerperal', text: 'nega febre puerperal, calafrios ou mal-estar sistêmico' }
    ]
  },
  {
    id: 'geral',
    label: 'Geral / Outros',
    icon: '📋',
    questionPrompt: 'Perguntar: Dor abdominal inespecífica? Queda ou trauma? Sintomas respiratórios ou gastrintestinais?',
    chips: [
      { label: 'Dor abdominal difusa', text: 'refere dor abdominal difusa de início recente' },
      { label: 'Trauma / queda da própria altura', text: 'histórico de queda da própria altura sem perda de consciência' },
      { label: 'Sintomas gripais / tosse', text: 'apresentando tosse, coriza e sintomas gripais associados' },
      { label: 'Diarreia e cólicas', text: 'relata episódios de evacuações líquidas e cólicas abdominais' },
      { label: 'Tontura e mal-estar', text: 'queixa-se de tontura ortostática e mal-estar geral' }
    ]
  }
];

const FULL_TEMPLATES = [
  {
    title: 'Hiperêmese Gravídica',
    text: 'Paciente relata início dos sintomas há cerca de 4 dias, com náuseas constantes e episódios diários frequentes de vômitos pós-prandiais (>5x/dia). Refere intolerância oral a alimentos sólidos e líquidos, com recusa alimentar e relato de perda de peso recente. Fez uso de medicação sintomática em domicílio (Ondansetrona/Dimenidrinato) sem melhora do quadro, evoluindo com astenia importante e prostração. Nega febre, diarreia ou dor abdominal.'
  },
  {
    title: 'Pielonefrite Aguda / ITU',
    text: 'Paciente relata queixa de disúria e polaciúria há cerca de 3 dias, evoluindo nas últimas 24 horas com dor lombar unilateral de moderada a forte intensidade e picos febris diários associados a calafrios em domicílio. Fez uso de analgésicos comuns sem melhora da dor. Refere urina turva e com odor fétido. Nega perdas vaginais líquidas ou sangramento.'
  },
  {
    title: 'Trabalho de Parto Prematuro (TPP)',
    text: 'Paciente relata início de cólicas em baixo ventre e sensação de endurecimento uterino rítmico há cerca de 12 horas, com piora progressiva da frequência e intensidade. Refere eliminação recente de secreção mucoide com estrias de sangue (tampão mucoso). Nega perda líquida em grande quantidade ou sangramento vaginal ativo. Movimentação fetal ativa sentida e preservada.'
  },
  {
    title: 'Pré-Eclâmpsia / HAS Gestacional',
    text: 'Paciente com diagnóstico prévio de síndrome hipertensiva, relata aferição de níveis pressóricos elevados em domicílio associados a cefaleia holocraniana refratária e episódios ocasionais de escotomas cintilantes. Fez uso de anti-hipertensivo habitual sem controle satisfatório da PA. Nega dor em barra ou epigastralgia. Movimentação fetal normal.'
  },
  {
    title: 'RUPREMA (Rotura de Membranas)',
    text: 'Paciente relata perda súbita de líquido claro pelas vias vaginais em grande quantidade há cerca de 6 horas, que molhou vestes e roupa de cama. Refere manutenção da saída de líquido aos esforços, de coloração clara com grumos e odor característico de água sanitária. Nega febre, odor fétido ou sangramento associado. Movimentação fetal ativa presente.'
  },
  {
    title: 'Ameaça de Aborto / Sangramento 1º Tri',
    text: 'Paciente com gestação em curso no 1º trimestre, relata início de sangramento vaginal vermelho vivo em moderada quantidade há 2 dias, associado a cólicas intermitentes em baixo ventre. Nega eliminação evidente de fragmentos ovulares ou febre. Nega uso de medicações abortivas.'
  },
  {
    title: 'Puerpério / Boa Evolução',
    text: 'Puérpera refere boa evolução pós-parto, com dor cirúrgica/perineal leve bem tolerada sob analgesia prescrita. Relata lóquios fisiológicos de coloração rubra e quantidade habitual sem odor fétido. Mamas secretantes de colostro, com RN mantendo boa pega e amamentação em livre demanda. Diurese e trânsito intestinal restabelecidos.'
  }
];

export const HdaAnamneseChecklistSection: React.FC<HdaAnamneseChecklistSectionProps> = ({
  bed,
  data,
  onUpdateField,
  onUpdateBed
}) => {
  const currentDetails = data?.hdaDetails || bed.hdaDetails || '';

  // Determina a aba padrão com base no leito ou diagnóstico
  const getInitialTab = (): SyndromeTab => {
    if (bed.type === 'puerpera') return 'puerperio';
    if (bed.type === 'curetagem') return 'sangramento';

    const reasons: string[] = Array.isArray(data?.admissionReason)
      ? data.admissionReason
      : typeof data?.admissionReason === 'string'
      ? [data.admissionReason]
      : [];

    const diag = (bed.diagnosis || '').toLowerCase();

    if (reasons.includes('hiperemese') || diag.includes('hiperemese') || diag.includes('emese')) return 'hiperemese';
    if (reasons.includes('itu') || reasons.includes('pielonefrite') || reasons.includes('itu_pielonefrite') || diag.includes('pielonefrite') || diag.includes('itu')) return 'itu';
    if (reasons.includes('hipertensao') || reasons.includes('preeclampsia') || diag.includes('hipertens') || diag.includes('pre-ecl') || diag.includes('pré-ecl')) return 'has';
    if (reasons.includes('ruprema') || diag.includes('ruprema') || diag.includes('bolsa')) return 'ruprema';
    if (reasons.includes('ameaca_aborto') || reasons.includes('sangramento_1tri') || diag.includes('abort') || diag.includes('sangramento')) return 'sangramento';
    if (reasons.includes('ameaca_tpp') || reasons.includes('tp_latente') || reasons.includes('tp_ativo') || diag.includes('tpp') || diag.includes('parto')) return 'tpp';

    return 'hiperemese';
  };

  const [activeTab, setActiveTab] = useState<SyndromeTab>(getInitialTab);
  const [showFullTemplates, setShowFullTemplates] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Atualiza tanto os dados específicos do leito quanto a HDA global
  const handleUpdateDetails = (newDetails: string) => {
    onUpdateField('hdaDetails', newDetails);

    if (onUpdateBed) {
      const updatedBed: Bed = {
        ...bed,
        hdaDetails: newDetails,
        data: {
          ...(bed.data || {}),
          hdaDetails: newDetails
        }
      };
      const autoHda = generateDefaultHda(updatedBed);
      onUpdateBed({
        hdaDetails: newDetails,
        hda: autoHda
      });
    }
  };

  // Auxiliar para adicionar ou remover frases do texto
  const toggleOrAppendText = (phrase: string) => {
    const current = currentDetails.trim();
    if (!current) {
      // Primeira frase: capitaliza
      const capitalized = phrase.charAt(0).toUpperCase() + phrase.slice(1);
      handleUpdateDetails(`${capitalized}.`);
      return;
    }

    // Se já contém a frase (comparação aproximada para evitar duplicidade)
    const normalizedCurrent = current.toLowerCase();
    const normalizedPhrase = phrase.toLowerCase().replace(/[.,;]/g, '').trim();

    if (normalizedCurrent.includes(normalizedPhrase.slice(0, Math.min(20, normalizedPhrase.length)))) {
      // Já está presente: remove a ocorrência e limpa pontuação
      const regex = new RegExp(`[.,;]?\\s*${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[.,;]?`, 'i');
      let cleaned = current.replace(regex, '').trim();
      cleaned = cleaned.replace(/\s{2,}/g, ' ').replace(/\.\s*\./g, '.');
      if (cleaned && !cleaned.endsWith('.')) cleaned += '.';
      handleUpdateDetails(cleaned);
    } else {
      // Anexa com pontuação adequada
      const separator = current.endsWith('.') ? ' ' : '. ';
      const capitalized = phrase.charAt(0).toUpperCase() + phrase.slice(1);
      handleUpdateDetails(`${current}${separator}${capitalized}.`);
    }
  };

  const isPhraseInText = (phrase: string): boolean => {
    if (!currentDetails) return false;
    const normalizedCurrent = currentDetails.toLowerCase();
    const searchSlice = phrase.toLowerCase().replace(/[.,;]/g, '').trim().slice(0, 18);
    return normalizedCurrent.includes(searchSlice);
  };

  const currentTabConfig = SYNDROME_TABS.find((t) => t.id === activeTab) || SYNDROME_TABS[0];
  const charCount = currentDetails.length;
  const wordCount = currentDetails.trim() ? currentDetails.trim().split(/\s+/).length : 0;

  return (
    <SectionCard
      title="Anamnese da Doença Atual (HDA Dirigida & História Clínica)"
      icon={ClipboardList}
      color="text-indigo-700"
      bg="bg-indigo-100"
      badge={charCount > 0 ? `${wordCount} palavras` : 'Pendente'}
    >
      <div className="space-y-3.5">
        {/* Header Explicativo & Botão de Minimizar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-200/80 text-xs text-indigo-950">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-medium text-[11px] sm:text-xs">
              <strong>Guia de Anamnese:</strong> Lembrete do que perguntar à paciente. Clique nos tópicos ou digite para alimentar a HDA na evolução.
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {charCount > 0 && (
              <button
                type="button"
                onClick={() => handleUpdateDetails('')}
                className="px-2 py-1 rounded-lg text-[10px] font-bold text-rose-700 hover:text-rose-900 bg-white border border-rose-200 hover:bg-rose-50 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                title="Limpar história escrita"
              >
                <Trash2 className="w-3 h-3 text-rose-600" />
                <span>Limpar</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2 py-1 rounded-lg text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-200 hover:bg-indigo-50 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  <span>Recolher</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  <span>Expandir ({wordCount} pal.)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {isExpanded && (
          <>
            {/* PILARES UNIVERSAIS DE INVESTIGAÇÃO (Para qualquer paciente/enfermidade) */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Pilares Universais da Anamnese (Tempo, Evolução, Medicação e Dieta)
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Clique para montar a narrativa
                </span>
              </div>

              {/* Linha 1: Início dos Sintomas */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  1. Quando começaram os sintomas? (Início e Cronologia):
                </label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: 'Hoje (< 24h)', text: 'início dos sintomas há menos de 24 horas' },
                    { label: 'Há 2 a 3 dias', text: 'início dos sintomas há cerca de 2 a 3 dias' },
                    { label: 'Há 4 a 7 dias', text: 'início dos sintomas há cerca de uma semana' },
                    { label: 'Arrastado (> 1 sem)', text: 'quadro arrastado com início há mais de 1 semana' },
                    { label: 'Início súbito', text: 'início de forma súbita' },
                    { label: 'Início insidioso/gradual', text: 'início insidioso e progressivo' }
                  ].map((item) => {
                    const active = isPhraseInText(item.text);
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => toggleOrAppendText(item.text)}
                        className={`text-[10px] px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          active
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-800'
                        }`}
                      >
                        {active && <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Linha 2: Evolução dos Sintomas */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  2. Como vem evoluindo o quadro? (Curso e Gravidade):
                </label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: 'Piora progressiva', text: 'evoluindo com piora progressiva da intensidade dos sintomas' },
                    { label: 'Sintomas estáveis', text: 'com manutenção estável da intensidade dos sintomas' },
                    { label: 'Em crises / intermitente', text: 'quadro com episódios intermitentes em crises' },
                    { label: 'Primeiro episódio', text: 'relata ser o primeiro episódio do quadro na vida' },
                    { label: 'Quadro recorrente', text: 'refere episódios prévios semelhantes' }
                  ].map((item) => {
                    const active = isPhraseInText(item.text);
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => toggleOrAppendText(item.text)}
                        className={`text-[10px] px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          active
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-800'
                        }`}
                      >
                        {active && <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Linha 3: Uso de Medicação Prévia e Conduta */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  3. Fez uso de medicações em casa? Passou em outro serviço?:
                </label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: 'Sem medicação prévia', text: 'sem uso prévio de medicações em domicílio' },
                    { label: 'Usou remédio sem melhora', text: 'fez uso de medicação sintomática em domicílio sem melhora dos sintomas' },
                    { label: 'Alívio parcial/transitório', text: 'com alívio apenas parcial e transitório após uso de analgésicos' },
                    { label: 'Atendimento prévio UPA/PS', text: 'com passagem prévia por serviço de urgência antes da internação' },
                    { label: 'Em uso de antibiótico', text: 'em curso de antibioticoterapia iniciada antes do internamento' }
                  ].map((item) => {
                    const active = isPhraseInText(item.text);
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => toggleOrAppendText(item.text)}
                        className={`text-[10px] px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          active
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-800'
                        }`}
                      >
                        {active && <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Linha 4: Dieta, Vômitos e Repercussão Geral */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  4. Alimentação, Vômitos e Sinais Sistêmicos:
                </label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: 'Aceitando dieta VO', text: 'mantendo boa aceitação da dieta por via oral' },
                    { label: 'Recusa alimentar / intolerância', text: 'com recusa alimentar e intolerância à dieta oral' },
                    { label: 'Vômitos frequentes', text: 'apresentando episódios frequentes de vômitos' },
                    { label: 'Baixa ingesta hídrica', text: 'com ingesta de líquidos acentuadamente reduzida' },
                    { label: 'Astenia / prostração', text: 'associada a astenia intensa e sensação de fraqueza' },
                    { label: 'Febre / calafrios em casa', text: 'com relato de febre e calafrios em domicílio' },
                    { label: 'Nega febre', text: 'nega febre aferida em domicílio' }
                  ].map((item) => {
                    const active = isPhraseInText(item.text);
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => toggleOrAppendText(item.text)}
                        className={`text-[10px] px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          active
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-800'
                        }`}
                      >
                        {active && <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ROTEIRO CLÍNICO DIRIGIDO POR ENFERMIDADE (Abas Inteligentes) */}
            <div className="bg-white p-3 rounded-2xl border border-indigo-100 shadow-2xs space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100 pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Roteiro de Perguntas por Diagnóstico / Enfermidade:
                </span>

                <button
                  type="button"
                  onClick={() => setShowFullTemplates(!showFullTemplates)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <FileText className="w-3 h-3 text-indigo-600" />
                  <span>Modelos Prontos</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showFullTemplates ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Dropdown de Modelos Prontos Completos */}
              {showFullTemplates && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-slate-600 uppercase block">
                    Inserir História Completa Pré-Formatada (1 Clique):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                    {FULL_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.title}
                        type="button"
                        onClick={() => {
                          handleUpdateDetails(tmpl.text);
                          setShowFullTemplates(false);
                        }}
                        className="text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-xs cursor-pointer shadow-2xs group"
                      >
                        <span className="font-bold text-slate-800 text-[11px] block group-hover:text-indigo-700">
                          {tmpl.title}
                        </span>
                        <span className="text-[10px] text-slate-400 line-clamp-1">
                          {tmpl.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Seletor de Abas de Enfermidades */}
              <div className="flex flex-wrap gap-1">
                {SYNDROME_TABS.map((tab) => {
                  const isSelected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Pergunta-guia e Chips da Aba Selecionada */}
              <div className="bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-200/60 space-y-2">
                <div className="flex items-start gap-1.5 text-indigo-900">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] font-semibold italic">
                    {currentTabConfig.questionPrompt}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {currentTabConfig.chips.map((chip) => {
                    const active = isPhraseInText(chip.text);
                    return (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => toggleOrAppendText(chip.text)}
                        className={`text-[10px] px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                          active
                            ? 'bg-indigo-700 text-white shadow-2xs'
                            : 'bg-white text-indigo-950 border border-indigo-200 hover:bg-indigo-100/70'
                        }`}
                      >
                        {active && <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />}
                        <span>{chip.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ÁREA DE TEXTO LIVRE & NARRATIVA FINAL DA HDA */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <label className="font-bold text-slate-700 uppercase flex items-center gap-1">
                  <span>Texto da História da Doença Atual (Editável Livremente):</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {charCount} caracteres | {wordCount} palavras
                </span>
              </div>

              <textarea
                rows={4}
                value={currentDetails}
                onChange={(e) => handleUpdateDetails(e.target.value)}
                placeholder="Ex: Paciente relata início dos sintomas há cerca de 3 dias com náuseas constantes e vômitos frequentes. Não relatou melhora após uso de Ondansetrona em domicílio, evoluindo com intolerância alimentar no dia anterior e astenia. Nega febre ou dor abdominal."
                className="w-full bg-white border border-indigo-300 rounded-xl p-3 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs leading-relaxed resize-y"
              />

              <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500 pt-0.5">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Alimenta automaticamente o campo HDA da evolução médica e do prontuário.
                </span>
                <span className="text-slate-400">
                  Dica: Você pode digitar nomes exatos de remédios, dosagens e datas livremente.
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </SectionCard>
  );
};
