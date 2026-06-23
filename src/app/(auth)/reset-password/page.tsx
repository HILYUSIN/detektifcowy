"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react"
import { resetPassword } from "@/app/actions/auth"
import { cn } from "@/lib/utils"

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await resetPassword(formData)
      if (result?.error) setError(result.error)
      else setSuccess(true)
    })
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-signature-red/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-card overflow-hidden flex">
        <div className="w-1.5 flex-shrink-0 bg-gradient-red-black-vert" />

        <div className="flex-1 px-10 py-10">
          <div className="mb-8">
            <p className="font-mono text-mono-label text-signature-red uppercase tracking-[0.2em] mb-2">DETEKTIF COWY</p>
            <h1 className="font-chivo text-headline-md text-deep-black font-bold">Reset Kata Sandi</h1>
            <p className="font-franklin text-[13px] text-muted-gray mt-1">
              Masukkan email Anda untuk menerima tautan reset
            </p>
          </div>

          {success ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-green-500" />
              </div>
              <h2 className="font-chivo font-bold text-[18px] text-deep-black mb-2">Email Terkirim!</h2>
              <p className="font-franklin text-[13px] text-muted-gray mb-6">
                Cek inbox Anda dan ikuti tautan untuk mereset kata sandi.
              </p>
              <Link href="/login" className="font-franklin text-[13px] font-bold text-signature-red hover:opacity-80 transition-opacity">
                Kembali ke Login
              </Link>
            </div>
          ) : (
            <form action={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block font-mono text-label-bold text-[#555] uppercase tracking-[0.3px]">Email</label>
                <input
                  id="email" name="email" type="email" required
                  placeholder="masukkan email anda"
                  className={cn(
                    "w-full h-11 px-4 rounded-xl border-2 border-[#f0f0f0] bg-[#fafafa]",
                    "font-franklin text-[14px] text-deep-black placeholder:text-muted-gray",
                    "transition-all duration-300 outline-none",
                    "hover:border-[#e0e0e0] focus:border-signature-red focus:bg-white"
                  )}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200" role="alert">
                  <AlertCircle size={16} className="text-signature-red flex-shrink-0" />
                  <p className="font-franklin text-[13px] text-signature-red">{error}</p>
                </div>
              )}

              <button
                type="submit" disabled={isPending}
                className={cn(
                  "w-full h-11 rounded-xl font-franklin font-bold text-[14px] text-white uppercase tracking-wider",
                  "bg-gradient-to-r from-signature-red to-deep-black",
                  "transition-all duration-300",
                  "hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(214,48,49,0.3)]",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                  "flex items-center justify-center gap-2"
                )}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengirim...
                  </span>
                ) : (
                  <span className="flex items-center gap-2"><Mail size={16} /> KIRIM TAUTAN RESET</span>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-[#f0f0f0] text-center">
            <Link href="/login" className="font-franklin text-[13px] text-muted-gray hover:text-signature-red transition-colors flex items-center justify-center gap-1">
              <ArrowLeft size={14} /> Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
