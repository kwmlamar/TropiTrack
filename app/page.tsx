"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LeadCaptureForm } from "@/components/lead-capture-form"
import { Clock, Users, Smartphone, CheckCircle, ArrowRight, Building2, MapPin, ClipboardCheck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Free Banner */}
      <div className="bg-gradient-to-r from-[#041014] via-[#145369] to-[#041014] border-b border-[#2596be]/20">
        <div className="container mx-auto px-4 py-3 text-center">
          <p className="text-sm md:text-base text-gray-100">
            <span className="font-semibold text-[#2596be]">Currently free</span> for Bahamian construction companies testing the platform 🇧🇸
          </p>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-[#041014] border-b border-[#2596be]/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">TropiTrack</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-gray-300 hover:text-[#2596be] transition-colors">
              Features
            </Link>
            <Link href="#why-tropitrack" className="text-sm font-medium text-gray-300 hover:text-[#2596be] transition-colors">
              Why TropiTrack
            </Link>
            <Link href="#testimonials" className="text-sm font-medium text-gray-300 hover:text-[#2596be] transition-colors">
              Testimonials
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="hidden md:flex text-gray-300 hover:text-[#2596be] hover:bg-[#2596be]/10">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-[#145369] hover:bg-[#0d3a4a] text-white font-semibold shadow-lg shadow-[#145369]/20">
              <Link href="#demo">Try Demo</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section - Centered */}
        <section className="relative min-h-[85vh] flex items-center justify-center bg-[#041014] overflow-hidden">
          {/* Subtle island-themed background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#041014] via-[#145369] to-[#041014]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2596be]/10 via-transparent to-transparent"></div>
          
          {/* Subtle construction/island pattern overlay */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232596be' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Main Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight">
                Track time. Run payroll. Build better.
              </h1>
              
              {/* Subheadline */}
              <p className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Time tracking and payroll software built for Bahamian construction teams. Simple, accurate, and made for the field.
              </p>
              
              {/* Single Primary CTA */}
              <div className="mb-8">
                <Button size="lg" className="bg-[#2596be] hover:bg-[#1d7a9a] text-white text-lg px-12 py-7 h-auto font-semibold shadow-2xl shadow-[#2596be]/30 hover:shadow-[#2596be]/40 transition-all" asChild>
                  <Link href="#demo">
                    Try TropiTrack Free
                    <ArrowRight className="ml-2 h-6 w-6" />
                  </Link>
                </Button>
              </div>
              
              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-400">
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#2596be]" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#2596be]" />
                  Built in the Bahamas
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#2596be]" />
                  NIB compliant
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section - Plain Language */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-[#041014] mb-4">
                Built for the way construction crews actually work
              </h2>
              <p className="text-lg text-gray-600">
                Simple, powerful tools that solve real problems on the job site
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              <div className="p-6 rounded-lg hover:bg-[#2596be]/5 transition-colors">
                <div className="mb-4 w-12 h-12 rounded-lg bg-gradient-to-br from-[#2596be]/20 to-[#2596be]/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-[#2596be]" />
                </div>
                <h3 className="text-xl font-semibold text-[#041014] mb-3">No more paper timesheets</h3>
                <p className="text-gray-600 leading-relaxed">
                  Workers clock in from their phone. Hours are tracked automatically. 
                  Everything syncs to the dashboard in real-time.
                </p>
              </div>

              <div className="p-6 rounded-lg hover:bg-[#2596be]/5 transition-colors">
                <div className="mb-4 w-12 h-12 rounded-lg bg-gradient-to-br from-[#145369]/20 to-[#145369]/10 flex items-center justify-center">
                  <ClipboardCheck className="h-6 w-6 text-[#145369]" />
                </div>
                <h3 className="text-xl font-semibold text-[#041014] mb-3">Accurate hours, faster payroll</h3>
                <p className="text-gray-600 leading-relaxed">
                  GPS verification means no time theft. Overtime and NIB calculations happen automatically. 
                  Run payroll in minutes, not hours.
                </p>
              </div>

              <div className="p-6 rounded-lg hover:bg-[#2596be]/5 transition-colors">
                <div className="mb-4 w-12 h-12 rounded-lg bg-gradient-to-br from-[#2596be]/20 to-[#2596be]/10 flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-[#2596be]" />
                </div>
                <h3 className="text-xl font-semibold text-[#041014] mb-3">Designed for field workers</h3>
                <p className="text-gray-600 leading-relaxed">
                  Works on any phone, even offline. Simple enough that anyone can use it. 
                  No training needed.
                </p>
              </div>

              <div className="p-6 rounded-lg hover:bg-[#2596be]/5 transition-colors">
                <div className="mb-4 w-12 h-12 rounded-lg bg-gradient-to-br from-[#145369]/20 to-[#145369]/10 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-[#145369]" />
                </div>
                <h3 className="text-xl font-semibold text-[#041014] mb-3">Know who&apos;s where, always</h3>
                <p className="text-gray-600 leading-relaxed">
                  See which workers are on which job sites. Track project hours separately. 
                  Better visibility means better decisions.
                </p>
              </div>

              <div className="p-6 rounded-lg hover:bg-[#2596be]/5 transition-colors">
                <div className="mb-4 w-12 h-12 rounded-lg bg-gradient-to-br from-[#2596be]/20 to-[#2596be]/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-[#2596be]" />
                </div>
                <h3 className="text-xl font-semibold text-[#041014] mb-3">Built for Bahamian businesses</h3>
                <p className="text-gray-600 leading-relaxed">
                  NIB deductions done right. Holiday pay calculations. Local support in your timezone. 
                  We understand Bahamas construction.
                </p>
              </div>
 
              <div className="p-6 rounded-lg hover:bg-[#2596be]/5 transition-colors">
                <div className="mb-4 w-12 h-12 rounded-lg bg-gradient-to-br from-[#145369]/20 to-[#145369]/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-[#145369]" />
                </div>
                <h3 className="text-xl font-semibold text-[#041014] mb-3">Your crew will actually use it</h3>
                <p className="text-gray-600 leading-relaxed">
                  Clean interface. Fast loading. No confusing features. 
                  Just the tools you need to get work done.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile + Dashboard UI Showcase */}
        <section id="features" className="py-16 md:py-24 bg-gradient-to-br from-[#041014] via-[#145369] to-[#041014] relative overflow-hidden">
          {/* Subtle water effect */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2596be]/5 via-transparent to-transparent"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-6xl mx-auto">
              {/* Mobile Support Showcase */}
              <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
                <div className="order-2 lg:order-1">
                  <div className="relative bg-gradient-to-br from-[#145369] to-[#041014] rounded-2xl p-8 shadow-xl border border-[#2596be]/15">
                    {/* Mobile devices illustration */}
                    <div className="bg-[#0a1f2a] rounded-xl shadow-2xl p-8 mx-auto max-w-sm border-0">
                      <div className="flex items-center justify-center mb-6">
                        <div className="relative">
                          <Smartphone className="h-24 w-24 text-[#2596be]" />
                          <div className="absolute -top-2 -right-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2596be] text-white text-xs font-bold">
                              ✓
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 text-center">
                        <p className="text-sm font-semibold text-white">Works on Any Device</p>
                        <p className="text-xs text-gray-400">Responsive web app • iOS • Android</p>
                        <div className="pt-2">
                          <span className="inline-flex items-center text-xs font-medium text-[#2596be] bg-[#2596be]/10 px-3 py-1.5 rounded-full border border-[#2596be]/20">
                            <Smartphone className="h-3 w-3 mr-1.5" />
                            Native apps in development
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <div className="inline-flex items-center text-sm font-medium text-[#2596be] bg-[#2596be]/10 px-4 py-2 rounded-full mb-4 border border-[#2596be]/20">
                    Mobile Support Included
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                    Built for the job site — mobile support included
                  </h2>
                  <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                    The web app works great on phones and tablets today. Your crew can clock in, check hours, 
                    and track projects from any device. Native iOS + Android apps are actively in development.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-[#2596be] mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Mobile-optimized web interface (available now)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-[#2596be] mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">GPS location verification built-in</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-[#2596be] mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Offline mode with automatic sync</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-[#2596be] mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Native iOS & Android apps coming Q1 2025</span>
                    </li>
                  </ul>
            </div>
          </div>
          
              {/* Dashboard Showcase */}
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                    Your command center
                  </h2>
                  <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                    See everything happening across all your job sites in real-time. 
                    Approve timesheets, run payroll, and track project costs—all from one dashboard.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-[#2596be] mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Real-time crew tracking</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-[#2596be] mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">One-click payroll processing</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-[#2596be] mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Project cost tracking</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-[#2596be] mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Export reports for accounting</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <div className="relative rounded-xl shadow-2xl shadow-[#2596be]/20 overflow-hidden border border-[#2596be]/20">
              <Image
                src="/images/Dashboard.png"
                      alt="TropiTrack dashboard interface"
                width={1200}
                      height={675}
                      className="w-full h-auto"
              />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Why Bahamian Construction Teams Trust TropiTrack */}
        <section id="why-tropitrack" className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-[#041014] mb-4">
                Why Bahamian construction teams trust TropiTrack
              </h2>
              <p className="text-lg text-gray-600">
                Built by people who understand the unique challenges of construction work in the Bahamas
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              <div className="text-center p-6 rounded-lg hover:bg-[#2596be]/5 transition-colors">
                <div className="mb-4 text-4xl font-bold text-[#2596be]">100%</div>
                <h3 className="text-lg font-semibold text-[#041014] mb-2">Local Support</h3>
                <p className="text-gray-600">
                  Based in the Bahamas. We answer calls in your timezone and understand local regulations.
                </p>
                </div>

              <div className="text-center p-6 rounded-lg hover:bg-[#2596be]/5 transition-colors">
                <div className="mb-4 text-4xl font-bold text-[#145369]">10min</div>
                <h3 className="text-lg font-semibold text-[#041014] mb-2">Setup Time</h3>
                <p className="text-gray-600">
                  From signup to first clock-in takes less than 10 minutes. Start tracking time today.
                </p>
              </div>

              <div className="text-center p-6 rounded-lg hover:bg-[#2596be]/5 transition-colors">
                <div className="mb-4 text-4xl font-bold text-[#2596be]">24/7</div>
                <h3 className="text-lg font-semibold text-[#041014] mb-2">Always Available</h3>
                <p className="text-gray-600">
                  Your workers can clock in anytime, anywhere. Offline mode means no connectivity issues.
                </p>
                </div>

              <div className="text-center p-6 rounded-lg hover:bg-[#2596be]/5 transition-colors">
                <div className="mb-4 text-4xl font-bold text-[#145369]">$0</div>
                <h3 className="text-lg font-semibold text-[#041014] mb-2">Currently Free</h3>
                <p className="text-gray-600">
                  We&apos;re testing with real construction companies. Get in now while it&apos;s free to use.
                </p>
              </div>

              <div className="text-center p-6 rounded-lg hover:bg-[#2596be]/5 transition-colors">
                <div className="mb-4 text-4xl font-bold text-[#2596be]">NIB</div>
                <h3 className="text-lg font-semibold text-[#041014] mb-2">Compliant Payroll</h3>
                <p className="text-gray-600">
                  Automatic NIB calculations that match Bahamian employment law. No guesswork.
                </p>
              </div>

              <div className="text-center p-6 rounded-lg hover:bg-[#2596be]/5 transition-colors">
                <div className="mb-4 text-4xl font-bold text-[#145369]">GPS</div>
                <h3 className="text-lg font-semibold text-[#041014] mb-2">Verified Hours</h3>
                <p className="text-gray-600">
                  GPS tracking ensures workers are on-site. Reduce time theft and billing disputes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Founding Customers Section */}
        <section id="testimonials" className="py-16 md:py-24 bg-gradient-to-br from-[#041014] via-[#145369] to-[#041014] relative overflow-hidden">
          {/* Subtle water effect */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2596be]/10 via-transparent to-transparent"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Founding Customers in Progress
              </h2>
              <p className="text-lg text-gray-300">
                We&apos;re currently onboarding Bahamian construction companies. Your team could be one of the first.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto mb-12">
              {/* Card 1 - Active Onboarding */}
              <Card className="bg-gradient-to-br from-[#0a1f2a] to-[#041014] border border-[#2596be]/20 shadow-xl hover:shadow-2xl hover:shadow-[#2596be]/20 hover:border-[#2596be]/40 transition-all duration-300 group">
                <CardContent className="p-8">
                  {/* Status Badge */}
                  <div className="flex items-center justify-end mb-6">
                    <span className="text-xs font-semibold text-[#2596be] bg-[#2596be]/15 px-4 py-2 rounded-full border-0 backdrop-blur-sm">
                      ● Onboarding
                    </span>
                  </div>
                  
                  {/* Icon */}
                  <div className="mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#2596be]/20 to-[#2596be]/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Building2 className="h-8 w-8 text-[#2596be]" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <p className="text-gray-300 mb-6 leading-relaxed text-base">
                    Testing time tracking and GPS verification across multiple job sites in Nassau.
                  </p>
                  
                  {/* Company Info */}
                  <div className="pt-4 border-t border-[#2596be]/10">
                    <p className="font-semibold text-white mb-1">Commercial Construction</p>
                    <p className="text-sm text-gray-400 flex items-center">
                      <MapPin className="h-3 w-3 mr-1.5 text-[#2596be]" />
                      Nassau, New Providence
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2 - In Progress */}
              <Card className="bg-gradient-to-br from-[#0a1f2a] to-[#041014] border border-[#145369]/20 shadow-xl hover:shadow-2xl hover:shadow-[#145369]/20 hover:border-[#145369]/40 transition-all duration-300 group">
                <CardContent className="p-8">
                  {/* Status Badge */}
                  <div className="flex items-center justify-end mb-6">
                    <span className="text-xs font-semibold text-[#145369] bg-[#145369]/15 px-4 py-2 rounded-full border-0 backdrop-blur-sm">
                      ● In Progress
                    </span>
                  </div>
                  
                  {/* Icon */}
                  <div className="mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#145369]/20 to-[#145369]/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Building2 className="h-8 w-8 text-[#145369]" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <p className="text-gray-300 mb-6 leading-relaxed text-base">
                    Implementing payroll automation and NIB calculations for 20+ crew members.
                  </p>
                  
                  {/* Company Info */}
                  <div className="pt-4 border-t border-[#145369]/10">
                    <p className="font-semibold text-white mb-1">Residential Builder</p>
                    <p className="text-sm text-gray-400 flex items-center">
                      <MapPin className="h-3 w-3 mr-1.5 text-[#145369]" />
                      Eleuthera
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3 - Open Slot (Highlighted) */}
              <Card className="bg-gradient-to-br from-[#0a1f2a] via-[#0d2533] to-[#041014] border border-[#2596be]/30 shadow-xl hover:shadow-2xl hover:shadow-[#2596be]/30 hover:border-[#2596be]/50 transition-all duration-300 relative overflow-hidden group">
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#2596be]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <CardContent className="p-8 relative z-10">
                  {/* Status Badge */}
                  <div className="flex items-center justify-end mb-6">
                    <span className="text-xs font-semibold text-gray-300 bg-gray-700/50 px-4 py-2 rounded-full border-0 backdrop-blur-sm">
                      Open Slot
                    </span>
                  </div>
                  
                  {/* Icon */}
                  <div className="mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#2596be]/15 to-[#2596be]/5 flex items-center justify-center border border-[#2596be]/20 border-dashed group-hover:scale-110 group-hover:border-solid transition-all">
                      <Users className="h-8 w-8 text-[#2596be]" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <p className="text-gray-300 mb-6 leading-relaxed text-base">
                    Your construction company could be here. Get early access and help shape the product.
                  </p>
                  
                  {/* Company Info - Placeholder */}
                  <div className="pt-4 border-t border-[#2596be]/15 border-dashed">
                    <p className="font-semibold text-white mb-1">Your Company</p>
                    <p className="text-sm text-gray-400 flex items-center">
                      <MapPin className="h-3 w-3 mr-1.5 text-[#2596be]" />
                      Anywhere in the Bahamas
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Button size="lg" className="bg-[#2596be] hover:bg-[#1d7a9a] text-white px-8 py-6 h-auto font-semibold shadow-lg shadow-[#2596be]/20 hover:shadow-xl hover:shadow-[#2596be]/30 transition-all" asChild>
                <Link href="#demo">
                  Become a Founding Customer
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Lead Capture Section */}
        <section id="demo" className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid gap-12 lg:grid-cols-2 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-[#041014] mb-6">
                    Ready to simplify your construction operations?
                  </h2>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    See TropiTrack in action with a personalized demo, or book a quick 10-minute onboarding call 
                    to get started today.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-[#2596be] mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-[#041014]">Currently free for testing</h4>
                        <p className="text-gray-600">Get full access while we perfect the platform</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-[#145369] mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-[#041014]">Set up in 10 minutes</h4>
                        <p className="text-gray-600">From signup to first clock-in—faster than you think</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-[#2596be] mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-[#041014]">Local support</h4>
                        <p className="text-gray-600">Based in the Bahamas, here to help when you need it</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <LeadCaptureForm />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-[#041014] via-[#145369] to-[#041014] relative overflow-hidden">
          {/* Tropical water effect */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2596be]/20 via-[#2596be]/5 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#041014]/50 via-transparent to-transparent"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Start tracking time the right way
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Join Bahamian construction companies testing TropiTrack. No credit card required. 
                Get started in 10 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-[#2596be] hover:bg-[#1d7a9a] text-white text-base px-8 py-6 h-auto font-semibold shadow-lg shadow-[#2596be]/20 hover:shadow-xl hover:shadow-[#2596be]/30 transition-all" asChild>
                  <Link href="#demo">
                    Try TropiTrack Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-base px-8 py-6 h-auto font-semibold border border-[#145369]/40 text-[#145369] hover:border-[#145369] hover:bg-[#145369]/10 transition-all" asChild>
                  <Link href="https://calendly.com/lamar-tropitech/10min" target="_blank">
                    Book 10-min Onboarding
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2596be]/20 bg-[#041014]">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5 mb-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl font-bold text-white">TropiTrack</span>
              </div>
              <p className="text-sm text-gray-400 mb-6 max-w-sm">
                Time tracking and payroll management built for Bahamian construction crews. 
                Simple, powerful, and made for the field.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4 text-sm">Product</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#features" className="text-sm text-gray-400 hover:text-[#2596be] transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#demo" className="text-sm text-gray-400 hover:text-[#2596be] transition-colors">
                    Try Demo
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-sm text-gray-400 hover:text-[#2596be] transition-colors">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4 text-sm">Company</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#why-tropitrack" className="text-sm text-gray-400 hover:text-[#2596be] transition-colors">
                    Why TropiTrack
                  </Link>
                </li>
                <li>
                  <Link href="#testimonials" className="text-sm text-gray-400 hover:text-[#2596be] transition-colors">
                    Testimonials
                  </Link>
                </li>
                <li>
                  <a href="mailto:lamar@tropitech.org" className="text-sm text-gray-400 hover:text-[#2596be] transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4 text-sm">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-[#2596be] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-400 hover:text-[#2596be] transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-[#2596be]/20 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} TropiTrack. Powered by TropiTech Solutions. Built in the Bahamas 🇧🇸
            </p>
            <div className="flex items-center gap-4">
              <a href="mailto:lamar@tropitech.org" className="text-sm text-gray-400 hover:text-[#2596be] transition-colors">
                lamar@tropitech.org
              </a>
              <span className="text-gray-600">•</span>
              <a href="tel:+13349130982" className="text-sm text-gray-400 hover:text-[#2596be] transition-colors">
                +1 (334) 913-0982
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
