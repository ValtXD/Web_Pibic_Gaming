import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Sparkles, AlertTriangle, Zap, Layers, 
  Microscope, Heart, Info, Droplets, Wind, Activity
} from 'lucide-react';

// ADICIONADO: 'export' antes das constantes para poder usar no outro arquivo
export const TOWER_INFO_PHASE1 = {
  MACROFAGO: {
    name: 'Macrófago Residente',
    icon: Shield,
    color: '#f59e0b',
    realFunction: 'Fagócito residente nos tecidos da pele',
    description: 'Células grandes que fagocitam invasores e removem detritos celulares. São os "guardiões" da pele.',
    funFacts: [
      '🛡️ Vivem por meses no tecido cutâneo',
      '🧹 Removem até 100 bactérias por dia',
      '📡 Alertam outras células imunes sobre invasões'
    ],
    location: 'Distribuídos por toda a derme e epiderme',
    gameRole: 'Torre básica - boa detecção, dano médio, custo moderado'
  },
  DENDRITICA: {
    name: 'Célula Dendrítica Imatura',
    icon: Sparkles,
    color: '#3b82f6',
    realFunction: 'Célula apresentadora de antígenos',
    description: 'Coleta patógenos mortos e apresenta antígenos para ativar a resposta imune adaptativa.',
    funFacts: [
      '🎓 "Professora" do sistema imunológico',
      '🧬 Apresenta antígenos aos linfócitos',
      '⚡ Ativa resposta imune específica'
    ],
    location: 'Epiderme e derme, próximas a vasos linfáticos',
    gameRole: 'Coleta antígenos - gera ATP extra ao final da fase'
  },
  MASTOCITO: {
    name: 'Mastócito',
    icon: AlertTriangle,
    color: '#8b5cf6',
    realFunction: 'Libera mediadores inflamatórios',
    description: 'Contém grânulos de histamina e heparina. Libera substâncias que aumentam a permeabilidade vascular.',
    funFacts: [
      '💥 Libera histamina em resposta a lesões',
      '🩸 Aumenta fluxo sanguíneo para o local',
      '⚠️ Envolvido em reações alérgicas'
    ],
    location: 'Tecido conjuntivo da pele',
    gameRole: 'Retarda inimigos - controle de multidão'
  },
  EOSINOFILO: {
    name: 'Eosinófilo',
    icon: Zap,
    color: '#ec4899',
    realFunction: 'Defesa contra parasitas e reações alérgicas',
    description: 'Libera proteínas tóxicas que danificam parasitas e células infectadas. Causa dano em área.',
    funFacts: [
      '🎯 Especializado contra parasitas',
      '💣 Libera proteínas citotóxicas',
      '🔴 Corante eosin dá coloração rosa'
    ],
    location: 'Circulação sanguínea, migra para tecidos lesados',
    gameRole: 'Dano em área - ideal contra aglomerados'
  },
  QUIMIOCINA: {
    name: 'Quimiocinas/Citocinas',
    icon: Activity,
    color: '#10b981',
    realFunction: 'Sinais químicos de comunicação celular',
    description: 'Proteínas sinalizadoras liberadas por células para recrutar e ativar outras células imunológicas.',
    funFacts: [
      '📡 "Sistema de alarme" químico do corpo',
      '🚑 Recruta neutrófilos e macrófagos para o local da infecção',
      '⚡ Amplifica a resposta inflamatória de forma coordenada',
      '🧭 Guia células imunes pelo gradiente químico (quimiotaxia)'
    ],
    location: 'Liberadas por mastócitos, macrófagos e células epiteliais danificadas',
    gameRole: 'Habilidade ativa - aumenta dano das defesas em área'
  }
};

