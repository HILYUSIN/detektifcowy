"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react"
import { login } from "@/app/actions/auth"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await login(formData)
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
      <div className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-card overflow-hidden flex">
        {/* Accent Bar Kiri - 6px gradient merah ke hitam */}
        <div className="w-1.5 flex-shrink-0 bg-gradient-red-black-vert" />

        {/* Form Area */}
        <div className="flex-1 px-10 py-10">
          {/* Title */}
          <div className="mb-8">
            <p className="font-mono text-mono-label text-signature-red uppercase tracking-[0.2em] mb-2">
              DETEKTIF COWY
            </p>
            <h1 className="font-chivo text-headline-md text-deep-black font-bold">
              Selamat Datang
            </h1>
            <p className="font-franklin text-[13px] text-muted-gray mt-1">
              Masuk ke akun Anda untuk melanjutkan
            </p>
          </div>

          {/* Form */}
          <form action={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block font-mono text-label-bold text-[#555] uppercase tracking-[0.3px]"
              >
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
                  "hover:border-[#e0e0e0]",
                  "focus:border-signature-red focus:bg-white"
                )}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block font-mono text-label-bold text-[#555] uppercase tracking-[0.3px]"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="masukkan kata sandi"
                  className={cn(
                    "w-full h-11 px-4 pr-12 rounded-xl border-2 border-[#f0f0f0] bg-[#fafafa]",
                    "font-franklin text-[14px] text-deep-black placeholder:text-muted-gray",
                    "transition-all duration-300 outline-none",
                    "hover:border-[#e0e0e0]",
                    "focus:border-signature-red focus:bg-white"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-gray hover:text-deep-black transition-colors"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200" role="alert">
                <AlertCircle size={16} className="text-signature-red flex-shrink-0" />
                <p className="font-franklin text-[13px] text-signature-red">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "w-full h-11 rounded-xl font-franklin font-bold text-[14px] text-white uppercase tracking-wider",
                "bg-gradient-to-r from-signature-red to-deep-black",
                "transition-all duration-300",
                "hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(214,48,49,0.3)]",
                "active:translate-y-0",
                "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0",
                "flex items-center justify-center gap-2"
              )}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Masuk...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn size={16} />
                  MASUK
                </span>
              )}
            </button>

            {/* Forgot Password */}
            <div className="text-center">
              <Link
                href="/reset-password"
                className="font-franklin text-[13px] font-bold text-signature-red hover:opacity-80 transition-opacity"
              >
                Lupa kata sandi?
              </Link>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#f0f0f0] text-center">
            <p className="font-franklin text-[13px] text-muted-gray">
              Belum punya akun?{" "}
              <Link
                href="/signup"
                className="font-bold text-signature-red hover:opacity-80 transition-opacity"
              >
                Daftar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
