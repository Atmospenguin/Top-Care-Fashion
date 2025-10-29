import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase";
import { Gender, UserRole, UserStatus } from "@prisma/client";

function hash(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function mapRole(value: UserRole | null | undefined): "User" | "Admin" {
  return value === UserRole.ADMIN ? "Admin" : "User";
}

function mapStatus(value: UserStatus | null | undefined): "active" | "suspended" {
  return value === UserStatus.SUSPENDED ? "suspended" : "active";
}

function mapGender(value: Gender | null | undefined): "Male" | "Female" | null {
  if (value === Gender.MALE) return "Male";
  if (value === Gender.FEMALE) return "Female";
  return null;
}

async function ensureLocalUser(supabaseUserId: string, email: string) {
  const existingBySupabase = await prisma.users.findUnique({
    where: { supabase_user_id: supabaseUserId },
    select: { id: true },
  });
  if (existingBySupabase) return existingBySupabase.id;

  const existingByEmail = await prisma.users.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingByEmail) {
    const updated = await prisma.users.update({
      where: { id: existingByEmail.id },
      data: { supabase_user_id: supabaseUserId },
      select: { id: true },
    });
    return updated.id;
  }

  const fallbackUsername = email.split("@")[0] || `user_${supabaseUserId.slice(0, 8)}`;
  const created = await prisma.users.create({
    data: {
      username: fallbackUsername,
      email,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      supabase_user_id: supabaseUserId,
    },
    select: { id: true },
  });
  return created.id;
}

export async function POST(req: NextRequest) {
 try {
  // added console log for route access check
  console.log("route of /api/auth/signin  accessed");
  const body = await req.json().catch(() => ({}));
  const { email, password } = body as Record<string, unknown>;

  const normalizedEmail = typeof email === "string" ? email.trim() : "";
  const normalizedPassword = typeof password === "string" ? password : "";

//ding cheng input 
//add in regular expression for the backend of signing in for validation of email format
//ensure regex is the exact same as the frontend 
const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z][A-Za-z0-9.-]*\.[A-Za-z]{2,}$/;


  if (!emailRegex.test(normalizedEmail)) {
    // added console warning for log check of potential errors for email
    console.warn("Detected invalid email format:", normalizedEmail);
    return NextResponse.json(
      { error: "E-mail format is invalid. Please enter a valid e-mail ." },
      { status: 400 }
    );
  }


  if (!normalizedEmail || !normalizedPassword) {
    //added console warning for missing fields
    console.warn("Missing fields detected during sign-in");
    return NextResponse.json({ error: "missing password or email" }, { status: 400 });
  }

 console.log("signing in for:", normalizedEmail);

  const supabase = await createSupabaseServer();
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: normalizedPassword,
  });

//ding cheng input
//ensure verified email error message is displayed clearly to the user

if (signInError && signInError.message.includes("Email not confirmed")) {
      console.warn("Unverified Email of :", normalizedEmail);
      return NextResponse.json(
        {
          error:
            "Unverified Email detected, please verify your email",
        },
        { status: 403 }
      );
    }


 if (signInError) {
    console.warn(" signInWithPassword failed:", signInError.message);
  }

  // When the authentication of supabase successfully goes through
  if (!signInError && signInData?.user) {

    //ding cheng input
    //inspect if email entered by new user is verified from his/her email

      const supabaseUser = signInData.user;
     // To double check logs for successful sign in
      console.log("sign-in successful for supabase:", normalizedEmail);
      // To double check logs for successful email confirmation
      console.log("Supabase email_confirmed_at:", supabaseUser.email_confirmed_at);


    await ensureLocalUser(supabaseUser.id, normalizedEmail);
    //ding cheng input
    //create and ensure secured cookie session
const sessionToken = crypto.randomBytes(32).toString("hex");
    const response = NextResponse.json({
      ok: true,
      supabaseUserId: supabaseUser.id,
      message: "Signing in through Supabase is successful",
    });

    response.cookies.set("tc_session", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      //ding cheng input
      //secure cookies
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, 
    });
    // console log to double check if user has logged in successfully
    console.log(" login successful:", normalizedEmail);
    return response;
  }

  //added console warning for local authentication backup
   console.warn("sign-in through supabase failed, proceeding to local login");
  const user = await prisma.users.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
      password_hash: true,
      is_premium: true,
      premium_until: true,
      dob: true,
      gender: true,
      //ding cheng input
      supabase_user_id: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
  }

  //ding cheng input 
  //prevent instances of local login if user is linked to Supabase
  //enforce blocking of local login 
  if (user.supabase_user_id) {
    console.warn("Account has already linked to Supabase, local login blocked");
    return NextResponse.json(
      { error: "Invalid credentials detected." },
      { status: 401 }
    );
  }


  //ding cheng input: argument to ensure rejection of unstored password hashes and incorrect password is rejected
  if (!user.password_hash || user.password_hash !== hash(normalizedPassword)) {
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
  }


  if (mapStatus(user.status) === "suspended") {
    return NextResponse.json({ error: "account suspended" }, { status: 403 });
  }

  const dob = user.dob ? user.dob.toISOString().slice(0, 10) : null;
  const responseUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: mapRole(user.role),
    status: mapStatus(user.status),
    dob,
    gender: mapGender(user.gender),
    isPremium: Boolean(user.is_premium),
    premiumUntil: user.premium_until ?? null,
  };

  //add in secure session for added security forlocal login

  const localSessionToken = crypto.randomBytes(32).toString("hex");
  const response = NextResponse.json({ user: responseUser, fallback: true });
  response.cookies.set("tc_session", localSessionToken, {
    httpOnly: true,
    sameSite: "lax",
    //ding cheng input
    //secure cookies
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  
  //added console log to check if user has logged in successfully
  console.log("User has logged in successfully:", user.email);
  return response;

} catch (err) {
  //ding cheng input
//added last possibiity of error
    console.error("Detected unexpected error:", err);
    return NextResponse.json({ error: "Detected error from internal server" }, { status: 500 });
  }
}
