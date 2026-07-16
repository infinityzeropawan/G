export default function Footer({ className = "bg-white border-t border-gray-100 text-gray-500" }: { className?: string }) {
  return (
    <div className={`mt-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm ${className}`}>
      <div className="font-medium opacity-80">
        BUILDROONIX © 2026
      </div>
      <div className="flex items-center gap-1.5 opacity-90">
        <span>Support:</span>
        <a href="mailto:support@buildroonix.com" className="text-orange-500 hover:text-orange-400 hover:underline font-medium transition-colors">
          support@buildroonix.com
        </a>
      </div>
    </div>
  );
}
