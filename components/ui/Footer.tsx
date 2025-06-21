import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 公司信息 */}
          <div>
            <h3 className="text-xl font-bold mb-4">SpeedXPCB</h3>
            <p className="text-gray-400">
              Your trusted partner in PCB manufacturing and assembly.
            </p>
          </div>

          {/* 联系信息 */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 mt-1 text-blue-400" />
                <div>
                  <p className="font-semibold">Head Office</p>
                  <p className="text-gray-400">2680 14th Avenue, Unit 1&2</p>
                  <p className="text-gray-400">Markham, ON L3R 5B2, Canada</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="font-semibold">Sales (Toll Free)</p>
                  <p className="text-gray-400">1-888-812-1949</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="font-semibold">Email</p>
                  <p className="text-gray-400">sales@speedxpcb.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* 快速链接 */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/quote2" className="text-gray-400 hover:text-white">
                  Get Quote
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-400 hover:text-white">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/content" className="text-gray-400 hover:text-white">
                  Knowledge Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* 资源与服务 */}
          <div>
            <h3 className="text-xl font-bold mb-4">Resources & Services</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/content/guides" className="text-gray-400 hover:text-white">
                  Technical Guides
                </Link>
              </li>
              <li>
                <Link href="/content/news" className="text-gray-400 hover:text-white">
                  Industry News
                </Link>
              </li>
              <li>
                <Link href="/services/pcb-fabrication" className="text-gray-400 hover:text-white">
                  PCB Fabrication
                </Link>
              </li>
              <li>
                <Link href="/services/pcb-assembly" className="text-gray-400 hover:text-white">
                  PCB Assembly
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} SpeedXPCB. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 