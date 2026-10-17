import { useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import meeting from "./photos/chama-meeting.jpg";
import morning from "./photos/member-morning.jpg";
import treasurer from "./photos/treasurer-desk.jpg";
import { currentSession, savePin, signIn, signOut } from "./auth";
import { Bubbles } from "./bubbles";

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
          <Link to="/login" className="solid">
            Sign in
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
            <Link to="/login" className="solid">
              Sign in
            </Link>
            <Link to="/reset" className="line">
              Reset PIN
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
        <p>Set the public PIN on this browser. The full books stay on the chama computer.</p>
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
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setPending(true);
    const result = await signIn(phone, pin);
    setPending(false);
    if (result.ok) navigate("/welcome");
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
        <p className="kicker">Sign in</p>
        <h1>Your phone and your PIN.</h1>
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

function Welcome() {
  if (!currentSession()) return <Navigate to="/login" replace />;
  return (
    <Frame>
      <header className="bar">
        <Brand />
        <nav>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              signOut();
              location.href = `${import.meta.env.BASE_URL}login`;
            }}
          >
            Sign out
          </button>
        </nav>
      </header>
      <section className="hero">
        <div>
          <p className="kicker">Signed in on this browser</p>
          <h1>The door is open.</h1>
          <p className="lead">Your PIN is stored here, not on the page. The full member books and the treasurer desk open on the chama computer.</p>
          <div className="actions">
            <Link to="/reset" className="line">
              Reset PIN
            </Link>
          </div>
        </div>
        <figure>
          <img src={morning} alt="A member checking the phone by a window" />
          <figcaption>Your own page, when the books are on the computer.</figcaption>
        </figure>
      </section>
    </Frame>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset" element={<Reset />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
