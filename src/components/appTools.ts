import {
  BarChart3,
  Calculator,
  Car,
  CheckSquare,
  ClipboardCheck,
  FileCheck,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  Package,
  RefreshCw,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export const appToolIconMap: Record<string, LucideIcon> = {
  Calculator,
  Car,
  Image: ImageIcon,
  FileCheck,
  CheckSquare,
  Wrench,
  Package,
  BarChart3,
  RefreshCw,
  FileText,
  ClipboardCheck,
};

export const getAppToolIcon = (iconName: string): LucideIcon => appToolIconMap[iconName] || LayoutGrid;