// ADICIONADO: 'export' antes das constantes
export const ENEMY_INFO_PHASE1 = {
  BACTERIA_COMENSAL: {
    name: 'Bactéria Comensal',
    color: '#22c55e',
    type: 'Flora normal oportunista',
    description: 'Bactérias que normalmente vivem na pele sem causar danos, mas se tornam patogênicas quando a barreira é rompida.',
    diseases: [
      '🤕 Infecções de feridas (Staphylococcus)',
      '🩹 Celulite bacteriana',
      '🔥 Foliculite e furúnculos'
    ],
    howItWorks: 'Multiplica-se rapidamente no tecido lesado, liberando enzimas que degradam tecidos.',
    defense: 'Macrófagos fagocitam, neutrófilos atacam com armadilhas de DNA',
    funFact: '🦠 Staphylococcus aureus vive no nariz de 30% das pessoas!',
    gameRole: 'Inimigo básico - velocidade e vida moderadas'
  },
  VIRUS_ENTRADA: {
    name: 'Vírus de Entrada',
    color: '#ef4444',
    type: 'Patógeno intracelular',
    description: 'Vírus que infectam células da pele, usando sua maquinaria para se reproduzir.',
    diseases: [
      '😷 Herpes simplex (feridas labiais)',
      '🤒 Verrugas virais (HPV)',
      '🌡️ Molusco contagioso'
    ],
    howItWorks: 'Invade células epiteliais, sequestra seu DNA para produzir novos vírus.',
    defense: 'Células NK destroem células infectadas, interferon alerta células vizinhas',
    funFact: '⚡ Vírus são 100x menores que bactérias!',
    gameRole: 'Inimigo rápido - difícil de acertar, pouca vida'
  },
  ESPORO_FUNGICO: {
    name: 'Esporo Fúngico',
    color: '#a855f7',
    type: 'Reprodutor fúngico',
    description: 'Estruturas reprodutivas de fungos que entram por feridas e germinam no tecido.',
    diseases: [
      '🦶 Micose cutânea',
      '🖐️ Tinha (dermatofitose)',
      '🌿 Esporotricose'
    ],
    howItWorks: 'Adere à pele, germina e produz hifas que penetram no tecido.',
    defense: 'Células de Langherans (dendríticas da pele) apresentam antígenos',
    funFact: '🍄 Fungos têm paredes celulares como plantas!',
    gameRole: 'Inimigo tanque - muita vida, lento'
  },
  TOXINA: {
    name: 'Toxina Bacteriana',
    color: '#f97316',
    type: 'Produto bacteriano tóxico',
    description: 'Moléculas liberadas por bactérias que prejudicam as células do hospedeiro.',
    diseases: [
      '🤢 Síndrome do choque tóxico',
      '🦠 Difteria (toxina)',
      '💀 Botulismo'
    ],
    howItWorks: 'Danifica membranas celulares, interfere com metabolismo, causa inflamação.',
    defense: 'Anticorpos neutralizantes, fagocitose das bactérias produtoras',
    funFact: '🧪 1mg de toxina botulínica pode matar 1 milhão de pessoas!',
    gameRole: 'Inimigo de suporte - reduz velocidade das defesas'
  },
  BIOFILME: {
    name: 'Biofilme Bacteriano',
    color: '#0ea5e9',
    type: 'Comunidade bacteriana',
    description: 'Agregado de bactérias envoltas em matriz extracelular que as protege de defesas.',
    diseases: [
      '🩺 Infecções de dispositivos médicos',
      '🦷 Placa dentária',
      '🩹 Infecções de feridas crônicas'
    ],
    howItWorks: 'Bactérias aderem à superfície, produzem matriz protetora, tornam-se resistentes.',
    defense: 'Requere combinação de antibióticos e remoção mecânica',
    funFact: '🏰 Biofilmes são como "cidades" bacterianas!',
    gameRole: 'Chefe de fase - alta vida, dano coletivo necessário'
  }
};

export default function Phase1Tooltip({ item, type, position }) {
  if (!item) return null;

  const info = type === 'tower' ? TOWER_INFO_PHASE1[item.type] : ENEMY_INFO_PHASE1[item.type];
  if (!info) return null;

  const Icon = type === 'tower' ? info.icon : Microscope;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className="fixed z-50 pointer-events-none"
        style={{
          left: `${position.x + 20}px`,
          top: `${position.y}px`,
          // ALTERADO: Aumentei a largura máxima para ficar mais largo (antes era 400px)
          width: 'max-content',
          maxWidth: '600px', 
          minWidth: '400px'
        }}
      >
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 shadow-2xl border-2" 
             style={{ borderColor: info.color }}>
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-emerald-500/20">
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: info.color + '20' }}
            >
              <Icon className="w-8 h-8" style={{ color: info.color }} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-xl text-white">{info.name}</h3>
              {type === 'enemy' && (
                <p className="text-sm text-emerald-300">{info.type}</p>
              )}
            </div>
          </div>

          {/* ... O restante do componente permanece igual ... */}
          {/* Função no corpo */}
          <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-blue-300">Função Biológica:</span>
            </div>
            <p className="text-sm text-blue-200">{info.realFunction}</p>
          </div>

          {/* Descrição */}
          <p className="text-base text-gray-200 mb-4 leading-relaxed">
            {info.description}
          </p>

          {/* Doenças causadas (inimigos) */}
          {type === 'enemy' && info.diseases && (
            <div className="mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-red-300">Infecções Relacionadas:</span>
              </div>
              <div className="space-y-1">
                {info.diseases.map((disease, idx) => (
                  <div key={idx} className="text-sm text-red-200 pl-2">
                    • {disease}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Curiosidades */}
          {info.funFacts && (
            <div className="mb-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-purple-300">Curiosidades:</span>
              </div>
              <div className="space-y-1">
                {info.funFacts.map((fact, idx) => (
                  <div key={idx} className="text-sm text-purple-200 pl-2">
                    {fact}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mecanismo de ação (inimigos) */}
          {type === 'enemy' && (
            <div className="mb-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Microscope className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-semibold text-yellow-300">Mecanismo de Infecção:</span>
              </div>
              <p className="text-sm text-yellow-200">{info.howItWorks}</p>
            </div>
          )}

          {/* Como o corpo defende (inimigos) */}
          {type === 'enemy' && (
            <div className="mb-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-green-300">Defesa Natural:</span>
              </div>
              <p className="text-sm text-green-200">{info.defense}</p>
            </div>
          )}

          {/* Papel no jogo */}
          <div className="mt-4 pt-3 border-t border-emerald-500/20">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: info.color }} />
              <span className="text-sm font-semibold text-emerald-300">No Jogo:</span>
            </div>
            <p className="text-sm text-emerald-200 italic">{info.gameRole}</p>
          </div>

          {/* Stat atual */}
          {type === 'enemy' && (
            <div className="mt-2 text-xs text-gray-400 text-right">
              Vida base: {item.maxHealth || item.health}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}