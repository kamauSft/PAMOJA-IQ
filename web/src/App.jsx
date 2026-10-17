import { Link, Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import meeting from "./photos/chama-meeting.jpg";
import morning from "./photos/member-morning.jpg";
import treasurer from "./photos/treasurer-desk.jpg";
import { desk, memberBooks } from "./data";

function Brand() {
  return (
    <Link to="/" className="brand">
      <span>Pamoja IQ</span>
      <small>Intelligent Chama Solution</small>
    </Link>
  );
}

function DemoFlag() {
  return <p className="demo">Demo · sample data</p>;
}

function Frame({ children }) {
  return <div className="shell">{children}</div>;
}

function Landing() {
  return (
    <Frame>
      <header className="bar">
        <Brand />
        <nav>
          <DemoFlag />
          <Link to="/real" className="line">
            Open the real app
          </Link>
        </nav>
      </header>
      <section className="hero">
        <div>
          <p className="kicker">A sample, not the books</p>
          <h1>Clear, private records for every chama member.</h1>
          <p className="lead">These screens use made-up names and numbers. Nothing here is a real chama.</p>
          <div className="actions">
            <Link to="/member" className="solid">
              See the member demo
            </Link>
            <Link to="/treasurer" className="line">
              See the treasurer demo
            </Link>
          </div>
        </div>
        <figure>
          <img src={meeting} alt="Six chama members reviewing papers around a wooden table" />
          <figcaption>The meeting, kept in order.</figcaption>
        </figure>
      </section>
      <section className="pair">
        <article>
          <img src={treasurer} alt="A treasurer comparing a handwritten register with a laptop" />
          <h2>The treasurer’s desk</h2>
          <p>One register. One set of books. The sample opens with no sign-in.</p>
        </article>
        <article>
          <img src={morning} alt="A member reading a message on a phone beside a window" />
          <h2>The member’s own page</h2>
          <p>A member sees only their own position. A neighbour’s savings stay off that screen.</p>
        </article>
      </section>
      <footer>
        <p>Sample data only. The real books stay in the private app.</p>
      </footer>
    </Frame>
  );
}

function MemberDemo() {
  const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
  return (
    <Frame>
      <header className="bar">
        <Brand />
        <nav>
          <DemoFlag />
          <Link to="/treasurer">Treasurer demo</Link>
          <Link to="/">Home</Link>
        </nav>
      </header>
      <section className="banner">
        <img src={morning} alt="A member reading a message on a phone beside a window" />
      </section>
      <p className="kicker">Today</p>
      <h1>{memberBooks.name}, this is your own page.</h1>
      <section className="card flat">
        <h2>{memberBooks.line}</h2>
        <p className="quiet">{memberBooks.proverb}</p>
      </section>
      <section className="card flat">
        <h2>Reminders</h2>
        <p>{memberBooks.month}</p>
        <p>{memberBooks.reminder}</p>
      </section>
      <section className="stats">
        <article><p>Savings</p><strong>{memberBooks.savings}</strong></article>
        <article><p>Loan still due</p><strong>{memberBooks.loan}</strong></article>
        <article><p>Unpaid fines</p><strong>{memberBooks.fines}</strong></article>
        <article><p>Net</p><strong>{memberBooks.net}</strong></article>
      </section>
      <section className="card flat">
        <h2>Your months</h2>
        <p>{memberBooks.streak}</p>
        <div className="months">
          {months.map((month) => (
            <span key={month}><i />{month}</span>
          ))}
        </div>
      </section>
      <section className="card flat">
        <h2>Goal</h2>
        <p>{memberBooks.goal}</p>
        <div className="track"><div /></div>
      </section>
    </Frame>
  );
}

function TreasurerDemo() {
  return (
    <Frame>
      <header className="bar">
        <Brand />
        <nav>
          <DemoFlag />
          <Link to="/member">Member demo</Link>
          <Link to="/">Home</Link>
        </nav>
      </header>
      <section className="banner">
        <img src={treasurer} alt="A treasurer comparing a handwritten register with a laptop" />
      </section>
      <p className="kicker">Treasurer desk</p>
      <h1>{desk.chama}</h1>
      <p className="quiet">A sample register. These phone numbers are not real.</p>
      <section className="stats">
        <article><p>Savings</p><strong>{desk.savings}</strong></article>
        <article><p>Loans out</p><strong>{desk.loans}</strong></article>
        <article><p>Collected</p><strong>{desk.collected}</strong></article>
        <article><p>On time</p><strong>{desk.onTime}</strong></article>
      </section>
      <section className="card flat">
        <h2>Still to pay</h2>
        {desk.behind.map((row) => (
          <p key={row.name}><strong>{row.name}.</strong> {row.detail}</p>
        ))}
      </section>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>No.</th><th>Name</th><th>Phone</th><th>Savings</th><th>October</th></tr>
          </thead>
          <tbody>
            {desk.rows.map((row) => (
              <tr key={row[0]}>{row.map((cell) => <td key={`${row[0]}-${cell}`}>{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </Frame>
  );
}

function RealApp() {
  return (
    <Frame>
      <header className="bar">
        <Brand />
        <nav>
          <DemoFlag />
          <Link to="/">Home</Link>
        </nav>
      </header>
      <section className="card">
        <p className="kicker">The real app</p>
        <h1>The secure link comes next.</h1>
        <p className="quiet">This public page is only a sample. The private books stay on the computer until the secure address is ready.</p>
        <Link to="/" className="solid">Back to the sample</Link>
      </section>
    </Frame>
  );
}

function OldDoor() {
  const [params] = useSearchParams();
  return <Navigate to={params.get("door") === "treasurer" ? "/treasurer" : "/member"} replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/member" element={<MemberDemo />} />
      <Route path="/treasurer" element={<TreasurerDemo />} />
      <Route path="/real" element={<RealApp />} />
      <Route path="/login" element={<OldDoor />} />
      <Route path="/home" element={<Navigate to="/member" replace />} />
      <Route path="/desk" element={<Navigate to="/treasurer" replace />} />
      <Route path="/reset" element={<Navigate to="/" replace />} />
      <Route path="/welcome" element={<Navigate to="/member" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
