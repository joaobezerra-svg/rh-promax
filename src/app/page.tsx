'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Home, Plus, BarChart, Globe, Database,
  Edit3, Save, Trash2, FileText, Check, ExternalLink, Settings,
  Lock, Mail, LogOut, Loader2, Shield, UserCheck, HelpCircle, ArrowLeft, Eye, EyeOff, AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import Papa from 'papaparse'
import CategoryChart from '@/components/CategoryChart'

// Interfaces
interface Categoria {
  id: number;
  nome: string;
  descricao: string;
  aba_pai: string;
  icone?: string;
  cor?: string;
  link_externo?: string;
  link_csv?: string;
  created_at?: string;
}

interface Link {
  id: number;
  titulo: string;
  url: string;
  categoria_id: number;
  created_at?: string;
}

export default function RHPROMAX_V8_FULL() {
  const [isMounted, setIsMounted] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState('inicio')
  const [modoEdicao, setModoEdicao] = useState(false)
  const router = useRouter()

  // Auth State & Logic
  const [user, setUser] = useState<any>(null)

  // Auth Form State
  const [modo, setModo] = useState<'cadastro' | 'login'>('cadastro')
  const [perfil, setPerfil] = useState<'coordenacao' | 'servidor'>('servidor')

  // Fields
  const [email, setEmail] = useState('') // Used for Servidor Email
  const [matricula, setMatricula] = useState('') // Used for Coordenacao
  const [password, setPassword] = useState('')
  const [dica, setDica] = useState('')

  const [loadingAuth, setLoadingAuth] = useState(false)

  // RBAC Helpers
  const isCoordenador = user?.user_metadata?.perfil === 'coordenacao'
  const isServidor = user?.user_metadata?.perfil === 'servidor'

  // Data State
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(false)

  // Modais
  const [modalCategoriaAberto, setModalCategoriaAberto] = useState(false)
  const [modalLinkAberto, setModalLinkAberto] = useState<{ aberto: boolean, categoriaId: number | null }>({ aberto: false, categoriaId: null })

  // States do Modal de Categoria (Separados conforme solicitado)
  const [nomeCategoria, setNomeCategoria] = useState('')
  const [linkCsv, setLinkCsv] = useState('')
  const [urlLink, setUrlLink] = useState('')

  const [novoLink, setNovoLink] = useState({ titulo: '', url: '' })
  const [activeConfigId, setActiveConfigId] = useState<number | null>(null)

  useEffect(() => {
    setIsMounted(true)

    // Check Active Session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setModoEdicao(false) // Exit edit mode on logout
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingAuth(true)

    try {
      let finalEmail = email

      // If logging in as Coordenacao, we need to infer/ask functionality or just use email field.
      // But standard login usually just takes email/password.
      // The prompt doesn't specify changing Login logic heavily, but user might try to login with matricula?
      // For simplicity/standard, let's assume Login is standard Email/Pass. 
      // If user is Coordenacao, they registered with 'matricula@sistema.com'.
      // Let's keep a generic "Email ou Matrícula" field for login if needed, or just Email.
      // Given the prompt focuses on REGISTRATION, I will assume Login uses Email.
      // wait, the prompt says "Já possui uma conta? Entrar".
      // Let's support matricula login detection if it's just numbers.

      const isMatricula = /^\d+$/.test(email)
      if (isMatricula) {
        finalEmail = `${email}@ccm.com`
      }

      if (!finalEmail) throw new Error("E-mail ou Matrícula obrigatória")

      console.log("Tentando login com:", { finalEmail, password }); // DEBUG

      const { error } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password
      })

      if (error) throw error

    } catch (error: any) {
      alert("Erro ao entrar: " + error.message)
    } finally {
      setLoadingAuth(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingAuth(true)

    try {
      if (!password) throw new Error("Senha é obrigatória")
      if (!dica) throw new Error("A dica de senha é obrigatória")

      let finalEmail = ''

      if (perfil === 'coordenacao') {
        const cleanMatricula = matricula.replace(/\D/g, '')
        if (!cleanMatricula) throw new Error("Matrícula é obrigatória")
        finalEmail = `${cleanMatricula}@ccm.com` // Changed to @ccm.com
      } else {
        if (!email) throw new Error("E-mail é obrigatório")
        finalEmail = email
      }

      // 1. Register User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: finalEmail,
        password,
        options: {
          data: {
            perfil: perfil, // 'coordenacao' or 'servidor'
            dica: dica
            // matricula is not explicitly asked to be in metadata, but nice to have. 
            // Prompt says: "No campo options.data, envie o objeto: { perfil: tipoSelecionado, dica: campoDica }."
            // I will stick exactly to the prompt instructions.
          }
        }
      })

      if (authError) throw authError

      // 2. Save Hint Publicly
      if (authData.user) {
        const identifier = perfil === 'coordenacao' ? matricula : finalEmail
        // Also ensure metadata is robustly set if needed, but signUp options handle it.

        await supabase.from('public_user_hints').insert([{
          identifier: identifier,
          hint: dica
        }]).select()
      }

      // 3. Immediate Access & Error Suppression
      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: finalEmail,
          password
        })

        if (signInError) throw signInError

        // Success login
        window.location.reload()

      } catch (loginError: any) {
        // Suppress "Email not confirmed" error specifically
        if (loginError.message.includes('Email not confirmed') || loginError.message.includes('confirm')) {
          console.warn("Suppressing email confirmation error, forcing reload.")
          // Force reload to attempt session recovery or just show dashboard if session was actually created
          window.location.reload()
          return
        }

        throw loginError
      }

    } catch (error: any) {
      // Check main block errors too
      if (error.message.includes('Email not confirmed')) {
        window.location.reload()
        return
      }
      alert("Erro ao cadastrar: " + error.message)
      setLoadingAuth(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  useEffect(() => {
    fetchDados()
  }, [abaAtiva])

  // Busca de Dados e Gerenciamento de Estado
  const fetchDados = async () => {
    setLoading(true)
    try {
      // Busca categorias da aba ativa
      const { data: cats, error: errCat } = await supabase
        .from('categorias')
        .select('*')
        .eq('aba_pai', abaAtiva)
        .order('id', { ascending: true })

      if (errCat) console.error(errCat)
      if (cats) setCategorias(cats)

      // Busca Links (Geral)
      const { data: lks, error: errLink } = await supabase.from('links').select('*')
      if (errLink) throw errLink
      if (lks) setLinks(lks)

    } catch (error: any) {
      console.error("Erro ao buscar dados:", error)
    } finally {
      setLoading(false)
    }
  }


  const adicionarCategoria = async () => {
    if (!nomeCategoria) return

    const tempId = Date.now()
    const optimisticCat: Categoria = {
      id: tempId,
      nome: nomeCategoria,
      descricao: '', // Removido do form por solicitação, enviando vazio
      aba_pai: abaAtiva,
      icone: 'Folder',
      cor: 'purple',
      link_csv: linkCsv,
      link_externo: urlLink
    }

    setCategorias([...categorias, optimisticCat])
    setModalCategoriaAberto(false)

    // Reset States
    setNomeCategoria('')
    setLinkCsv('')
    setUrlLink('')

    const { data } = await supabase.from('categorias').insert([{
      nome: optimisticCat.nome,
      descricao: optimisticCat.descricao,
      aba_pai: abaAtiva,
      link_csv: optimisticCat.link_csv,
      link_externo: optimisticCat.link_externo
    }]).select()

    if (data) {
      setCategorias(prev => prev.map(c => c.id === tempId ? data[0] : c))
    }
  }

  const removerCategoria = async (id: number) => {
    setCategorias(categorias.filter(c => c.id !== id))
    await supabase.from('categorias').delete().eq('id', id)
  }

  const atualizarLinkCsv = async (id: number, newLink: string) => {
    setCategorias(prev => prev.map(c => c.id === id ? { ...c, link_csv: newLink } : c))
    await supabase.from('categorias').update({ link_csv: newLink }).eq('id', id)
  }

  // --- Ações de Links ---

  const adicionarLink = async () => {
    if (!novoLink.titulo || !modalLinkAberto.categoriaId) return

    const isEquipe = abaAtiva === 'equipes'
    const finalUrl = isEquipe ? 'servidor' : novoLink.url
    if (!isEquipe && !finalUrl) return

    const tempId = Date.now()
    const optimisticLink: Link = {
      id: tempId,
      titulo: novoLink.titulo,
      url: finalUrl,
      categoria_id: modalLinkAberto.categoriaId
    }

    setLinks([...links, optimisticLink])
    setModalLinkAberto({ ...modalLinkAberto, aberto: false })
    setNovoLink({ titulo: '', url: '' })

    const { data } = await supabase.from('links').insert([{
      titulo: optimisticLink.titulo,
      url: optimisticLink.url,
      categoria_id: optimisticLink.categoria_id
    }]).select()

    if (data) {
      setLinks(prev => prev.map(l => l.id === tempId ? data[0] : l))
    }
  }

  const removerLink = async (id: number) => {
    setLinks(links.filter(l => l.id !== id))
    await supabase.from('links').delete().eq('id', id)
  }

  if (!isMounted) return null

  const isMetasTab = abaAtiva.toLowerCase() === 'metas';

  // --- AUTH SCREEN (LOGIN & CADASTRO) ---
  if (!user) {
    return (
      <div className="min-h-screen bg-[#020205] text-white flex items-center justify-center p-4 font-sans selection:bg-purple-500/30">
        <div className="max-w-md w-full bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden group transition-all duration-300">
          {/* Decorative Glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-purple-500 rounded-b-full shadow-[0_0_20px_#a855f7] opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <h2 className="text-3xl font-black italic tracking-tighter mb-2">
              RHPRO<span className="text-purple-500">MAX</span>
            </h2>
            <p className="text-xs text-purple-300/60 uppercase tracking-[0.3em] font-bold">
              {modo === 'cadastro' ? 'Novo Acesso' : 'Bem-vindo de volta'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {modo === 'cadastro' ? (
              <motion.form
                key="cadastro"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSignUp}
                className="space-y-5 relative z-10"
              >
                {/* 1. Profile Selector */}
                <div className="grid grid-cols-2 gap-3 p-1 bg-white/5 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setPerfil('servidor')}
                    className={`py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${perfil === 'servidor' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Servidor
                  </button>
                  <button
                    type="button"
                    onClick={() => setPerfil('coordenacao')}
                    className={`py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${perfil === 'coordenacao' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Coordenação
                  </button>
                </div>

                {/* 2. Dynamic Identity Fields */}
                <div className="space-y-4">
                  {perfil === 'coordenacao' ? (
                    <div className="relative group/input">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-purple-500 transition-colors" size={18} />
                      <input
                        type="text"
                        placeholder="Matrícula (Apenas Números)"
                        value={matricula}
                        onChange={e => setMatricula(e.target.value.replace(/\D/g, ''))} // Ensure only numbers
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:border-purple-500 outline-none transition-all placeholder:text-zinc-600"
                        required
                      />
                    </div>
                  ) : (
                    <div className="relative group/input">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-purple-500 transition-colors" size={18} />
                      <input
                        type="email"
                        placeholder="E-mail Institucional"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:border-purple-500 outline-none transition-all placeholder:text-zinc-600"
                        required
                      />
                    </div>
                  )}

                  {/* 3. Password Field */}
                  <div className="relative group/input">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-purple-500 transition-colors" size={18} />
                    <input
                      type="password"
                      placeholder="Crie sua Senha"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:border-purple-500 outline-none transition-all placeholder:text-zinc-600"
                      required
                    />
                  </div>

                  {/* 4. Password Hint (Mandatory) */}
                  <div className="relative group/input">
                    <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-purple-500 transition-colors" size={18} />
                    <input
                      type="text"
                      placeholder="Dica de Senha (Obrigatório)"
                      value={dica}
                      onChange={e => setDica(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:border-purple-500 outline-none transition-all placeholder:text-zinc-600"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingAuth}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loadingAuth ? <Loader2 className="animate-spin" size={20} /> : 'CRIAR CONTA'}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin}
                className="space-y-4 relative z-10"
              >
                <div className="relative group/input">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-purple-500 transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="E-mail ou Matrícula"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:border-purple-500 outline-none transition-all placeholder:text-zinc-600"
                    required
                  />
                </div>
                <div className="relative group/input">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within/input:text-purple-500 transition-colors" size={18} />
                  <input
                    type="password"
                    placeholder="Sua Senha"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:border-purple-500 outline-none transition-all placeholder:text-zinc-600"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingAuth}
                  className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl transition-all shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loadingAuth ? <Loader2 className="animate-spin" size={20} /> : 'ENTRAR NO SISTEMA'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Toggle Footer */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center relative z-10">
            <button
              onClick={() => {
                setModo(modo === 'cadastro' ? 'login' : 'cadastro')
                // Clear errors or fields if needed
                setEmail('')
                setPassword('')
                setMatricula('')
                setDica('')
              }}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              {modo === 'cadastro' ? (
                <>Já possui uma conta? <span className="text-purple-400 font-bold ml-1">Entrar</span></>
              ) : (
                <>Não tem acesso? <span className="text-purple-400 font-bold ml-1">Cadastre-se</span></>
              )}
            </button>
          </div>

        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020205] text-white flex font-sans selection:bg-purple-500/30" suppressHydrationWarning>

      {/* SIDEBAR */}
      <aside className="w-72 bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col z-20 h-screen sticky top-0">
        <div className="p-10 text-center">
          <h2 className="text-2xl font-black italic tracking-tighter">RHPRO<span className="text-purple-500">MAX</span></h2>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem active={abaAtiva === 'inicio'} onClick={() => setAbaAtiva('inicio')} icon={<Home size={18} />} label="Início" />
          <NavItem active={abaAtiva === 'metas'} onClick={() => setAbaAtiva('metas')} icon={<BarChart size={18} />} label="Metas" />
          <NavItem active={abaAtiva === 'equipes'} onClick={() => setAbaAtiva('equipes')} icon={<Users size={18} />} label="Equipes" />
          <NavItem active={abaAtiva === 'planilhas'} onClick={() => setAbaAtiva('planilhas')} icon={<Database size={18} />} label="Planilhas" />
          <NavItem active={abaAtiva === 'guias'} onClick={() => setAbaAtiva('guias')} icon={<FileText size={18} />} label="Guias (PPO)" />
        </nav>

        <div className="p-6 space-y-3">
          {isCoordenador && (
            <button onClick={() => setModoEdicao(!modoEdicao)} className={`w-full py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${modoEdicao ? 'bg-purple-600 shadow-lg shadow-purple-600/20 text-white' : 'bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400'}`}>
              {modoEdicao ? <><Save size={14} /> Finalizar Edição</> : <><Edit3 size={14} /> Modo Coordenação</>}
            </button>
          )}

          <button onClick={handleLogout} className="w-full py-3 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 text-red-500 hover:text-red-400 font-bold text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
            <LogOut size={14} /> Sair
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-12 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={abaAtiva}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-7xl mx-auto space-y-12"
          >
            {/* Header Hero */}
            <div className="relative h-64 w-full rounded-[40px] overflow-hidden border border-white/10 group">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent flex flex-col justify-center px-12">
                <h2 className="text-5xl font-black italic tracking-tighter mb-2">
                  {abaAtiva === 'inicio' ? 'Portal de Acesso' :
                    abaAtiva === 'metas' ? 'Painel de Metas' :
                      abaAtiva === 'equipes' ? 'Gestão de Pessoas' : `Módulo ${abaAtiva}`}
                </h2>
                <p className="text-purple-500 font-bold text-lg uppercase tracking-widest">
                  {abaAtiva === 'metas' ? 'Dashboard de Produção em Tempo Real' : 'Painel Administrativo v8.0'}
                </p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-purple-400 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                {abaAtiva} / {abaAtiva === 'metas' ? 'Dashboards' : 'Categorias'}
              </h3>

              {/* Actions: Botão Aparece em TODAS as abas se modo edição estiver ativo E for coordenador */}
              {modoEdicao && isCoordenador && (
                <button onClick={() => setModalCategoriaAberto(true)} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center gap-2 text-xs font-bold uppercase transition-all">
                  <Plus size={14} className="text-purple-500" /> Nova Categoria
                </button>
              )}
            </div>

            {/* --- CONTEÚDO DAS ABAS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categorias.map((cat) => (
                <div key={cat.id} className="group relative bg-[#0A0A0C]/80 backdrop-blur-md rounded-[30px] border border-white/5 hover:border-purple-500/30 p-6 transition-all hover:shadow-2xl hover:shadow-purple-900/10 flex flex-col h-[400px]"> {/* Altura fixa para alinhar cards */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                        {abaAtiva === 'metas' ? <BarChart size={20} /> : abaAtiva === 'equipes' ? <Users size={20} /> : <Globe size={20} />}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-xl font-bold text-white truncate">{cat.nome}</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">{cat.descricao || 'Sem descrição'}</p>
                      </div>
                    </div>
                    {modoEdicao && isCoordenador && (
                      <div className="flex gap-2">
                        {abaAtiva === 'metas' && (
                          <button onClick={() => setActiveConfigId(activeConfigId === cat.id ? null : cat.id)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${activeConfigId === cat.id ? 'bg-purple-500 text-white' : 'hover:bg-purple-500/20 text-white/20 hover:text-purple-500'}`}>
                            <Settings size={14} />
                          </button>
                        )}
                        <button onClick={() => removerCategoria(cat.id)} className="w-8 h-8 rounded-full hover:bg-red-500/20 text-white/20 hover:text-red-500 flex items-center justify-center transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CONTEÚDO DO CARD */}
                  <div className="flex-1 w-full min-h-0 relative bg-white/[0.02] rounded-2xl border border-white/5 overflow-y-auto custom-scrollbar">

                    {/* CASO 1: METAS -> CHART */}
                    {abaAtiva === 'metas' ? (
                      <div className="w-full h-full p-2">
                        {cat.link_csv ? (
                          <CategoryChart url={cat.link_csv} equipe={cat.nome} />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-white/20">
                            <Database size={32} className="mb-2 opacity-50" />
                            <p className="text-xs uppercase tracking-widest text-center">Configure o CSV</p>
                            {modoEdicao && isCoordenador && <p className="text-[9px] text-center mt-1 text-purple-400">Edite a categoria para adicionar o link</p>}
                          </div>
                        )}
                      </div>
                    ) :

                      /* CASO 2: OUTRAS ABAS (LINKS ou SERVIDORES) */
                      (
                        <div className="p-3 space-y-2">
                          {links.filter(l => l.categoria_id === cat.id).map(link => (
                            <div key={link.id} className={`group/link flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors ${modoEdicao && isCoordenador ? 'border-dashed border-white/20' : ''}`}>
                              <a
                                href={abaAtiva === 'equipes' || link.url === 'servidor' ? '#' : link.url}
                                target={abaAtiva === 'equipes' || link.url === 'servidor' ? '_self' : '_blank'}
                                rel="noreferrer"
                                className="flex-1 flex items-center gap-3 overflow-hidden"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500/40 group-hover/link:bg-purple-500 transition-colors shrink-0" />
                                <span className="text-sm font-medium text-gray-300 truncate hover:text-white transition-colors">
                                  {link.titulo}
                                </span>
                              </a>
                              <div className="flex items-center gap-2 shrink-0">
                                {modoEdicao && isCoordenador ? (
                                  <button onClick={() => removerLink(link.id)} className="w-6 h-6 rounded-full flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                                    <Trash2 size={12} />
                                  </button>
                                ) : (
                                  /* Só mostra icone de link externo se NÃO for aba equipes */
                                  abaAtiva !== 'equipes' && link.url !== 'servidor' && (
                                    <a href={link.url} target="_blank" rel="noreferrer" className="text-white/20 hover:text-purple-400 p-1 transition-colors">
                                      <ExternalLink size={12} />
                                    </a>
                                  )
                                )}
                              </div>
                            </div>
                          ))}
                          {links.filter(l => l.categoria_id === cat.id).length === 0 && (
                            <div className="text-center py-10 text-xs text-white/10 italic">
                              {abaAtiva === 'equipes' ? 'Nenhum servidor' : 'Nenhum item'}
                            </div>
                          )}
                        </div>
                      )}
                  </div>

                  {/* FOOTER DO CARD (BOTÃO ADICIONAR) */}
                  {/* Na aba METAS, não adicionamos itens dentro do card, pois vem do CSV. Apenas editamos o link CSV na categoria. */}
                  {abaAtiva !== 'metas' && (
                    <div className="pt-4 mt-4 border-t border-white/5">
                      {modoEdicao && isCoordenador ? (
                        <button
                          onClick={() => setModalLinkAberto({ aberto: true, categoriaId: cat.id })}
                          className="w-full py-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                        >
                          <Plus size={14} /> Adicionar {abaAtiva === 'equipes' ? 'Servidor' : 'Link'}
                        </button>
                      ) : (
                        <div className="w-full py-3 rounded-xl bg-white/[0.02] border border-white/5 text-white/30 text-[10px] font-bold uppercase tracking-wider text-center">
                          {abaAtiva === 'equipes' ? 'Equipe' : 'Acessar'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* FOOTER METAS (CONFIG) */}
                  {abaAtiva === 'metas' && modoEdicao && isCoordenador && activeConfigId === cat.id && (
                    <div className="pt-4 mt-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
                      <label className="text-[9px] text-purple-400 font-bold uppercase tracking-wider mb-1 block">Link da Planilha (CSV)</label>
                      <input
                        type="text"
                        defaultValue={cat.link_csv || ''}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white focus:border-purple-500 transition-colors outline-none"
                        placeholder="Cole o link CSV e pressione Enter..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            atualizarLinkCsv(cat.id, e.currentTarget.value)
                            setActiveConfigId(null) // Close after save
                            // Feedback visual via alert ou toast seria ideal, mas fechar já sinaliza.
                          }
                        }}
                      />
                    </div>
                  )}

                </div>
              ))}

              {categorias.length === 0 && (
                <div className="col-span-full py-20 text-center opacity-30">
                  <Database size={48} className="mx-auto mb-4" />
                  <p>Nenhuma categoria encontrada para {abaAtiva}.</p>
                </div>
              )}
            </div>

          </motion.div>
        </AnimatePresence>
      </main>

      {/* MODAL NOVA CATEGORIA */}
      {modalCategoriaAberto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md bg-[#0A0A0C] border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">
              Nova Categoria ({abaAtiva})
            </h3>
            <div className="space-y-4">
              {/* BLOCO DE FORMULÁRIO DE CATEGORIA/ITEM */}
              <div className="space-y-4">
                {/* Campo Nome/Título - Aparece em todas */}
                <div>
                  <label className="text-sm text-zinc-400">Nome da Categoria / Equipe</label>
                  <input
                    type="text"
                    className="w-full bg-zinc-900 border border-purple-500/30 rounded p-2 text-white focus:border-purple-500 outline-none"
                    value={nomeCategoria}
                    onChange={(e) => setNomeCategoria(e.target.value)}
                    placeholder="Ex: LICENÇA ou Produção RH"
                  />
                </div>

                {/* CAMPO EXCLUSIVO PARA ABA METAS: LINK DA PLANILHA CSV */}
                {isMetasTab && (
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <label className="text-sm text-purple-400 font-bold flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                      LINK DA PLANILHA GOOGLE (CSV)
                    </label>
                    <input
                      type="text"
                      className="w-full mt-2 bg-zinc-950 border border-purple-500/50 rounded p-2 text-white placeholder:text-zinc-600"
                      value={linkCsv}
                      onChange={(e) => setLinkCsv(e.target.value)}
                      placeholder="Cole aqui o link que termina em .csv"
                    />
                    <p className="text-[10px] text-zinc-500 mt-2 italic">
                      *Certifique-se que as colunas sejam: EQUIPE, METAS, METAS CUMPRIDAS
                    </p>
                  </div>
                )}

                {/* CAMPOS PARA OUTRAS ABAS (EXCETO EQUIPES E METAS) */}
                {(!isMetasTab && abaAtiva.toLowerCase() !== 'equipes') && (
                  <div>
                    <label className="text-sm text-zinc-400">URL do Link</label>
                    <input
                      type="text"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white"
                      value={urlLink}
                      onChange={(e) => setUrlLink(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setModalCategoriaAberto(false)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold transition-colors">Cancelar</button>
                <button onClick={adicionarCategoria} className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold shadow-lg shadow-purple-900/20 transition-all">
                  Criar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL NOVO LINK */}
      {modalLinkAberto.aberto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md bg-[#0A0A0C] border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">
              {abaAtiva === 'equipes' ? 'Adicionar Servidor' : 'Adicionar Link'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">
                  {abaAtiva === 'equipes' ? 'Nome do Servidor' : 'Título'}
                </label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50 transition-colors"
                  value={novoLink.titulo} onChange={e => setNovoLink({ ...novoLink, titulo: e.target.value })}
                  placeholder={abaAtiva === 'equipes' ? "Ex: Maria Silva" : "Ex: Portal X"} />
              </div>

              {abaAtiva !== 'equipes' && (
                <div>
                  <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">URL</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50 transition-colors"
                    value={novoLink.url} onChange={e => setNovoLink({ ...novoLink, url: e.target.value })} placeholder="https://..." />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button onClick={() => setModalLinkAberto({ aberto: false, categoriaId: null })} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold transition-colors">Cancelar</button>
                <button onClick={adicionarLink} className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold shadow-lg shadow-purple-900/20 transition-all">Salvar</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  )
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${active ? 'bg-purple-600/10 text-white border border-purple-500/20 shadow-[inset_0_0_10px_rgba(168,85,247,0.1)]' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
      <div className={`transition-colors ${active ? 'text-purple-400' : 'group-hover:text-purple-400'}`}>{icon}</div>
      <span className="font-bold text-[10px] uppercase tracking-widest">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7]"></div>}
    </button>
  )
}