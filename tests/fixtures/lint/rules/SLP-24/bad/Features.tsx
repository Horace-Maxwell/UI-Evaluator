import { Sparkles, Calendar } from 'lucide-react'; // expect: SLP-24
import { FiClock } from 'react-icons/fi'; // expect: SLP-24

export function Features() {
  return (
    <ul>
      <li><Sparkles aria-hidden="true" /> Summaries</li>
      <li><Calendar aria-hidden="true" /> Rotas</li>
      <li><FiClock aria-hidden="true" /> Timesheets</li>
    </ul>
  );
}
