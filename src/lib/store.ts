const KEY_TOUR = "dejavu.tour.done";

export function tourSeen(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(KEY_TOUR) === "1";
}

export function markTourSeen(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_TOUR, "1");
}
