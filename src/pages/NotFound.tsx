import { PillLink } from '../components/Pill';
import { usePageTitle } from '../lib/usePageTitle';

export function NotFound() {
  usePageTitle('Not found');
  return (
    <div className="wrap page">
      <header className="phead">
        <span className="lbl ink sq">404</span>
        <h1 className="display">Off the map.</h1>
        <p className="lede">That page does not exist. It may have moved, or the link has a typo.</p>
      </header>
      <div className="acts">
        <PillLink to="/">Go home</PillLink>
        <PillLink to="/learn" variant="ghost">Open the contents</PillLink>
      </div>
    </div>
  );
}
