import type { CSSProperties } from "react";
import {
  Archive, ArrowRight, ArrowUp, Baby, BadgeCheck, BookMarked, BookOpen,
  CalendarClock, CalendarPlus, Check, ChevronRight, CircleDot, Clock,
  CloudUpload, Cross, Expand, FileText, FileType2, Footprints, GitCompare,
  GitFork, GitMerge, Heart, Image, Link, ListChecks, Loader, Mail, Map,
  MapPin, MessageCircle, Mic, Minus, Paperclip, Pencil, PenLine, Plus,
  Route, Save, Scan, Search, Send, Settings, Share2, ShieldCheck, Sparkles,
  Trash2, TriangleAlert, Upload, User, UserPlus, UserSearch, Users, X,
  type LucideIcon,
} from "lucide-react";

// Реестр: kebab-имена из дизайн-системы → компоненты lucide-react.
const ICONS: Record<string, LucideIcon> = {
  "archive": Archive, "arrow-right": ArrowRight, "arrow-up": ArrowUp,
  "baby": Baby, "badge-check": BadgeCheck, "book-marked": BookMarked,
  "book-open": BookOpen, "calendar-clock": CalendarClock, "calendar-plus": CalendarPlus,
  "check": Check, "chevron-right": ChevronRight, "circle-dot": CircleDot,
  "clock": Clock, "cross": Cross, "file-text": FileText, "file-type-2": FileType2,
  "footprints": Footprints, "git-compare": GitCompare, "git-fork": GitFork,
  "git-merge": GitMerge, "heart": Heart, "image": Image, "link": Link,
  "list-checks": ListChecks, "loader": Loader, "mail": Mail, "map": Map,
  "map-pin": MapPin, "message-circle": MessageCircle, "mic": Mic, "minus": Minus,
  "paperclip": Paperclip, "pen-line": PenLine, "pencil": Pencil, "plus": Plus,
  "route": Route, "save": Save, "scan": Scan, "search": Search, "send": Send,
  "settings": Settings, "share-2": Share2, "shield-check": ShieldCheck,
  "sparkles": Sparkles, "trash-2": Trash2, "triangle-alert": TriangleAlert,
  "upload": Upload, "upload-cloud": CloudUpload, "user": User,
  "user-plus": UserPlus, "user-search": UserSearch, "users": Users,
  "viewport": Expand, "x": X,
};

export interface IconProps {
  name: string;
  size?: number;
  stroke?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

/** Icon — иконка Lucide по kebab-имени; stroke 1.75 — архивная лёгкость. */
export function Icon({ name, size = 18, stroke = 1.75, className = "", style = {}, title }: IconProps) {
  const Cmp = ICONS[name];
  return (
    <span
      className={className}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: size, height: size, flex: "0 0 auto", color: "currentColor",
        ...style,
      }}
    >
      {Cmp && (
        <Cmp
          width={size}
          height={size}
          strokeWidth={stroke}
          aria-label={title}
          aria-hidden={title ? undefined : true}
          role={title ? "img" : undefined}
        />
      )}
    </span>
  );
}
