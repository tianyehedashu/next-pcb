import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { Carousel } from "@/app/components/custom-ui/carousel";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Carousel Section */}
      <Carousel />

      {/* Hero Banner */}
      <section className="flex flex-col md:flex-row items-center justify-between px-8 py-16 bg-gradient-to-r from-blue-100 to-white">
        <div className="flex-1 flex flex-col gap-6">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">Your Trusted Partner for PCB Manufacturing</h1>
          <p className="text-lg text-slate-700 mb-4 max-w-xl">High-quality, fast-turn PCB fabrication and assembly for global innovators. From prototype to mass production, we deliver excellence every step of the way.</p>
          <div className="flex gap-4">
            <Button size="lg" asChild>
              <Link href="/quote2" prefetch>
                Get a Quote
              </Link>
            </Button>
            <Button variant="outline" size="lg">Learn More</Button>
          </div>
        </div>
        <div className="flex-1 flex justify-center mt-8 md:mt-0">
          <Image src="/pcb-hero.svg" alt="PCB Hero" width={400} height={300} className="rounded-xl shadow-lg" />
        </div>
      </section>

      {/* Services */}
      <section id="services" className="px-8 py-16 bg-white">
        <h2 className="text-3xl font-bold text-center mb-10">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>PCB Fabrication</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">Precision manufacturing for single, double, and multi-layer PCBs with rapid turnaround and strict quality control.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>PCB Assembly</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">SMT & THT assembly, component sourcing, and functional testing for prototypes and large-scale production.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>One-Stop Solution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">From design to delivery, we offer end-to-end PCB solutions tailored to your project needs.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why" className="px-8 py-16 bg-slate-100">
        <h2 className="text-3xl font-bold text-center mb-10">Why Choose SpeedXPCB?</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center">
            <Image src="/fast.svg" alt="Fast" width={48} height={48} />
            <h3 className="font-semibold mt-4 mb-2">Fast Turnaround</h3>
            <p className="text-slate-600">Quick prototyping and on-time delivery worldwide.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Image src="/quality.svg" alt="Quality" width={48} height={48} />
            <h3 className="font-semibold mt-4 mb-2">Quality Assurance</h3>
            <p className="text-slate-600">Strict QC process ensures every board meets the highest standards.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Image src="/support.svg" alt="Support" width={48} height={48} />
            <h3 className="font-semibold mt-4 mb-2">24/7 Support</h3>
            <p className="text-slate-600">Expert support team ready to help you anytime, anywhere.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Image src="/global.svg" alt="Global" width={48} height={48} />
            <h3 className="font-semibold mt-4 mb-2">Global Shipping</h3>
            <p className="text-slate-600">Reliable logistics to over 150 countries and regions.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-8 py-16 bg-white">
        <h2 className="text-3xl font-bold text-center mb-10">What Our Clients Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar>
                <AvatarImage src="/avatar1.jpg" />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>Teng Chong</CardTitle>
                <span className="text-xs text-slate-500">USA, Hardware Engineer</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">“SpeedXPCB delivered our boards faster than expected and the quality was top-notch. Highly recommended!”</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar>
                <AvatarImage src="/avatar2.jpg" />
                <AvatarFallback>EM</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>Mariann</CardTitle>
                <span className="text-xs text-slate-500">Germany, Product Designer</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">“Excellent service and support. The one-stop solution made our project much easier.”</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar>
                <AvatarImage src="/avatar3.jpg" />
                <AvatarFallback>LK</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>Kenny Lee</CardTitle>
                <span className="text-xs text-slate-500">Singapore, Startup CTO</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">“Professional team and reliable quality. Will definitely cooperate again!”</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
