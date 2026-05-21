"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/components/theme/theme-provider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Users, Vote, Calendar, TrendingUp } from "lucide-react";

interface DashboardData {
  stats: {
    total_eleitores: number;
    cadastros_mes: number;
    usuarios_ativos: number;
  };
  porBairro: { nome: string; total: number }[];
  rankingCadastradores: { nome: string; total: number }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((j) => j.success && setData(j.data));
  }, []);

  const stats = [
    {
      label: "Total de eleitores",
      value: data?.stats.total_eleitores ?? 0,
      icon: Vote,
      color: "text-indigo-600 dark:text-indigo-400",
    },
    {
      label: "Cadastros do mês",
      value: data?.stats.cadastros_mes ?? 0,
      icon: Calendar,
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Usuários ativos",
      value: data?.stats.usuarios_ativos ?? 0,
      icon: Users,
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Top cadastrador",
      value: data?.rankingCadastradores[0]?.total ?? 0,
      icon: TrendingUp,
      color: "text-violet-600 dark:text-violet-400",
    },
  ];

  const gridStroke = isDark ? "#334155" : "#e2e8f0";
  const tickColor = isDark ? "#94a3b8" : "#64748b";
  const tooltipStyle = {
    backgroundColor: isDark ? "#0f172a" : "#fff",
    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
    borderRadius: "8px",
    color: isDark ? "#f1f5f9" : "#0f172a",
  };

  return (
    <>
      <Header title="Dashboard" />
      <div className="page-content">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label}>
                <CardContent className="flex items-center gap-4 p-6">
                  <div
                    className={`rounded-xl bg-slate-100 p-3 dark:bg-slate-800 ${s.color}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Eleitores por bairro</CardTitle>
            </CardHeader>
            <CardContent className="h-56 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.porBairro ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="nome" tick={{ fontSize: 11, fill: tickColor }} />
                  <YAxis tick={{ fill: tickColor }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="total"
                    fill={isDark ? "#818cf8" : "#4f46e5"}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ranking de cadastradores</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {(data?.rankingCadastradores ?? []).map((r, i) => (
                  <li
                    key={r.nome}
                    className="flex items-center justify-between rounded-lg bg-slate-100 px-4 py-3 dark:bg-slate-800"
                  >
                    <span className="flex items-center gap-3 text-foreground">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                        {i + 1}
                      </span>
                      {r.nome}
                    </span>
                    <span className="font-semibold text-foreground">{r.total}</span>
                  </li>
                ))}
                {!data?.rankingCadastradores?.length && (
                  <p className="text-sm text-muted">Nenhum dado ainda.</p>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
