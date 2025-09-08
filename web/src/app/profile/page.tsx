"use client";
import { useEffect, useState } from "react";
import { Gender, useAuth } from "@/components/AuthContext";

export default function ProfilePage() {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setEmail(user.email || "");
      setDob(user.dob || "");
      setGender(user.gender || "");
    }
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Saving...");
    await updateProfile({ username, email, dob, gender: gender || undefined });
    setStatus("已保存");
  }

  if (!isAuthenticated) return <p>Please sign in first.</p>;

  return (
    <section className="max-w-md">
      <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
      <form onSubmit={handleSave} className="mt-8 flex flex-col gap-4">
        <label className="text-sm">Username
          <input className="mt-1 w-full border border-black/10 rounded-md px-3 py-2" value={username} onChange={(e)=>setUsername(e.target.value)} required />
        </label>
        <label className="text-sm">Email
          <input type="email" className="mt-1 w-full border border-black/10 rounded-md px-3 py-2" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        </label>
        <label className="text-sm">Date of Birth
          <input type="date" className="mt-1 w-full border border-black/10 rounded-md px-3 py-2" value={dob} onChange={(e)=>setDob(e.target.value)} />
        </label>
        <label className="text-sm">Gender
          <select className="mt-1 w-full border border-black/10 rounded-md px-3 py-2" value={gender || ""} onChange={(e)=>setGender(e.target.value as Gender)}>
            <option value="">Not set</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
            <option>Prefer not to say</option>
          </select>
        </label>
        <button type="submit" className="inline-flex items-center rounded-md bg-[var(--brand-color)] text-white px-4 py-2 text-sm hover:opacity-90">Save</button>
      </form>
      {status && <p className="mt-4 text-sm">{status}</p>}
    </section>
  );
}
