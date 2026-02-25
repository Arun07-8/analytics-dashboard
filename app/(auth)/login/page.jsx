import { GalleryVerticalEnd } from "lucide-react"

import { LoginForm } from "../../../components/login-form.jsx"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <div className="mb-8 flex justify-center lg:hidden">
              <img
                src="/Foxon Final Logo-02.png"
                alt="FoxonHub Logo"
                className="h-20 w-auto object-contain dark:brightness-0 dark:invert"
              />
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-zinc-950 relative hidden lg:flex items-center justify-center overflow-hidden border-l border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-50" />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <img
            src="/Foxon Final Logo-02.png"
            alt="FoxonHub Logo Large"
            className="w-[80%] max-w-[450px] h-auto object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] brightness-0 invert"
          />
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -z-10" />
      </div>
    </div>
  )
}
