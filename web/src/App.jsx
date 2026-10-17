import { useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import { resetPin, restoreOriginalPin, sessionOpen, signIn, signOut } from "./auth.js";
import { desk, memberBooks, ORIGINAL_PIN, PRACTICE_PHONE } from "./data.js";
import meeting from "./photos/chama-meeting.jpg";
import treasurer from "./photos/treasurer-desk.jpg";
import morning from "./photos/member-morning.jpg";

function Brand() {
  return (
    <Link className="brand" to="/">
      <span className="mark">P</span>
      <span>
        <strong>Pamoja IQ</strong>
        <span>Intelligent Chama Solution</span>
      </span>
    </Link>
  );
}

function Gate({ children }) {
  if (!sessionOpen()) return <Navigate to="/login?door=member" replace />;
  return children;
}

function Landing() {
  return (
    <>
      <header className="wrap top">
        <Brand />
      </header>
      <section className="hero">
        <img src={meeting} alt="A chama meeting around a table, reviewing the month's records" />
        <div className="shade">
          <div className="wrap">
            <h1>Clear, private records for every chama member.</h1>
            <p>The treasurer keeps one set of books. Each member opens only their own account.</p>
            <div className="actions">
              <Link className="btn" to="/login?door=member">Sign in</Link>
              <Link className="ghost" to="/login?door=treasurer">For treasurers</Link>
            </div>
          </div>
        </div>
      </section>
      <section className="wrap facts">
        <div><strong>Upload records</strong><p className="muted">One register for the whole group.</p></div>
        <div><strong>A private account</strong><p className="muted">A member sees only their own figures.</p></div>
        <div><strong>A calm reminder</strong><p className="muted">What is due, before the date passes.</p></div>
      </section>
      <section className="wrap panel">
        <img src={treasurer} alt="A treasurer checking the register beside a laptop" />
        <div>
          <h2>Practice books for 0707436816</h2>
          <p>The same number opens the member account and the treasurer desk. These figures are for a demonstration. They are not a live chama.</p>
          <p>Five wrong tries lock this browser for 15 minutes. A new PIN stays on this browser only. The original practice PIN can be restored.</p>
          <p><Link to="/reset">Reset the PIN</Link></p>
        </div>
      </section>
    </>
  );
}

function Login() {
  const [params] = useSearchParams();
  const door = params.get("door") === "treasurer" ? "treasurer" : "member";
  const navigate = useNavigate();
  const [phone, setPhone] = useState(PRACTICE_PHONE);
  const [pin, setPin] = useState("");
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");

  function submit(event) {
    event.preventDefault();
    const result = signIn(phone, pin);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    navigate(door === "treasurer" ? "/desk" : "/home");
  }

  return (
    <main className="door">
      <Brand />
      <h1>{door === "treasurer" ? "Treasurer" : "Member"}</h1>
      <p className="muted">Practice sign-in for {PRACTICE_PHONE}. The original PIN is {ORIGINAL_PIN}.</p>
      <form className="card" onSubmit={submit}>
        <label>
          Phone
          <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="username" />
        </label>
        <label>
          PIN
          <span className="row">
            <input value={pin} onChange={(event) => setPin(event.target.value)} type={show ? "text" : "password"} inputMode="numeric" autoComplete="current-password" />
            <button className="ghost" style={{ color: "var(--navy)", borderColor: "var(--line)" }} type="button" onClick={() => setShow((value) => !value)}>{show ? "Hide" : "Show"}</button>
          </span>
        </label>
        <button className="btn full" type="submit">Continue</button>
        {message ? <p className="error" role="alert">{message}</p> : null}
      </form>
      <p><Link to="/reset">Forgot PIN? Set a new one</Link></p>
    </main>
  );
}

function Reset() {
  const [phone, setPhone] = useState(PRACTICE_PHONE);
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");

  function submit(event) {
    event.preventDefault();
    const result = resetPin(phone, pin);
    setMessage(result.ok ? "The new PIN is saved on this browser." : result.message);
  }

  return (
    <main className="door">
      <Brand />
      <h1>Reset the PIN</h1>
      <p className="muted">This changes the practice PIN on this browser only. Other people keep the original PIN.</p>
      <form className="card" onSubmit={submit}>
        <label>Phone <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" /></label>
        <label>New 4-digit PIN <input value={pin} onChange={(event) => setPin(event.target.value)} inputMode="numeric" autoComplete="new-password" /></label>
        <button className="btn full" type="submit">Save the new PIN</button>
        {message ? <p role="status">{message}</p> : null}
      </form>
      <p>
        <button className="ghost" style={{ color: "var(--navy)", borderColor: "var(--line)" }} type="button" onClick={() => { restoreOriginalPin(); setMessage(`Restored. The PIN is ${ORIGINAL_PIN} again.`); }}>
          Restore {ORIGINAL_PIN}
        </button>
      </p>
    </main>
  );
}

function MemberHome() {
  return (
    <Gate>
      <main className="wrap" style={{ paddingBottom: "3rem" }}>
        <header className="top">
          <Brand />
          <div className="links">
            <Link to="/desk">Treasurer desk</Link>
            <button className="ghost" style={{ color: "var(--navy)", borderColor: "var(--line)" }} type="button" onClick={() => { signOut(); location.href = `${import.meta.env.BASE_URL}login?door=member`; }}>Sign out</button>
          </div>
        </header>
        <div className="banner">
          <img src={morning} alt="A member checking the month on a phone by a window" />
          <p>{memberBooks.name}</p>
        </div>
        <section className="card">
          <p className="muted">Today</p>
          <h1>{memberBooks.line}</h1>
          <p>{memberBooks.proverb}</p>
          <p>{memberBooks.reminder}</p>
        </section>
        <section className="grid" style={{ marginTop: "1rem" }}>
          <article className="card"><p className="muted">Savings</p><strong>{memberBooks.savings}</strong></article>
          <article className="card"><p className="muted">Loan still due</p><strong>{memberBooks.loan}</strong></article>
          <article className="card"><p className="muted">Fines</p><strong>{memberBooks.fines}</strong></article>
          <article className="card"><p className="muted">Net</p><strong>{memberBooks.net}</strong></article>
        </section>
        <section className="card" style={{ marginTop: "1rem" }}>
          <p>{memberBooks.memberNo} · {memberBooks.month}</p>
          <p>{memberBooks.streak}</p>
          <p>{memberBooks.goal}</p>
        </section>
      </main>
    </Gate>
  );
}

function DeskPage() {
  return (
    <Gate>
      <main className="wrap" style={{ paddingBottom: "3rem" }}>
        <header className="top">
          <Brand />
          <div className="links">
            <Link to="/home">Member account</Link>
            <button className="ghost" style={{ color: "var(--navy)", borderColor: "var(--line)" }} type="button" onClick={() => { signOut(); location.href = `${import.meta.env.BASE_URL}login?door=treasurer`; }}>Sign out</button>
          </div>
        </header>
        <div className="banner">
          <img src={treasurer} alt="The treasurer's desk with the register and a laptop" />
          <p>{desk.chama}</p>
        </div>
        <section className="grid">
          <article className="card"><p className="muted">Savings</p><strong>{desk.savings}</strong></article>
          <article className="card"><p className="muted">Loans out</p><strong>{desk.loans}</strong></article>
          <article className="card"><p className="muted">Collected</p><strong>{desk.collected}</strong></article>
          <article className="card"><p className="muted">On time</p><strong>{desk.onTime}</strong></article>
        </section>
        <section className="card" style={{ marginTop: "1rem" }}>
          <h2>Still to pay</h2>
          {desk.behind.map((row) => <p key={row.name}><strong>{row.name}.</strong> {row.detail}</p>)}
        </section>
        <div style={{ overflowX: "auto", marginTop: "1rem" }}>
          <table>
            <thead><tr><th>No.</th><th>Name</th><th>Phone</th><th>Savings</th><th>October</th></tr></thead>
            <tbody>
              {desk.rows.map((row) => (
                <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </Gate>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset" element={<Reset />} />
      <Route path="/home" element={<MemberHome />} />
      <Route path="/desk" element={<DeskPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
