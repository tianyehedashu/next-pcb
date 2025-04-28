import Image from "next/image";

export default function Footer() {
  return (
    <footer id="contact" className="w-full bg-slate-900 text-white py-8 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center px-8 gap-4">
        <div className="flex items-center gap-2">
          <Image src="/pcb-logo.svg" alt="PCB Logo" width={32} height={32} />
          <span className="font-bold text-lg">NextPCB</span>
        </div>
        <div className="text-sm">© {new Date().getFullYear()} NextPCB. All rights reserved.</div>
        <div className="flex gap-4">
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="hover:underline">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
} 