import { useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import { resetPin, restoreOriginalPin, sessionOpen, signIn, signOut } from "./auth.js";
import { desk, memberBooks, PRACTICE_PHONE } from "./data.js";
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
          <p>The same number opens the member account and the treasurer desk. The figures are practice books for a demonstration.</p>
          <p>Five wrong tries lock this browser for 15 minutes. A replacement PIN stays on this browser only.</p>
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

  async function submit(event) {
    event.preventDefault();
    const result = await signIn(phone, pin);
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
      <p className="muted">{door === "treasurer" ? "This door is for the treasurer. You will see the full desk." : "This door is for a member. You will see your own account."}</p>
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

  async function submit(event) {
    event.preventDefault();
    const result = await resetPin(phone, pin);
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
        <button className="ghost" style={{ color: "var(--navy)", borderColor: "var(--line)" }} type="button" onClick={() => { restoreOriginalPin(); setMessage("The original practice PIN is restored on this browser."); }}>
          Restore the original practice PIN
        </button>
      </p>
    </main>
  );
}

function MemberHome() {
  const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
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
          <h2>{memberBooks.line}</h2>
          <p className="muted">{memberBooks.proverb}</p>
        </section>
        <section className="card" style={{ marginTop: "1rem" }}>
          <h2>Reminders</h2>
          <p>{memberBooks.month}</p>
          <p>{memberBooks.reminder}</p>
        </section>
        <p className="muted" style={{ marginTop: "1.5rem" }}>Your position</p>
        <h1>{memberBooks.name}&apos;s money</h1>
        <p className="muted">{memberBooks.memberNo} · Active. This page shows only this member. Books as of 2026-10-16.</p>
        <section className="card" style={{ marginTop: "1rem" }}>
          <p className="muted">Oct 2026 contribution · due KES 2,000</p>
          <h2>Recorded</h2>
        </section>
        <section className="grid" style={{ marginTop: "1rem" }}>
          <article className="card"><p className="muted">Savings</p><strong>{memberBooks.savings}</strong></article>
          <article className="card"><p className="muted">Loan still due</p><strong>{memberBooks.loan}</strong></article>
          <article className="card"><p className="muted">Unpaid fines</p><strong>{memberBooks.fines}</strong></article>
          <article className="card"><p className="muted">Net</p><strong>{memberBooks.net}</strong></article>
        </section>
        <section className="card" style={{ marginTop: "1rem" }}>
          <h2>Your months</h2>
          <p>{memberBooks.streak}</p>
          <div className="months">
            {months.map((month) => (
              <span key={month}><i className="dot paid" />{month}</span>
            ))}
          </div>
        </section>
        <section className="card" style={{ marginTop: "1rem" }}>
          <h2>Goal</h2>
          <p>{memberBooks.goal}</p>
          <div className="bar"><div style={{ width: "60%" }} /></div>
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
        <p className="muted">Treasurer desk</p>
        <h1>Oct 2026 meeting</h1>
        <p className="muted">Books as of 2026-10-16. 3 still to pay.</p>
        <section className="grid" style={{ marginTop: "1rem" }}>
          <article className="card"><p className="muted">Savings</p><strong>{desk.savings}</strong></article>
          <article className="card"><p className="muted">Loans out</p><strong>{desk.loans}</strong></article>
          <article className="card"><p className="muted">Collected</p><strong>{desk.collected}</strong></article>
          <article className="card"><p className="muted">On time</p><strong>{desk.onTime}</strong></article>
        </section>
        <section className="card" style={{ marginTop: "1rem" }}>
          <h2>Reminders ready to show members</h2>
          {desk.behind.map((row) => <p key={row.name}><strong>{row.name}.</strong> {row.detail}</p>)}
        </section>
        <h2>Members</h2>
        <div style={{ overflowX: "auto" }}>
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
