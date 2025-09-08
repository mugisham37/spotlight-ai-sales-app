export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center p-8">
        <div className="mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Authenticating...
        </h2>
        <p className="text-gray-500">
          Please wait while we verify your credentials
        </p>
      </div>
    </div>
  );
}