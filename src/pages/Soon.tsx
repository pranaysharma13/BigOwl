import { PillLink } from '../components/Pill';
import { usePageTitle } from '../lib/usePageTitle';

export function Soon({ title }: { title: string }) {
  usePageTitle(title);
  return (
    <div className="wrap page">
      <header className="phead">
        <span className="lbl ink sq">In progress</span>
        <h1 className="display">{title}.</h1>
        <p className="lede">This section is being built and will appear here shortly.</p>
      </header>
      <div><PillLink to="/learn">Open the contents</PillLink></div>
    </div>
  );
}
