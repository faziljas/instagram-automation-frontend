export default function Footer() {
  return (
    <footer className="w-full bg-gray-900 text-gray-400 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center text-sm">
          <p className="text-gray-500">© {new Date().getFullYear()} LogicDM. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
