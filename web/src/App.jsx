import { useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import meeting from "./photos/chama-meeting.jpg";
import morning from "./photos/member-morning.jpg";
import treasurer from "./photos/treasurer-desk.jpg";
import { currentSession, isTreasurerSession, savePin, signIn, signOut } from "./auth";
import { desk, memberBooks } from "./data";
import { kes, loadBooks, readWorkbook, saveBooks } from "./excel";

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
    <div className={narrow ? "shell shell-narrow" : "shell"}>{children}</div>
  );
}

function Landing() {
  return (
    <Frame>
      <header className="bar">
        <Brand />
        <nav>
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
            Pamoja IQ is the serious face of a savings group: the meeting, the treasurer’s desk, and a PIN the treasurer sets for each person.
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
        <p>Only the treasurer can set or reset a PIN.</p>
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
    const result = await signIn(phone, pin, door);
    setPending(false);
    if (result.ok) navigate(door === "treasurer" ? "/desk" : "/home");
    else setMessage(result.message);
  }

  return (
    <Frame narrow>
      <header className="bar">
        <Brand />
        <nav>
          <Link to="/">Home</Link>
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
        <p className="quiet">Forgot the PIN? Only the treasurer can set a new one.</p>
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
  if (!isTreasurerSession()) return <Navigate to="/login?door=treasurer" replace />;

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
        <p className="quiet">Only the signed-in treasurer can set a PIN. It stays on this browser and is not shown again.</p>
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
  const session = currentSession();
  const uploaded = loadBooks()?.rows?.find((row) => row.phone && row.phone === session?.phone);
  const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
  const line = uploaded ? `${uploaded.name}, your savings stand at ${kes(uploaded.savings)}.` : memberBooks.line;
  const reminder = uploaded ? `October is ${uploaded.october.toLowerCase()}.` : memberBooks.reminder;
  const savings = uploaded ? kes(uploaded.savings) : memberBooks.savings;
  const missing = Boolean(loadBooks()?.rows) && !uploaded;
  return (
    <Gate>
      <Frame>
        <header className="bar">
          <Brand />
          <nav>
            {isTreasurerSession() ? <Link to="/desk">Treasurer desk</Link> : null}
            <button type="button" className="ghost" onClick={() => leave("member")}>
              Sign out
            </button>
          </nav>
        </header>
        <section className="banner">
          <img src={morning} alt="A member reading a message on a phone beside a window" />
        </section>
        {missing ? (
          <section className="card flat">
            <h1>Your row is not in the register yet.</h1>
            <p className="quiet">Ask the treasurer to upload the Excel file that includes your phone number.</p>
          </section>
        ) : (
          <>
            <section className="card flat">
              <p className="kicker">Today</p>
              <h2>{line}</h2>
              <p className="quiet">{memberBooks.proverb}</p>
            </section>
            <section className="card flat">
              <h2>Reminders</h2>
              <p>{uploaded ? uploaded.october : memberBooks.month}</p>
              <p>{reminder}</p>
            </section>
            <p className="kicker">Your position</p>
            <h1>Your money</h1>
            <p className="quiet">This page shows only this member.</p>
            <section className="stats">
              <article><p>Savings</p><strong>{savings}</strong></article>
              <article><p>Loan still due</p><strong>{uploaded ? "KES 0" : memberBooks.loan}</strong></article>
              <article><p>Unpaid fines</p><strong>{uploaded ? "KES 0" : memberBooks.fines}</strong></article>
              <article><p>Net</p><strong>{uploaded ? savings : memberBooks.net}</strong></article>
            </section>
            <section className="card flat">
              <h2>Your months</h2>
              <p>{uploaded ? "Taken from the treasurer's latest Excel." : memberBooks.streak}</p>
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
          </>
        )}
      </Frame>
    </Gate>
  );
}

function DeskPage() {
  const [rows, setRows] = useState(() => loadBooks()?.rows ?? null);
  const [message, setMessage] = useState("");
  const table = rows
    ? rows.map((row) => [row.memberNo, row.name, row.phoneLabel, kes(row.savings), row.october])
    : desk.rows;
  const still = rows ? rows.filter((row) => row.october === "Still to pay") : desk.behind;

  async function onFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const result = await readWorkbook(file);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    saveBooks(result.rows);
    setRows(result.rows);
    setMessage(`${result.rows.length} members are now on this desk.`);
  }

  return (
    <Gate>
      {isTreasurerSession() ? null : <Navigate to="/home" replace />}
      <Frame>
        <header className="bar">
          <Brand />
          <nav>
            <Link to="/home">Member account</Link>
            <Link to="/reset">Reset a PIN</Link>
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
        <p className="quiet">{desk.chama}. Upload the Excel register on this desk.</p>
        <section className="card flat">
          <h2>Upload Excel</h2>
          <p className="quiet">Download the template, fill the Members and Contributions sheets, then upload it here.</p>
          <a className="line" href={`${import.meta.env.BASE_URL}templates/pamoja-iq-upload-template.xlsx`}>Download template</a>
          <label>
            Excel file
            <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={onFile} />
          </label>
          {message ? <p className="note">{message}</p> : null}
        </section>
        <section className="stats">
          <article><p>Savings</p><strong>{rows ? kes(rows.reduce((sum, row) => sum + row.savings, 0)) : desk.savings}</strong></article>
          <article><p>Loans out</p><strong>{desk.loans}</strong></article>
          <article><p>Collected</p><strong>{desk.collected}</strong></article>
          <article><p>On time</p><strong>{desk.onTime}</strong></article>
        </section>
        <section className="card flat">
          <h2>Still to pay</h2>
          {still.length === 0 ? <p>Nobody is outstanding.</p> : null}
          {rows
            ? still.map((row) => <p key={row.memberNo}><strong>{row.name}.</strong> October is still open.</p>)
            : desk.behind.map((row) => <p key={row.name}><strong>{row.name}.</strong> {row.detail}</p>)}
        </section>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>No.</th><th>Name</th><th>Phone</th><th>Savings</th><th>October</th></tr>
            </thead>
            <tbody>
              {table.map((row) => (
                <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>
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
