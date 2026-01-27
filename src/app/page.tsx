'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, RefreshCw, LayoutDashboard, LogOut, ExternalLink, 
  Home, Plus, Search, Calendar, BarChart3, Globe, Database, 
  Shield, Edit3, Save, Trash2, FileText
} from 'lucide-react'

// Tipagem rigorosa para eliminar erros de 'any'
interface Programa {
  id: number;
  nome: string;
  descricao: string;
  url: string;
}

export default function RHPROMAX_V8_FULL() {
  const [isMounted, setIsMounted] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState('inicio') 
  const [perfil, setPerfil] = useState({ role: 'coordenação' }) // Simulação coordenação
  const [modoEdicao, setModoEdicao] = useState(false)
  
  // Estado para Programas e Planilhas (Editáveis)
  const [programas, setProgramas] = useState<Programa[]>([
    { id: 1, nome: "PAE", descricao: "PROCESSOS ADMINISTRATIVOS", url: "https://pae.pa.gov.br" },
    { id: 2, nome: "IOEPA", descricao: "DIÁRIO OFICIAL", url: "https://ioepa.com.br" }
  ])

  useEffect(() => {
    setIsMounted(true)
    const savedProgramas = localStorage.getItem('rh_programas')
    if (savedProgramas) setProgramas(JSON.parse(savedProgramas))
    
    const savedUser = localStorage.getItem('rh_user_session')
    if (savedUser) { setPerfil(JSON.parse(savedUser)); setIsLoggedIn(true); }
  }, [])

  // Função para Adicionar Novo Programa (O botão + que você pediu)
  const adicionarPrograma = () => {
    const novo = { id: Date.now(), nome: "NOVO", descricao: "DESCRIÇÃO", url: "https://" }
    setProgramas([...programas, novo])
  }

  const removerPrograma = (id: number) => {
    setProgramas(programas.filter(p => p.id !== id))
  }

  const atualizarPrograma = (id: number, campo: keyof Programa, valor: string) => {
    setProgramas(programas.map(p => p.id === id ? { ...p, [campo]: valor } : p))
  }

  const salvarTudo = () => {
    localStorage.setItem('rh_programas', JSON.stringify(programas))
    setModoEdicao(false)
  }

  // Prevenção de Hydration Error
  if (!isMounted) return null

  return (
    <div className="min-h-screen bg-[#020205] text-white flex" suppressHydrationWarning>
      
      {/* SIDEBAR COMPLETA (Abas recuperadas) */}
      <aside className="w-72 bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col z-20 h-screen sticky top-0">
        <div className="p-10 text-center">
          <h2 className="text-2xl font-black italic tracking-tighter">RHPRO<span className="text-indigo-500">MAX</span></h2>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <NavItem active={abaAtiva === 'inicio'} onClick={() => setAbaAtiva('inicio')} icon={<Home size={18}/>} label="Início" />
          <NavItem active={abaAtiva === 'metas'} onClick={() => setAbaAtiva('metas')} icon={<BarChart3 size={18}/>} label="Metas" />
          <NavItem active={abaAtiva === 'equipes'} onClick={() => setAbaAtiva('equipes')} icon={<Users size={18}/>} label="Equipes" />
          <NavItem active={abaAtiva === 'planilhas'} onClick={() => setAbaAtiva('planilhas')} icon={<Database size={18}/>} label="Planilhas" />
          <NavItem active={abaAtiva === 'guias'} onClick={() => setAbaAtiva('guias')} icon={<FileText size={18}/>} label="Guias (PPO)" />
        </nav>

        {perfil.role === 'coordenação' && (
          <div className="p-6">
            <button onClick={() => modoEdicao ? salvarTudo() : setModoEdicao(true)} className={`w-full py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${modoEdicao ? 'bg-green-600 shadow-lg shadow-green-600/20' : 'bg-white/5 border border-white/10 hover:bg-white/20'}`}>
              {modoEdicao ? <><Save size={14}/> Salvar Alterações</> : <><Edit3 size={14}/> Modo Coordenação</>}
            </button>
          </div>
        )}
      </aside>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 p-12 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          
          {/* ABA INÍCIO COM EDIÇÃO E BOTÃO + */}
          {abaAtiva === 'inicio' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto space-y-12">
              <div className="relative h-64 w-full rounded-[40px] overflow-hidden border border-white/10 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069')] bg-cover bg-center">
                <div className="absolute inset-0 bg-black/60 flex flex-col justify-center px-12">
                   <h2 className="text-4xl font-black italic">Gestão Integrada.</h2>
                   <p className="text-indigo-500 font-black text-4xl italic">Automatize Documentos.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Programas e Sistemas</h3>
                    {modoEdicao && (
                      <button onClick={adicionarPrograma} className="p-2 bg-indigo-600 rounded-full hover:scale-110 transition-transform shadow-lg shadow-indigo-600/40">
                        <Plus size={16}/>
                      </button>
                    )}
                  </div>
                  
                  <div className="grid gap-4">
                    {programas.map((p) => (
                      <div key={p.id} className="bg-white/[0.03] p-6 rounded-[30px] border border-white/5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-500"><Globe size={20}/></div>
                            <div>
                              {modoEdicao ? (
                                <input className="bg-transparent border-b border-white/20 font-black italic outline-none" value={p.nome} onChange={(e) => atualizarPrograma(p.id, 'nome', e.target.value)} />
                              ) : (
                                <h4 className="font-black italic text-lg">{p.nome}</h4>
                              )}
                              <p className="text-[8px] font-bold opacity-30">{p.descricao}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {modoEdicao && <button onClick={() => removerPrograma(p.id)} className="text-red-500/40 hover:text-red-500"><Trash2 size={16}/></button>}
                            {!modoEdicao && <a href={p.url} target="_blank" rel="noreferrer" className="text-white/20 hover:text-indigo-500"><ExternalLink size={16}/></a>}
                          </div>
                        </div>
                        {modoEdicao && (
                          <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] text-indigo-400 outline-none" value={p.url} onChange={(e) => atualizarPrograma(p.id, 'url', e.target.value)} placeholder="Link do Sistema..." />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* PAINEL DE PRODUÇÃO (Estático vindo da Planilha) */}
                <div className="bg-white/[0.02] p-10 rounded-[45px] border border-white/5 flex flex-col justify-center items-center text-center">
                   <BarChart3 size={32} className="text-indigo-500 mb-6" />
                   <h4 className="text-2xl font-black italic uppercase">Produção Real</h4>
                   <p className="text-[10px] text-white/20 font-bold uppercase mt-4 leading-relaxed max-w-xs">Dados sincronizados diretamente da planilha mestre da coordenação.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* AS OUTRAS ABAS (Recuperadas e prontas para dados) */}
          {['metas', 'equipes', 'planilhas', 'guias'].includes(abaAtiva) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center opacity-20">
              <Database size={48} className="mb-4" />
              <h2 className="text-xl font-black italic uppercase tracking-widest">Aba {abaAtiva} em Sincronização</h2>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${active ? 'bg-indigo-600/10 text-white border border-indigo-500/20 shadow-[inset_0_0_10px_rgba(79,70,229,0.1)]' : 'text-white/20 hover:bg-white/5'}`}>
      {icon} <span className="font-bold text-[10px] uppercase tracking-widest">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_indigo]"></div>}
    </button>
  )
}