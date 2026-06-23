"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react"
import { signup } from "@/app/actions/auth"
import { cn } from "@/lib/utils"

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const passwordMatch = confirm.length > 0 && password === confirm
  const passwordMismatch = confirm.length > 0 && password !== confirm
  const canSubmit = agreed && !passwordMismatch && password.length >= 6

  async function handleSubmit(formData: FormData) {
    if (!canSubmit) return
    setError(null)
    startTransition(async () => {
      const result = await signup(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* Ambient red glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-signature-red/5 blur-[120px]" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-card overflow-hidden flex my-8">
        {/* Accent Bar Kiri */}
        <div className="w-1.5 flex-shrink-0 bg-gradient-red-black-vert" />

        {/* Form Area */}
        <div className="flex-1 px-10 py-10">
          {/* Title */}
          <div className="mb-8">
            <p className="font-mono text-mono-label text-signature-red uppercase tracking-[0.2em] mb-2">
              DETEKTIF COWY
            </p>
            <h1 className="font-chivo text-headline-md text-deep-black font-bold">
              Buat Akun
            </h1>
            <p className="font-franklin text-[13px] text-muted-gray mt-1">
              Bergabung dan mulai investigasi Anda
            </p>
          </div>

          {/* Form */}
          <form action={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="block font-mono text-label-bold text-[#555] uppercase tracking-[0.3px]">
                Nama Pengguna
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                placeholder="pilih nama pengguna unik"
                className={cn(
                  "w-full h-11 px-4 rounded-xl border-2 border-[#f0f0f0] bg-[#fafafa]",
                  "font-franklin text-[14px] text-deep-black placeholder:text-muted-gray",
                  "transition-all duration-300 outline-none",
                  "hover:border-[#e0e0e0] focus:border-signature-red focus:bg-white"
                )}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block font-mono text-label-bold text-[#555] uppercase tracking-[0.3px]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="masukkan email anda"
                className={cn(
                  "w-full h-11 px-4 rounded-xl border-2 border-[#f0f0f0] bg-[#fafafa]",
                  "font-franklin text-[14px] text-deep-black placeholder:text-muted-gray",
                  "transition-all duration-300 outline-none",
                  "hover:border-[#e0e0e0] focus:border-signature-red focus:bg-white"
                )}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block font-mono text-label-bold text-[#555] uppercase tracking-[0.3px]">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="buat kata sandi yang kuat"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "w-full h-11 px-4 pr-12 rounded-xl border-2 border-[#f0f0f0] bg-[#fafafa]",
                    "font-franklin text-[14px] text-deep-black placeholder:text-muted-gray",
                    "transition-all duration-300 outline-none",
                    "hover:border-[#e0e0e0] focus:border-signature-red focus:bg-white"
                  )}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-gray hover:text-deep-black transition-colors"
                  aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirm" className="block font-mono text-label-bold text-[#555] uppercase tracking-[0.3px]">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  name="confirm"
                  type={showConfirm ? "text" : "password"}
                  required
                  placeholder="ulangi kata sandi"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={cn(
                    "w-full h-11 px-4 pr-12 rounded-xl border-2 bg-[#fafafa]",
                    "font-franklin text-[14px] text-deep-black placeholder:text-muted-gray",
                    "transition-all duration-300 outline-none",
                    passwordMismatch ? "border-signature-red" : "border-[#f0f0f0]",
                    passwordMatch ? "border-green-400" : "",
                    "hover:border-[#e0e0e0] focus:border-signature-red focus:bg-white"
                  )}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-gray hover:text-deep-black transition-colors"
                  aria-label={showConfirm ? "Sembunyikan" : "Tampilkan"}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordMismatch && (
                <p className="font-franklin text-[12px] text-signature-red flex items-center gap-1" role="alert">
                  <AlertCircle size={12} /> Kata sandi tidak cocok
                </p>
              )}
              {passwordMatch && (
                <p className="font-franklin text-[12px] text-green-600 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Kata sandi cocok
                </p>
              )}
            </div>

            {/* Checkbox */}
            <div className="flex items-start gap-3">
              <input
                id="agree"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-signature-red cursor-pointer"
              />
              <label htmlFor="agree" className="font-franklin text-[12px] text-muted-gray cursor-pointer leading-relaxed">
                Saya menyetujui{" "}
                <span className="text-signature-red font-bold hover:opacity-80 cursor-pointer">
                  Syarat &amp; Ketentuan
                </span>
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200" role="alert">
                <AlertCircle size={16} className="text-signature-red flex-shrink-0" />
                <p className="font-franklin text-[13px] text-signature-red">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit || isPending}
              className={cn(
                "w-full h-11 rounded-xl font-franklin font-bold text-[14px] text-white uppercase tracking-wider",
                "bg-gradient-to-r from-signature-red to-deep-black",
                "transition-all duration-300",
                "hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(214,48,49,0.3)]",
                "active:translate-y-0",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0",
                "flex items-center justify-center gap-2"
              )}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Mendaftar...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus size={16} />
                  DAFTAR SEKARANG
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#f0f0f0] text-center">
            <p className="font-franklin text-[13px] text-muted-gray">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-bold text-signature-red hover:opacity-80 transition-opacity">
                Masuk
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
