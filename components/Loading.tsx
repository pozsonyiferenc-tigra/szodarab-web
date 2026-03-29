export default function Loading() {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-3">
        <div
          className="w-10 h-10 rounded-full border-4 border-gray-200 animate-spin"
          style={{ borderTopColor: '#2196F3' }}
        />
        <span className="text-sm text-gray-500 font-medium">Betöltés...</span>
      </div>
    </div>
  )
}
