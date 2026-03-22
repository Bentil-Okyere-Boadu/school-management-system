import { Calendar, Term } from "@/@types";

/** All terms from school calendars, latest first by startDate. */
export function getSortedSchoolTerms(calendars: Calendar[]): Term[] {
  const flat = calendars.flatMap((c) => c.terms || []);
  return [...flat].sort((a, b) => {
    const ta = a.startDate ? new Date(a.startDate).getTime() : 0;
    const tb = b.startDate ? new Date(b.startDate).getTime() : 0;
    return tb - ta;
  });
}
