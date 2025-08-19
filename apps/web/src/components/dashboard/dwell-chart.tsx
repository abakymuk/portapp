"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface DwellData {
  range: string;
  count: number;
}

export function DwellChart() {
  const [data, setData] = useState<DwellData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDwellData() {
      const supabase = createClient();

      try {
        const { data: dwellData, error } = await supabase
          .from("mv_dwell")
          .select("dwell_hours")
          .not("dwell_hours", "is", null)
          .limit(1000);

        if (error) throw error;

        // Группировка данных по диапазонам
        const ranges = [
          { min: 0, max: 24, label: "0-24ч" },
          { min: 24, max: 48, label: "24-48ч" },
          { min: 48, max: 72, label: "48-72ч" },
          { min: 72, max: 168, label: "3-7 дней" },
          { min: 168, max: null, label: "7+ дней" },
        ];

        const groupedData = ranges.map((range) => ({
          range: range.label,
          count:
            dwellData?.filter((item) => {
              const hours = item.dwell_hours || 0;
              return (
                hours >= range.min && (range.max === null || hours < range.max)
              );
            }).length || 0,
        }));

        setData(groupedData);
      } catch (error) {
        console.error("Error fetching dwell data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDwellData();
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">Загрузка...</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="range" />
        <YAxis />
        <Tooltip
          formatter={(value: number) => [`${value} контейнеров`, "Количество"]}
          labelFormatter={(label) => `Dwell time: ${label}`}
        />
        <Bar dataKey="count" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
}
