import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-gray-900 text-gray-400 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm">
          <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
            Terms of Service
          </Link>
          <Link href="/refund-policy" className="text-gray-400 hover:text-white transition-colors">
            Refund Policy
          </Link>
          <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
            Contact Us
          </Link>
        </div>
        <div className="mt-4 text-center">
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} LogicDM. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
