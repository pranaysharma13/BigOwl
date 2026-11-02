import { Link } from 'react-router';
import { usePageTitle } from '../lib/usePageTitle';

const UPDATED = '2 November 2026';

export function Privacy() {
  usePageTitle('Privacy');
  return (
    <div className="wrap page">
      <header className="phead">
        <span className="lbl ink sq">Privacy</span>
        <h1 className="display">What we keep.</h1>
        <p className="lede">BigOwl is a small, free study site run by one person for friends. It collects as little as possible and never sells or shares it.</p>
        <span className="lbl">Last updated {UPDATED}</span>
      </header>
      <div className="legal">
        <h2>Who runs this</h2>
        <p>BigOwl is a personal, non-commercial project. The person who invited you to it is responsible for your data. To ask a question or exercise any right below, contact them directly.</p>

        <h2>What is collected</h2>
        <table>
          <thead><tr><th>Data</th><th>Why</th><th>Where</th></tr></thead>
          <tbody>
            <tr><td>Your email address</td><td>To send sign-in links and identify your account</td><td>Supabase (authentication)</td></tr>
            <tr><td>The date you confirmed you are old enough to use the site</td><td>To meet age rules for online services</td><td>Supabase (account record)</td></tr>
            <tr><td>Learning progress: topics read and watched, quiz and assessment scores, prediction accuracy, problems marked solved, days you were active, code-language preference</td><td>To show and sync your progress</td><td>Supabase database, readable only by your account</td></tr>
            <tr><td>Standard request logs: IP address, browser type, time</td><td>Hosting, security and abuse prevention</td><td>Vercel (hosting) and Supabase</td></tr>
          </tbody>
        </table>
        <p>BigOwl has no analytics, advertising, tracking pixels, session recording or third-party scripts. Fonts are served from the site itself.</p>

        <h2>Storage on your device</h2>
        <p>The site stores a copy of your progress, your sign-in session and your light or dark theme choice in your browser’s local storage. These are needed for the site to work as you asked, so no consent banner is used. No advertising or tracking cookies are set.</p>

        <h2>Service providers</h2>
        <ul>
          <li><b>Supabase</b> stores accounts and progress and sends sign-in emails. Data is hosted in the Americas region.</li>
          <li><b>Vercel</b> hosts the website and keeps short-lived request logs.</li>
        </ul>
        <p>Both act only on BigOwl’s behalf under their own data processing terms. If you are outside the United States, your data is transferred there.</p>

        <h2>Legal basis</h2>
        <p>If you are in the EU or UK: your data is processed because you asked for an account and progress tracking (performance of a service you requested), and request logs are kept for security (legitimate interest).</p>

        <h2>How long it is kept</h2>
        <p>Your account and progress are kept until you delete them. Assessment history is capped at your last 50 results and activity dates at 400 days. Deleting your account removes your email and progress immediately; provider backups expire on their own schedule.</p>

        <h2>Your choices and rights</h2>
        <ul>
          <li><b>See and download</b> everything stored about you: <Link to="/account">Account → Download my data</Link>.</li>
          <li><b>Delete</b> your account and all progress at any time: <Link to="/account">Account → Delete my account</Link>.</li>
          <li><b>Use the site without an account.</b> Progress then stays only in your browser.</li>
          <li>Ask for correction, restriction or objection by contacting the site owner. In the EU or UK you may also complain to your data protection authority.</li>
        </ul>

        <h2>Children</h2>
        <p>BigOwl is not meant for children under 13, or under 16 in the EU and UK. Sign-in requires confirming your age. If you believe a child has signed up, contact the site owner and the account will be deleted.</p>

        <h2>Changes</h2>
        <p>If this page changes, the date at the top is updated. Significant changes will be pointed out on the site.</p>
      </div>
    </div>
  );
}

export function About() {
  usePageTitle('About');
  return (
    <div className="wrap page">
      <header className="phead">
        <span className="lbl ink sq">About</span>
        <h1 className="display">Credits and notices.</h1>
        <p className="lede">BigOwl is an independent study aid for data structures and algorithms, made for friends.</p>
      </header>
      <div className="legal">
        <h2>The textbook</h2>
        <p>The curriculum follows <i>Introduction to Algorithms</i>, 3rd edition, by Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest and Clifford Stein (MIT Press, 2009). Section numbers are given so you can read along in your own copy. All explanations, pseudocode, figures and questions on BigOwl are original. BigOwl is not affiliated with, sponsored by or endorsed by MIT Press or the authors.</p>
        <h2>Interview problems</h2>
        <p>Problem names and numbers refer to problems on LeetCode, linked for practice. LeetCode is a trademark of its owner. BigOwl is not affiliated with LeetCode and does not copy its problem statements.</p>
        <h2>Fonts</h2>
        <p>Archivo, Newsreader, Geist and Geist Mono, all under the SIL Open Font License 1.1, served from this site.</p>
        <h2>How mastery is measured</h2>
        <p>Each topic’s mastery combines four signals: reading the theory (15%), watching the figure to the end (15%), your best concept-check score (40%), and how often you predict the next step correctly on the first try (30%). Marking a topic as learned sets it to 100%.</p>
      </div>
    </div>
  );
}
