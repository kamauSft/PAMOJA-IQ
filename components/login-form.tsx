"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { copy } from "@/content/ui";

const english = copy("en").login;

interface ChamaChoice {
  chamaId: string;
  chamaName: string;
  role: string;
}

interface LoginBody {
  status?: string;
  role?: string;
  message?: string;
  challengeId?: string;
  demoCode?: string;
  chamas?: ChamaChoice[];
}

export function LoginForm({
  initialPhone = "",
  initialPin = "",
  startWithPin = false,
  afterSignIn,
  preferredRole,
  labels = english,
}: {
  initialPhone?: string;
  initialPin?: string;
  startWithPin?: boolean;
  afterSignIn?: "/home" | "/desk";
  preferredRole?: "MEMBER" | "TREASURER" | "CHAIR" | "SECRETARY" | "AUDITOR";
  labels?: typeof english;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState(initialPhone);
  const [pin, setPin] = useState(initialPin);
  const [showPin, setShowPin] = useState(startWithPin);
  const [pinVisible, setPinVisible] = useState(false);
  const [chamaId, setChamaId] = useState("");
  const [choices, setChoices] = useState<ChamaChoice[]>([]);
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  function goHome(role?: string) {
    router.push(afterSignIn ?? (role && role !== "MEMBER" ? "/desk" : "/home"));
  }

  async function submitPhone(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, pin: showPin ? pin : undefined, chamaId: chamaId || undefined, role: preferredRole }),
      });
      const body = (await response.json().catch(() => null)) as LoginBody | null;
      if (!body?.status) {
        setMessage(labels.failed);
        return;
      }
      if (body.status === "authenticated") {
        goHome(body.role);
        return;
      }
      if (body.status === "choose_chama") {
        setChoices(body.chamas ?? []);
        setMessage(labels.choose);
        return;
      }
      if (body.status === "pin_required") {
        setShowPin(true);
        setMessage(labels.pinRequired);
        return;
      }
      if (body.status === "otp_required") {
        setChallengeId(body.challengeId ?? "");
        setDemoCode(body.demoCode ?? "");
        setMessage(body.demoCode ? labels.enterDemo : labels.enterSms);
        return;
      }
      setMessage(body.message || labels.unrecognised);
    } catch {
      setMessage(labels.offline);
    } finally {
      setPending(false);
    }
  }

  async function submitCode(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ challengeId, code }),
      });
      const body = (await response.json().catch(() => null)) as LoginBody | null;
      if (!body?.status) {
        setMessage(labels.failed);
        return;
      }
      if (body.status === "authenticated") {
        goHome(body.role);
        return;
      }
      setMessage(body.message || (body.status === "otp_expired" ? labels.expired : labels.rejected));
    } catch {
      setMessage(labels.offline);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card p-6">
      <form onSubmit={challengeId ? submitCode : submitPhone} className="space-y-4">
        {!challengeId ? (
          <>
            <label className="block text-sm font-medium">
              {labels.phone}
              <input
                className="field"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                inputMode="tel"
                autoComplete="tel"
                name="phone"
              />
            </label>
            {showPin ? (
              <label className="block text-sm font-medium">
                {labels.pin}
                <span className="mt-1 flex gap-2">
                  <input
                    className="field mt-0"
                    value={pin}
                    onChange={(event) => setPin(event.target.value)}
                    type={pinVisible ? "text" : "password"}
                    inputMode="numeric"
                    autoComplete="current-password"
                    name="pin"
                  />
                  <button className="tap shrink-0 rounded-lg border border-line px-3 text-[13px]" type="button" onClick={() => setPinVisible((current) => !current)}>
                    {pinVisible ? labels.hidePin : labels.showPin}
                  </button>
                </span>
              </label>
            ) : null}
            {choices.length > 0 ? (
              <label className="block text-sm font-medium">
                {labels.chama}
                <select
                  className="field"
                  value={chamaId}
                  onChange={(event) => setChamaId(event.target.value)}
                >
                  <option value="">{labels.select}</option>
                  {choices.map((choice) => (
                    <option key={choice.chamaId} value={choice.chamaId}>
                      {choice.chamaName} · {choice.role}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </>
        ) : (
          <label className="block text-sm font-medium">
            {labels.code}
            <input
              className="field font-mono tracking-[0.3em]"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              name="code"
            />
          </label>
        )}
        <button
          className="btn w-full disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? labels.checking : challengeId ? labels.confirm : labels.continue}
        </button>
      </form>
      {!challengeId && !startWithPin ? (
        <button
          className="mt-3 text-sm underline"
          type="button"
          onClick={() => {
            setShowPin((current) => !current);
            setMessage("");
          }}
        >
          {showPin ? labels.useCode : labels.usePin}
        </button>
      ) : null}
      {!challengeId ? <p className="mt-4 text-[13px] text-muted">{labels.forgot}</p> : null}
      {message ? (
        <p className="mt-4 text-sm text-clay" role="alert" data-testid="login-error">
          {message}
        </p>
      ) : null}
      {demoCode ? (
        <div className="mt-3 rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink" data-testid="demo-banner">
          <p className="font-semibold">{labels.demo}</p>
          <p className="mt-1">{labels.demoNote}</p>
          <p className="mt-1">
            {labels.demoCode}: <strong data-testid="demo-code">{demoCode}</strong>
          </p>
          <button className="tap mt-2 underline" type="button" onClick={() => setCode(demoCode)}>
            {labels.useDemo}
          </button>
        </div>
      ) : null}
    </div>
  );
}
