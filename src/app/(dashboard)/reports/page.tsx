"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  BarChart3, CircleDot, Layers, Shirt, Package,
  ArrowUpRight, Clock, AlertTriangle, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";

interface ReportData {
  yarnStock: { items: number; totalKgs: number };
  fabricStock: { items: number; totalKgs: number };
  garmentStock: { items: number; totalPcs: number };
  accessoryStock: { items: number; totalQty: number };
  pendingOutward: number;
  pendingOutwardBreakdown: { yarn: number; fabric: number; garment: number };
  overdueDCs: number;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then(setData)
      .catch(() => toast.error("Failed to load reports"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const reports = [
    {
      title: "Yarn Stock",
      description: `${data?.yarnStock.items ?? 0} items, ${(data?.yarnStock.totalKgs ?? 0).toFixed(1)} Kgs`,
      icon: CircleDot, color: "text-blue-600", bg: "bg-blue-50",
      href: "/yarn/stock",
    },
    {
      title: "Fabric Stock",
      description: `${data?.fabricStock.items ?? 0} items, ${(data?.fabricStock.totalKgs ?? 0).toFixed(1)} Kgs`,
      icon: Layers, color: "text-emerald-600", bg: "bg-emerald-50",
      href: "/fabric/stock",
    },
    {
      title: "Garment Stock",
      description: `${data?.garmentStock.items ?? 0} items, ${data?.garmentStock.totalPcs ?? 0} Pcs`,
      icon: Shirt, color: "text-violet-600", bg: "bg-violet-50",
      href: "/garment/stock",
    },
    {
      title: "Accessory Stock",
      description: `${data?.accessoryStock.items ?? 0} items, ${(data?.accessoryStock.totalQty ?? 0).toFixed(0)} units`,
      icon: Package, color: "text-orange-600", bg: "bg-orange-50",
      href: "/accessory/stock",
    },
    {
      title: "Pending Outward DCs",
      description: `${data?.pendingOutward ?? 0} open (Y:${data?.pendingOutwardBreakdown.yarn ?? 0} F:${data?.pendingOutwardBreakdown.fabric ?? 0} G:${data?.pendingOutwardBreakdown.garment ?? 0})`,
      icon: ArrowUpRight, color: "text-amber-600", bg: "bg-amber-50",
      href: "/yarn/process-outward",
    },
    {
      title: "Overdue DCs",
      description: `${data?.overdueDCs ?? 0} DCs past target date`,
      icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50",
      href: "/yarn/process-outward",
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Reports</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <Link key={r.title} href={r.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className={`rounded-lg p-2.5 ${r.bg}`}>
                    <Icon className={`h-5 w-5 ${r.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{r.title}</CardTitle>
                    <CardDescription className="text-sm">{r.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View Report →
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
