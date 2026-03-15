"use client"

import { LoginForm } from "../../../components/login-form.jsx"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative flex flex-col bg-background p-6 md:p-10">

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[400px]">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-zinc-950 relative hidden lg:flex items-center justify-center overflow-hidden border-l border-white/5 transition-colors duration-500">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-50" />
        
        <div className="relative z-10 flex flex-col items-center gap-6" style={{ perspective: "1000px" }}>
          <img
            src="/Untitled_design-removebg-preview.png"
            alt="Dashboard Logo"
            className="w-[70%] max-w-[350px] mx-auto h-auto object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all duration-500"
          />
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -z-10 transition-colors duration-500" />
      </div>
    </div>
  )
}
