export type LocalCollabUser = {
  color: string;
  name: string;
};

const USER_KEY = "novel-collab:user";
const COLORS = ["#E11D48", "#2563EB", "#059669", "#7C3AED", "#EA580C", "#0F766E", "#BE185D", "#1D4ED8"];

const randomItem = <T,>(values: T[]) => values[Math.floor(Math.random() * values.length)];

const createRandomName = () => {
  const number = Math.floor(100 + Math.random() * 900);
  return `Guest-${number}`;
};

const isValidUser = (value: unknown): value is LocalCollabUser => {
  if (!value || typeof value !== "object") return false;

  const candidate = value as { color?: unknown; name?: unknown };
  return typeof candidate.name === "string" && candidate.name.length > 0 && typeof candidate.color === "string";
};

export const getLocalCollabUser = (): LocalCollabUser => {
  if (typeof window === "undefined") {
    return { color: COLORS[0], name: "Guest" };
  }

  try {
    const stored = window.sessionStorage.getItem(USER_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (isValidUser(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Ignore malformed storage data.
  }

  const user = {
    color: randomItem(COLORS),
    name: createRandomName(),
  };

  try {
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Ignore private mode/quota errors.
  }

  return user;
};
