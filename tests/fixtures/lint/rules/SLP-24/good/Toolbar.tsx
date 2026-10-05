import { Search, ChevronDown, Calendar } from 'lucide-react';

export function Toolbar() {
  return (
    <div>
      <Search aria-hidden="true" />
      <Calendar aria-hidden="true" />
      <ChevronDown aria-hidden="true" />
    </div>
  );
}
