import {
  // Section tiles
  Cpu,
  TrendUp,
  StackSimple,
  BookOpen,
  Sparkle,
  Briefcase,
  Wrench,
  HardDrives,
  Database,
  Target,
  Globe,
  Shield,
  GitBranch,
  Package,
  Atom,
  Compass,
  // Sidebar nav
  House,
  GridFour,
  Bookmark,
  ChartBar,
  Question,
  ClipboardText,
  Calendar,
  ChatCircle,
  // Top chrome
  MagnifyingGlass,
  Bell,
  CaretDown,
  CaretRight,
  // Browse / content
  X,
  Info,
  SignOut,
  Users,
  ArrowLeft,
  // Concept-specific
  TreeStructure,
  Eye,
  TextAa,
  Graph,
  Books,
  ThumbsUp,
  CheckCircle,
  Cube,
  ChatCircleText,
  Brain,
  Scroll,
  FrameCorners,
  Sliders,
  ArrowsLeftRight,
  Ghost,
  LockOpen,
  Robot,
  ImagesSquare,
  Buildings,
  GitFork,
  PenNib,
  Code,
  MagnifyingGlassPlus,
  GraphicsCard,
  Circuitry,
  Lightning,
  CurrencyDollar,
  ArrowsClockwise,
  ChartLineUp,
  Flask,
  Gear,
  Medal,
  Scales,
  Infinity,
  Flag,
  Lock,
  Gavel,
  Warning,
  Copyright,
  EyeSlash,
  ListChecks,
  CaretCircleDown,
  Image as ImageIcon,
  Planet,
  Car,
  Dna,
  ChatCircleDots,
  SlidersHorizontal,
  FileText,
  Funnel,
  CircleDashed,
  CircleHalf,
  CirclesThreePlus,
} from "@phosphor-icons/react";
import type { Icon as PhosphorIcon, IconWeight } from "@phosphor-icons/react";

export type IconName =
  // Section tiles
  | "cpu" | "trending-up" | "layers" | "book-open" | "sparkles"
  | "briefcase" | "wrench" | "server" | "database" | "target"
  | "globe" | "shield" | "git-branch" | "box" | "atom" | "compass"
  // Sidebar nav
  | "home" | "grid" | "bookmark" | "bookmark-filled" | "bar-chart"
  | "help-circle" | "clipboard-check" | "calendar" | "message-square"
  // Top chrome
  | "search" | "bell" | "sparkle" | "chevron-down"
  // Browse / content
  | "chevron-right" | "x" | "info" | "logout" | "users" | "arrow-left"
  // Concept-specific
  | "tree-structure" | "eye" | "text-aa" | "graph" | "books" | "thumbs-up"
  | "check-circle" | "cube" | "chat-circle-text" | "brain" | "scroll"
  | "frame-corners" | "sliders" | "arrows-left-right" | "ghost" | "lock-open"
  | "robot" | "images-square" | "buildings" | "git-fork" | "pen-nib" | "code"
  | "magnifying-glass-plus" | "graphics-card" | "circuitry" | "lightning"
  | "currency-dollar" | "arrows-clockwise" | "chart-line-up" | "flask" | "gear"
  | "medal" | "scales" | "infinity" | "flag" | "lock" | "gavel" | "warning"
  | "copyright" | "eye-slash" | "list-checks" | "caret-circle-down" | "image"
  | "planet" | "car" | "dna" | "chat-circle-dots" | "sliders-horizontal"
  | "file-text" | "funnel" | "magnifying-glass"
  // Tier indicators
  | "circle-dashed" | "circle-half" | "circles-three-plus";

const REGISTRY: Record<IconName, PhosphorIcon> = {
  // Section tiles
  "cpu": Cpu,
  "trending-up": TrendUp,
  "layers": StackSimple,
  "book-open": BookOpen,
  "sparkles": Sparkle,
  "briefcase": Briefcase,
  "wrench": Wrench,
  "server": HardDrives,
  "database": Database,
  "target": Target,
  "globe": Globe,
  "shield": Shield,
  "git-branch": GitBranch,
  "box": Package,
  "atom": Atom,
  "compass": Compass,
  // Sidebar nav
  "home": House,
  "grid": GridFour,
  "bookmark": Bookmark,
  "bookmark-filled": Bookmark,
  "bar-chart": ChartBar,
  "help-circle": Question,
  "clipboard-check": ClipboardText,
  "calendar": Calendar,
  "message-square": ChatCircle,
  // Top chrome
  "search": MagnifyingGlass,
  "bell": Bell,
  "sparkle": Sparkle,
  "chevron-down": CaretDown,
  // Browse / content
  "chevron-right": CaretRight,
  "x": X,
  "info": Info,
  "logout": SignOut,
  "users": Users,
  "arrow-left": ArrowLeft,
  // Concept-specific
  "tree-structure": TreeStructure,
  "eye": Eye,
  "text-aa": TextAa,
  "graph": Graph,
  "books": Books,
  "thumbs-up": ThumbsUp,
  "check-circle": CheckCircle,
  "cube": Cube,
  "chat-circle-text": ChatCircleText,
  "brain": Brain,
  "scroll": Scroll,
  "frame-corners": FrameCorners,
  "sliders": Sliders,
  "arrows-left-right": ArrowsLeftRight,
  "ghost": Ghost,
  "lock-open": LockOpen,
  "robot": Robot,
  "images-square": ImagesSquare,
  "buildings": Buildings,
  "git-fork": GitFork,
  "pen-nib": PenNib,
  "code": Code,
  "magnifying-glass-plus": MagnifyingGlassPlus,
  "graphics-card": GraphicsCard,
  "circuitry": Circuitry,
  "lightning": Lightning,
  "currency-dollar": CurrencyDollar,
  "arrows-clockwise": ArrowsClockwise,
  "chart-line-up": ChartLineUp,
  "flask": Flask,
  "gear": Gear,
  "medal": Medal,
  "scales": Scales,
  "infinity": Infinity,
  "flag": Flag,
  "lock": Lock,
  "gavel": Gavel,
  "warning": Warning,
  "copyright": Copyright,
  "eye-slash": EyeSlash,
  "list-checks": ListChecks,
  "caret-circle-down": CaretCircleDown,
  "image": ImageIcon,
  "planet": Planet,
  "car": Car,
  "dna": Dna,
  "chat-circle-dots": ChatCircleDots,
  "sliders-horizontal": SlidersHorizontal,
  "file-text": FileText,
  "funnel": Funnel,
  "magnifying-glass": MagnifyingGlass,
  // Tier indicators
  "circle-dashed": CircleDashed,
  "circle-half": CircleHalf,
  "circles-three-plus": CirclesThreePlus,
};

export function Icon({
  name,
  size = 18,
  weight,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  weight?: IconWeight;
  className?: string;
  style?: React.CSSProperties;
  /** @deprecated Phosphor uses `weight` instead. Accepted for caller compat; ignored. */
  strokeWidth?: number;
}) {
  const Cmp = REGISTRY[name];
  const resolvedWeight: IconWeight = weight ?? (name === "bookmark-filled" ? "fill" : "regular");
  return (
    <Cmp
      size={size}
      weight={resolvedWeight}
      className={className}
      style={{ display: "block", flexShrink: 0, ...style }}
      aria-hidden
    />
  );
}
