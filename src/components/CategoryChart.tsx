'use client'
import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { BarChart3 } from 'lucide-react'

interface CategoryChartProps {
    url?: string;
    equipe: string;
}

interface ChartData {
    name: string;
    expectativa: number;
    realidade: number;
    porcentagem: number;
    nameTooltip?: string;
}

export default function CategoryChart({ url, equipe }: CategoryChartProps) {
    const [data, setData] = useState<ChartData[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!url) return

        setLoading(true)
        setError(null)

        const fetchData = async () => {
            try {
                const proxyUrl = url.includes('output=csv') ? url : url
                const response = await fetch(proxyUrl);

                if (!response.ok) {
                    throw new Error(`Erro HTTP: ${response.status}`);
                }

                const csvTexto = await response.text();
                const result = Papa.parse(csvTexto, { header: false, skipEmptyLines: true });
                const linhas = result.data as string[][];

                console.log("Parsed CSV Data (First 5):", linhas.slice(0, 5));

                // Start from index 1 to skip header
                for (let i = 1; i < linhas.length; i++) {
                    const colunas = linhas[i];

                    // Index Mapping: 0=EQUIPE, 2=METAS, 3=METAS CUMPRIDAS
                    const colEquipe = colunas[0];
                    const equipeAtual = String(colEquipe || '').trim().toUpperCase();
                    const equipeAlvo = String(equipe || '').trim().toUpperCase();

                    // Robust Comparison
                    if (equipeAtual === equipeAlvo) {
                        const parseNumber = (val: any) => {
                            if (!val) return 0;
                            const cleanVal = String(val).replace(',', '.').replace(/[^\d.-]/g, '');
                            return Number(cleanVal) || 0;
                        }

                        const expectativa = parseNumber(colunas[2]); // Column 2
                        const realidade = parseNumber(colunas[3]);   // Column 3

                        // Percentage Calculation
                        let porcentagem = 0;
                        if (expectativa > 0) {
                            porcentagem = (realidade / expectativa) * 100;
                        } else if (realidade > 0) {
                            porcentagem = 100;
                        }

                        // Round to 1 decimal place
                        porcentagem = Math.round(porcentagem * 10) / 10;

                        dadosParaGrafico.push({
                            name: equipe,
                            expectativa,
                            realidade,
                            porcentagem,
                            nameTooltip: colunas[1] // Owner/Details
                        });
                    }
                }

                if (dadosParaGrafico.length === 0) {
                    console.warn(`Sem dados para: ${equipe}`);
                    setData([])
                } else {
                    setData(dadosParaGrafico)
                }

            } catch (err) {
                console.error("Erro ao processar dados:", err)
                setError("Erro ao carregar dados")
            } finally {
                setLoading(false)
            }
        };

        fetchData();
    }, [url, equipe])

    if (!url) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-white/20">
                <BarChart3 size={32} className="mb-2 opacity-50" />
                <p className="text-xs uppercase tracking-widest text-center">Sem Link CSV</p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-white/20 animate-pulse">
                <BarChart3 size={32} className="mb-2 opacity-50" />
                <p className="text-xs uppercase tracking-widest text-center">Carregando...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-red-400/50">
                <p className="text-xs uppercase tracking-widest text-center">{error}</p>
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-white/20">
                <p className="text-xs uppercase tracking-widest text-center">Sem dados para {equipe}</p>
            </div>
        )
    }

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const dados = payload[0].payload as ChartData;
            return (
                <div className="bg-black/90 border border-white/10 p-3 rounded-xl shadow-xl backdrop-blur-md">
                    <p className="text-white font-bold mb-2">{dados.name}</p>
                    <p className="text-zinc-400 text-xs">Expectativa: <span className="text-white font-mono">{dados.expectativa}</span></p>
                    <p className="text-zinc-400 text-xs">Realidade: <span className="text-white font-mono">{dados.realidade}</span></p>
                    <div className="mt-2 pt-2 border-t border-white/10">
                        <p className="text-xs font-bold" style={{ color: dados.porcentagem >= 50 ? '#10b981' : '#fbbf24' }}>
                            Progresso: {dados.porcentagem}%
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" hide />
                    <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }} />

                    {/* Barra de Expectativa (Meta) - Roxo Suave/Neutro */}
                    <Bar dataKey="expectativa" name="Expectativa (Meta)" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />

                    {/* Barra de Realidade (Realizado) - Cor Dinâmica + Label */}
                    <Bar dataKey="realidade" name="Realidade (Cumprido)" radius={[4, 4, 0, 0]} barSize={30}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.porcentagem >= 50 ? '#10b981' : '#fbbf24'} />
                        ))}
                        <LabelList dataKey="porcentagem" position="top" formatter={(val: any) => `${val}%`} fill="white" fontSize={10} fontWeight="bold" />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
