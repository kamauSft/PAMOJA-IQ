import { useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import meeting from "./photos/chama-meeting.jpg";
import morning from "./photos/member-morning.jpg";
import treasurer from "./photos/treasurer-desk.jpg";
import { currentSession, savePin, signIn, signOut } from "./auth";
import { Bubbles } from "./bubbles";
import { desk, memberBooks } from "./data";

function chosenDoor(value) {
  return value?.toLowerCase() === "treasurer" ? "treasurer" : "member";
}

function Brand() {
  return (
    <Link to="/" className="brand">
      <span>Pamoja IQ</span>
      <small>Intelligent Chama Solution</small>
    </Link>
  );
}

function Frame({ children, narrow = false }) {
  return (
    <>
      <Bubbles />
      <div className={narrow ? "shell shell-narrow" : "shell"}>{children}</div>
    </>
  );
}

function Landing() {
  return (
    <Frame>
      <header className="bar">
        <Brand />
        <nav>
          <Link to="/reset">Reset PIN</Link>
          <Link to="/login?door=member" className="solid">
            Member
          </Link>
          <Link to="/login?door=treasurer" className="line">
            Treasurer
          </Link>
        </nav>
      </header>
      <section className="hero">
        <div>
          <p className="kicker">Private records for a chama</p>
          <h1>Clear books. A quiet room. Every member sees only their own.</h1>
          <p className="lead">
            Pamoja IQ is the serious face of a savings group: the meeting, the treasurer’s desk, and a PIN each person sets for themselves.
          </p>
          <div className="actions">
            <Link to="/login?door=member" className="solid">
              Member
            </Link>
            <Link to="/login?door=treasurer" className="line">
              Treasurer
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
          <p>One register. One set of books. Nothing moves until the treasurer has looked at it.</p>
        </article>
        <article>
          <img src={morning} alt="A member reading a message on a phone beside a window" />
          <h2>The member’s own page</h2>
          <p>A member opens their own position. A neighbour’s savings stay off that screen.</p>
        </article>
      </section>
      <footer>
        <p>One PIN opens either door. Reset it on this page if this browser does not have one yet.</p>
      </footer>
    </Frame>
  );
}

function PinField({ label, value, onChange }) {
  const [visible, setVisible] = useState(false);
  return (
    <label>
      {label}
      <span className="pin-row">
        <input value={value} onChange={(event) => onChange(event.target.value)} type={visible ? "text" : "password"} inputMode="numeric" autoComplete="new-password" />
        <button type="button" className="ghost" onClick={() => setVisible((current) => !current)}>
          {visible ? "Hide" : "Show"}
        </button>
      </span>
    </label>
  );
}

function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const door = chosenDoor(params.get("door"));
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setPending(true);
    const result = await signIn(phone, pin);
    setPending(false);
    if (result.ok) navigate(door === "treasurer" ? "/desk" : "/home");
    else setMessage(result.message);
  }

  return (
    <Frame narrow>
      <header className="bar">
        <Brand />
        <nav>
          <Link to="/reset">Reset PIN</Link>
        </nav>
      </header>
      <form className="card" onSubmit={submit}>
        <p className="kicker">{door === "treasurer" ? "Treasurer" : "Member"}</p>
        <h1>{door === "treasurer" ? "Open the desk." : "Open your own books."}</h1>
        <label>
          Phone number
          <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" />
        </label>
        <PinField label="PIN" value={pin} onChange={setPin} />
        <button className="solid wide" type="submit" disabled={pending}>
          {pending ? "Checking" : "Continue"}
        </button>
        {message ? <p className="note">{message}</p> : null}
        <p className="quiet">
          First time on this browser? <Link to="/reset">Reset the PIN</Link>.
        </p>
      </form>
    </Frame>
  );
}

function Reset() {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setPending(true);
    const result = await savePin(phone, pin, confirm);
    setPending(false);
    setPin("");
    setConfirm("");
    setMessage(result.ok ? "The new PIN is saved on this browser. It is not shown again." : result.message);
  }

  return (
    <Frame narrow>
      <header className="bar">
        <Brand />
        <nav>
          <Link to="/login">Sign in</Link>
        </nav>
      </header>
      <form className="card" onSubmit={submit}>
        <p className="kicker">Reset PIN</p>
        <h1>Choose a new PIN.</h1>
        <p className="quiet">This public page keeps the PIN only in this browser. The chama books on the computer are separate, and come later.</p>
        <label>
          Phone number
          <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" />
        </label>
        <PinField label="New PIN" value={pin} onChange={setPin} />
        <PinField label="Confirm PIN" value={confirm} onChange={setConfirm} />
        <button className="solid wide" type="submit" disabled={pending}>
          {pending ? "Saving" : "Save PIN"}
        </button>
        {message ? <p className="note">{message}</p> : null}
      </form>
    </Frame>
  );
}

function leave(door) {
  signOut();
  location.href = `${import.meta.env.BASE_URL}login?door=${door}`;
}

function Gate({ children }) {
  if (!currentSession()) return <Navigate to="/login" replace />;
  return children;
}

function MemberHome() {
  const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
  return (
    <Gate>
      <Frame>
        <header className="bar">
          <Brand />
          <nav>
            <Link to="/desk">Treasurer desk</Link>
            <button type="button" className="ghost" onClick={() => leave("member")}>
              Sign out
            </button>
          </nav>
        </header>
        <section className="banner">
          <img src={morning} alt="A member reading a message on a phone beside a window" />
        </section>
        <section className="card flat">
          <p className="kicker">Today</p>
          <h2>{memberBooks.line}</h2>
          <p className="quiet">{memberBooks.proverb}</p>
        </section>
        <section className="card flat">
          <h2>Reminders</h2>
          <p>{memberBooks.month}</p>
          <p>{memberBooks.reminder}</p>
        </section>
        <p className="kicker">Your position</p>
        <h1>Your money</h1>
        <p className="quiet">This page shows only this member. Books as of 2026-10-16.</p>
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
          <div className="bar"><div /></div>
        </section>
      </Frame>
    </Gate>
  );
}

function DeskPage() {
  return (
    <Gate>
      <Frame>
        <header className="bar">
          <Brand />
          <nav>
            <Link to="/home">Member account</Link>
            <button type="button" className="ghost" onClick={() => leave("treasurer")}>
              Sign out
            </button>
          </nav>
        </header>
        <section className="banner">
          <img src={treasurer} alt="A treasurer comparing a handwritten register with a laptop" />
        </section>
        <p className="kicker">Treasurer desk</p>
        <h1>Oct 2026 meeting</h1>
        <p className="quiet">{desk.chama}. Books as of 2026-10-16. 3 still to pay.</p>
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
    </Gate>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset" element={<Reset />} />
      <Route path="/home" element={<MemberHome />} />
      <Route path="/desk" element={<DeskPage />} />
      <Route path="/welcome" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
