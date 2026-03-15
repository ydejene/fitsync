export function formatETB(amount: number): string {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-ET", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-ET", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getDaysUntilExpiry(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getMembershipStatusColor(feeStatus: string, endDate: string): string {
  const daysLeft = getDaysUntilExpiry(endDate);
  if (feeStatus === "OVERDUE" || daysLeft < 0) return "text-red-600 bg-red-50";
  if (daysLeft <= 7) return "text-orange-600 bg-orange-50";
  if (feeStatus === "PAID") return "text-green-600 bg-green-50";
  return "text-yellow-600 bg-yellow-50";
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getInitials(name: string | undefined | null): string {
  if (!name || typeof name !== 'string') return "??";
  
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
    totalPages: Math.ceil(items.length / pageSize),
  };
}