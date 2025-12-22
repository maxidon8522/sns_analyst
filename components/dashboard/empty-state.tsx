import { BarChart3, type LucideIcon } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
};

export function EmptyState({
  title,
  description,
  icon: Icon = BarChart3
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
      <Icon className="h-8 w-8 text-slate-400" />
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );
}
