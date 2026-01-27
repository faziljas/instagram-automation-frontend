import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-gray-900 text-gray-400 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm">
          <Link
            href="/pricing"
            className="hover:text-white transition-colors duration-200"
          >
            Pricing
          </Link>
          <span className="hidden sm:inline text-gray-600">•</span>
          <Link
            href="/privacy"
            className="hover:text-white transition-colors duration-200"
          >
            Privacy Policy
          </Link>
          <span className="hidden sm:inline text-gray-600">•</span>
          <Link
            href="/terms"
            className="hover:text-white transition-colors duration-200"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
