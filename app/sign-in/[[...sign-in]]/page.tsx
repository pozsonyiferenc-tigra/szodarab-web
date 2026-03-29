import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-pink-50 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold">
          <span style={{ color: '#2196F3' }}>Szóda</span>
          <span style={{ color: '#E91E63' }}>rab</span>
        </h1>
        <p className="text-gray-500 text-sm mt-2">Szódapatron nyilvántartó</p>
      </div>
      <SignIn />
    </div>
  )
}
