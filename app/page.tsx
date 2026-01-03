"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LeadCaptureForm } from "@/components/lead-capture-form"
import { Clock, Users, Smartphone, CheckCircle, ArrowRight, Building2, MapPin, ClipboardCheck, Menu, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { isPWAStandalone } from "@/lib/utils/pwa"
import { createClient } from "@/utils/supabase/client"
import { LoadingScreen } from "@/components/loading-screen"

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const router = useRouter()

  // Authentication Check and Redirect Logic
  // Check authentication status immediately on load to prevent landing page flash
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Check if we're running in PWA/standalone mode
        const isPWA = isPWAStandalone()

        // Check authentication status
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // User is authenticated - redirect to dashboard
          // This applies to both PWA and web
          router.replace('/dashboard')
        } else {
          // User is not authenticated
          if (isPWA) {
            // In PWA mode, redirect to login
            router.replace('/login')
          } else {
            // On web, show landing page
            setIsAuthLoading(false)
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
        // On error, show landing page (web) or login (PWA)
        const isPWA = isPWAStandalone()
        if (isPWA) {
          router.replace('/login')
        } else {
          setIsAuthLoading(false)
        }
      }
    }

    // Run the check immediately
    checkAuthAndRedirect()
  }, [router])

  // Show loading screen while checking authentication
  // This prevents the landing page from flashing during auth check
  if (isAuthLoading) {
    return <LoadingScreen />
  }
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Pricing Banner */}
      <div className="bg-[#2596be] border-b border-[#2596be]">
        <div className="container mx-auto px-4 py-3 text-center">
          <p className="text-sm md:text-base text-white font-medium">
            Simple pricing starting at <span className="font-bold">$49/month</span> for Bahamian construction companies 🇧🇸
          </p>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 flex h-20 items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/images/tropitrack-logo.png"
              alt="TropiTrack"
              width={80}
              height={27}
              className="object-contain"
            />
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-semibold text-gray-700 hover:text-[#2596be] transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-semibold text-gray-700 hover:text-[#2596be] transition-colors">
              Pricing
            </Link>
            <Link href="#why-tropitrack" className="text-sm font-semibold text-gray-700 hover:text-[#2596be] transition-colors">
              Why TropiTrack
            </Link>
            <Link href="#testimonials" className="text-sm font-semibold text-gray-700 hover:text-[#2596be] transition-colors">
              Testimonials
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="hidden md:flex text-gray-700 hover:text-[#2596be] hover:bg-[#2596be]/5 font-semibold">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild className="bg-[#2596be] hover:bg-[#1d7a9a] text-white font-bold shadow-lg shadow-[#2596be]/20 rounded-full px-6">
              <Link href="#pricing">Get Started</Link>
            </Button>
            {/* Mobile Hamburger Menu Button */}
            <Button
              variant="ghost"
              className="md:hidden p-2 text-gray-700 hover:text-[#2596be] hover:bg-[#2596be]/5"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="md:hidden fixed inset-0 top-20 bg-black/20 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Menu Panel */}
            <div className="md:hidden fixed inset-x-0 top-20 bg-white z-50 border-t border-gray-200 shadow-lg">
              <div className="flex flex-col h-[calc(100vh-5rem)]">
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                  <Link
                    href="#features"
                    className="block px-4 py-3 text-base font-semibold text-gray-700 hover:text-[#2596be] hover:bg-[#2596be]/5 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Features
                  </Link>
                  <Link
                    href="#pricing"
                    className="block px-4 py-3 text-base font-semibold text-gray-700 hover:text-[#2596be] hover:bg-[#2596be]/5 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link
                    href="#why-tropitrack"
                    className="block px-4 py-3 text-base font-semibold text-gray-700 hover:text-[#2596be] hover:bg-[#2596be]/5 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Why TropiTrack
                  </Link>
                  <Link
                    href="#testimonials"
                    className="block px-4 py-3 text-base font-semibold text-gray-700 hover:text-[#2596be] hover:bg-[#2596be]/5 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Testimonials
                  </Link>
                </nav>
                
                {/* Login Button at Bottom */}
                <div className="px-4 py-6 border-t border-gray-200 bg-gray-50">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full text-gray-700 hover:text-[#2596be] hover:border-[#2596be] font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/login">Log In</Link>
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section - Toggl Style */}
        <section className="relative py-20 md:py-28 lg:py-32 bg-gradient-to-br from-white via-[#2596be]/5 to-white overflow-hidden">
          {/* Subtle decorative elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-br from-[#2596be]/5 to-transparent rounded-bl-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#2596be]/5 rounded-full blur-3xl -z-0"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
              {/* Left Column - Content */}
              <div className="text-center lg:text-left">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#041014] mb-6 leading-tight tracking-tight">
                  Track time.<br />
                  Run payroll.<br />
                  <span className="text-[#2596be]">Build better.</span>
                </h1>
                
                <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Time tracking and payroll software built for Bahamian construction teams. Simple, accurate, and made for the field.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button size="lg" className="bg-[#2596be] hover:bg-[#1d7a9a] text-white text-base px-10 py-7 h-auto font-bold shadow-xl shadow-[#2596be]/20 hover:shadow-2xl hover:shadow-[#2596be]/30 rounded-full transition-all" asChild>
                    <Link href="#pricing">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="text-base px-10 py-7 h-auto font-bold border-2 border-gray-300 text-gray-700 hover:border-[#2596be] hover:text-[#2596be] hover:bg-[#2596be]/5 rounded-full transition-all" asChild>
                    <Link href="#features">
                      Learn More
                    </Link>
                  </Button>
                </div>
                
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-sm text-gray-500 mt-8">
                  <div className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-[#2596be]" />
                    Simple pricing
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-[#2596be]" />
                    Built in 🇧🇸
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-[#2596be]" />
                    NIB compliant
                  </div>
                </div>
              </div>
              
              {/* Right Column - Dashboard Preview */}
              <div className="relative">
                <div className="relative rounded-2xl shadow-2xl overflow-hidden border border-gray-200 bg-white">
                  <Image
                    src="/images/Dashboard.png"
                    alt="TropiTrack Dashboard"
                    width={1200}
                    height={675}
                    className="w-full h-auto"
                    priority
                  />
                </div>
                {/* Floating accent */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#2596be]/10 rounded-full blur-2xl -z-10"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section id="features" className="py-20 md:py-28 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#041014] mb-5 tracking-tight">
                Everything you need to track time and run payroll
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Simple, powerful tools built for Bahamian construction teams
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Card 1 */}
              <div className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#2596be]/30 group">
                <div className="mb-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2596be] to-[#1d7a9a] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#041014] mb-3">No more paper timesheets</h3>
                <p className="text-gray-600 leading-relaxed">
                  Workers clock in from their phone. Hours are tracked automatically. Everything syncs in real-time.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#145369]/30 group">
                <div className="mb-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#145369] to-[#0d3a4a] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ClipboardCheck className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#041014] mb-3">Accurate hours, faster payroll</h3>
                <p className="text-gray-600 leading-relaxed">
                  GPS verification means no time theft. Overtime and NIB calculations happen automatically.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#2596be]/30 group">
                <div className="mb-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2596be] to-[#1d7a9a] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Smartphone className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#041014] mb-3">Works on any device</h3>
                <p className="text-gray-600 leading-relaxed">
                  Mobile-optimized web app. Works offline. Simple enough that anyone can use it.
                </p>
              </div>

              {/* Card 4 */}
              <div className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#145369]/30 group">
                <div className="mb-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#145369] to-[#0d3a4a] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#041014] mb-3">Know who&apos;s where, always</h3>
                <p className="text-gray-600 leading-relaxed">
                  See which workers are on which job sites. Track project hours separately.
                </p>
              </div>

              {/* Card 5 */}
              <div className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#2596be]/30 group">
                <div className="mb-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2596be] to-[#1d7a9a] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#041014] mb-3">Built for Bahamian businesses</h3>
                <p className="text-gray-600 leading-relaxed">
                  NIB deductions done right. Holiday pay calculations. Local support in your timezone.
                </p>
              </div>

              {/* Card 6 */}
              <div className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#145369]/30 group">
                <div className="mb-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#145369] to-[#0d3a4a] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#041014] mb-3">Your crew will actually use it</h3>
                <p className="text-gray-600 leading-relaxed">
                  Clean interface. Fast loading. No confusing features. Just what you need.
                </p>
              </div>
            </div>
          </div>
        </section>



        {/* Why TropiTrack Section */}
        <section id="why-tropitrack" className="py-20 md:py-28 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#041014] mb-5 tracking-tight">
                Built for Bahamian construction teams
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Local support, NIB compliance, and features that work the way you actually work
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="text-center p-8 bg-gradient-to-br from-[#2596be]/5 to-white rounded-3xl hover:shadow-lg transition-all duration-300">
                <div className="mb-4 text-5xl font-extrabold text-[#2596be]">100%</div>
                <h3 className="text-lg font-bold text-[#041014] mb-2">Local Support</h3>
                <p className="text-gray-600 text-sm">
                  Based in the Bahamas. We answer calls in your timezone.
                </p>
              </div>

              <div className="text-center p-8 bg-gradient-to-br from-[#145369]/5 to-white rounded-3xl hover:shadow-lg transition-all duration-300">
                <div className="mb-4 text-5xl font-extrabold text-[#145369]">10min</div>
                <h3 className="text-lg font-bold text-[#041014] mb-2">Setup Time</h3>
                <p className="text-gray-600 text-sm">
                  From signup to first clock-in. Start tracking time today.
                </p>
              </div>

              <div className="text-center p-8 bg-gradient-to-br from-[#2596be]/5 to-white rounded-3xl hover:shadow-lg transition-all duration-300">
                <div className="mb-4 text-5xl font-extrabold text-[#2596be]">24/7</div>
                <h3 className="text-lg font-bold text-[#041014] mb-2">Always Available</h3>
                <p className="text-gray-600 text-sm">
                  Your workers can clock in anytime, anywhere.
                </p>
              </div>

              <div className="text-center p-8 bg-gradient-to-br from-[#145369]/5 to-white rounded-3xl hover:shadow-lg transition-all duration-300">
                <div className="mb-4 text-5xl font-extrabold text-[#145369]">$49</div>
                <h3 className="text-lg font-bold text-[#041014] mb-2">Starting Price</h3>
                <p className="text-gray-600 text-sm">
                  Simple, transparent pricing for Bahamian construction companies.
                </p>
              </div>

              <div className="text-center p-8 bg-gradient-to-br from-[#2596be]/5 to-white rounded-3xl hover:shadow-lg transition-all duration-300">
                <div className="mb-4 text-5xl font-extrabold text-[#2596be]">NIB</div>
                <h3 className="text-lg font-bold text-[#041014] mb-2">Compliant Payroll</h3>
                <p className="text-gray-600 text-sm">
                  Automatic NIB calculations that match Bahamian law.
                </p>
              </div>

              <div className="text-center p-8 bg-gradient-to-br from-[#145369]/5 to-white rounded-3xl hover:shadow-lg transition-all duration-300">
                <div className="mb-4 text-5xl font-extrabold text-[#145369]">GPS</div>
                <h3 className="text-lg font-bold text-[#041014] mb-2">Verified Hours</h3>
                <p className="text-gray-600 text-sm">
                  GPS tracking ensures workers are on-site.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 md:py-28 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#041014] mb-5 tracking-tight">
                Simple, transparent pricing
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Choose the plan that fits your team size. All plans include everything you need to track time and run payroll.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Starter Plan */}
              <div className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-[#2596be]/30">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-[#041014] mb-2">Starter</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl font-extrabold text-[#041014]">$49</span>
                    <span className="text-gray-600 font-medium">/month</span>
                  </div>
                  <p className="text-gray-600 text-sm">Perfect for small crews</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#2596be] mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Up to 10 workers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#2596be] mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Time tracking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#2596be] mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Supervisor approvals</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#2596be] mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Basic payroll export</span>
                  </li>
                </ul>

                <Button 
                  className="w-full bg-[#2596be] hover:bg-[#1d7a9a] text-white font-bold rounded-full py-6" 
                  asChild
                >
                  <Link href="/signup?plan=starter">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Growth Plan - Popular */}
              <div className="bg-gradient-to-br from-[#2596be] to-[#1d7a9a] p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-[#2596be] relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-white text-[#2596be] text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                    MOST POPULAR
                  </span>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Growth</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl font-extrabold text-white">$79</span>
                    <span className="text-white/90 font-medium">/month</span>
                  </div>
                  <p className="text-white/90 text-sm">For growing companies</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                    <span className="text-white">Up to 25 workers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                    <span className="text-white">Everything in Starter</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                    <span className="text-white">Weekly payroll summaries</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                    <span className="text-white">Basic reports</span>
                  </li>
                </ul>

                <Button 
                  className="w-full bg-white hover:bg-gray-50 text-[#2596be] font-bold rounded-full py-6" 
                  asChild
                >
                  <Link href="/signup?plan=growth">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Pro Plan */}
              <div className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-[#145369]/30">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-[#041014] mb-2">Pro</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl font-extrabold text-[#041014]">$119</span>
                    <span className="text-gray-600 font-medium">/month</span>
                  </div>
                  <p className="text-gray-600 text-sm">For established teams</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#145369] mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Up to 50 workers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#145369] mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Everything in Growth</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#145369] mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Priority support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#145369] mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Assisted setup</span>
                  </li>
                </ul>

                <Button 
                  className="w-full bg-[#145369] hover:bg-[#0d3a4a] text-white font-bold rounded-full py-6" 
                  asChild
                >
                  <Link href="/signup?plan=pro">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-600 text-sm">
                All plans include NIB compliance, GPS verification, and mobile access. No hidden fees.
              </p>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 md:py-28 bg-gradient-to-br from-gray-50 via-[#2596be]/5 to-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#041014] mb-5 tracking-tight">
                Founding Customers in Progress
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                We&apos;re currently onboarding Bahamian construction companies. Your team could be one of the first.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto mb-12">
              {/* Card 1 - Active Onboarding */}
              <Card className="bg-white border border-gray-200 shadow-xl hover:shadow-2xl hover:border-[#2596be]/40 transition-all duration-300 rounded-3xl group">
                <CardContent className="p-8">
                  {/* Status Badge */}
                  <div className="flex items-center justify-end mb-6">
                    <span className="text-xs font-bold text-[#2596be] bg-[#2596be]/10 px-4 py-2 rounded-full">
                      ● Onboarding
                    </span>
                  </div>
                  
                  {/* Icon */}
                  <div className="mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#2596be] to-[#1d7a9a] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <p className="text-gray-600 mb-6 leading-relaxed text-base">
                    Testing time tracking and GPS verification across multiple job sites in Nassau.
                  </p>
                  
                  {/* Company Info */}
                  <div className="pt-4 border-t border-gray-200">
                    <p className="font-bold text-[#041014] mb-1">Commercial Construction</p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <MapPin className="h-3 w-3 mr-1.5 text-[#2596be]" />
                      Nassau, New Providence
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2 - In Progress */}
              <Card className="bg-white border border-gray-200 shadow-xl hover:shadow-2xl hover:border-[#145369]/40 transition-all duration-300 rounded-3xl group">
                <CardContent className="p-8">
                  {/* Status Badge */}
                  <div className="flex items-center justify-end mb-6">
                    <span className="text-xs font-bold text-[#145369] bg-[#145369]/10 px-4 py-2 rounded-full">
                      ● In Progress
                    </span>
                  </div>
                  
                  {/* Icon */}
                  <div className="mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#145369] to-[#0d3a4a] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <p className="text-gray-600 mb-6 leading-relaxed text-base">
                    Implementing payroll automation and NIB calculations for 20+ crew members.
                  </p>
                  
                  {/* Company Info */}
                  <div className="pt-4 border-t border-gray-200">
                    <p className="font-bold text-[#041014] mb-1">Residential Builder</p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <MapPin className="h-3 w-3 mr-1.5 text-[#145369]" />
                      Eleuthera
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3 - Open Slot */}
              <Card className="bg-gradient-to-br from-[#2596be]/5 to-white border border-[#2596be]/30 shadow-xl hover:shadow-2xl hover:border-[#2596be]/60 transition-all duration-300 rounded-3xl group relative overflow-hidden">
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#2596be]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <CardContent className="p-8 relative z-10">
                  {/* Status Badge */}
                  <div className="flex items-center justify-end mb-6">
                    <span className="text-xs font-bold text-gray-600 bg-gray-200 px-4 py-2 rounded-full">
                      Open Slot
                    </span>
                  </div>
                  
                  {/* Icon */}
                  <div className="mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#2596be]/20 to-[#2596be]/10 flex items-center justify-center border-2 border-dashed border-[#2596be]/30 group-hover:scale-110 group-hover:border-solid transition-all">
                      <Users className="h-8 w-8 text-[#2596be]" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <p className="text-gray-600 mb-6 leading-relaxed text-base">
                    Your construction company could be here. Get early access and help shape the product.
                  </p>
                  
                  {/* Company Info - Placeholder */}
                  <div className="pt-4 border-t border-dashed border-gray-300">
                    <p className="font-bold text-[#041014] mb-1">Your Company</p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <MapPin className="h-3 w-3 mr-1.5 text-[#2596be]" />
                      Anywhere in the Bahamas
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Button size="lg" className="bg-[#2596be] hover:bg-[#1d7a9a] text-white px-10 py-7 h-auto font-bold shadow-xl shadow-[#2596be]/20 hover:shadow-2xl hover:shadow-[#2596be]/30 rounded-full transition-all" asChild>
                <Link href="#demo">
                  Become a Founding Customer
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Lead Capture Section */}
        <section id="demo" className="py-20 md:py-28 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid gap-12 lg:grid-cols-2 items-center">
                <div>
                  <h2 className="text-4xl md:text-5xl font-extrabold text-[#041014] mb-6 tracking-tight">
                    Ready to get started?
                  </h2>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Join Bahamian construction companies using TropiTrack. Simple pricing starting at $49/month.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-[#2596be] mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-[#041014]">Simple, transparent pricing</h4>
                        <p className="text-gray-600 text-sm">Choose the plan that fits your team size</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-[#145369] mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-[#041014]">Set up in 10 minutes</h4>
                        <p className="text-gray-600 text-sm">From signup to first clock-in—faster than you think</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-[#2596be] mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-[#041014]">Local support</h4>
                        <p className="text-gray-600 text-sm">Based in the Bahamas, here when you need us</p>
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
        <section className="py-20 md:py-28 bg-gradient-to-br from-[#2596be] to-[#145369] relative overflow-hidden">
          {/* Wave backgrounds - layered for depth with smooth flow */}
          <div className="absolute inset-0">
            {/* Wave layer 1 - bottom (largest wave) */}
            <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ animation: 'wave-flow-1 20s ease-in-out infinite', transformOrigin: 'center bottom' }}>
              <path d="M0,100 C360,220 480,80 720,150 C960,220 1200,100 1440,180 L1440,600 L0,600 Z" fill="rgba(20, 83, 105, 0.4)" />
            </svg>
            
            {/* Wave layer 2 - middle */}
            <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ animation: 'wave-flow-2 16s ease-in-out infinite', animationDelay: '0.5s', transformOrigin: 'center bottom' }}>
              <path d="M0,200 C400,300 560,180 840,250 C1120,320 1300,220 1440,280 L1440,600 L0,600 Z" fill="rgba(37, 150, 190, 0.3)" />
            </svg>
            
            {/* Wave layer 3 - top */}
            <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ animation: 'wave-flow-3 14s ease-in-out infinite', animationDelay: '1s', transformOrigin: 'center bottom' }}>
              <path d="M0,320 C440,420 640,300 920,380 C1200,460 1360,360 1440,420 L1440,600 L0,600 Z" fill="rgba(255, 255, 255, 0.08)" />
            </svg>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
                Start tracking time the right way
              </h2>
              <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
                Join Bahamian construction companies using TropiTrack. Simple pricing starting at $49/month. Get started in 10 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white hover:bg-gray-50 text-[#2596be] text-base px-10 py-7 h-auto font-bold shadow-xl hover:shadow-2xl rounded-full transition-all" asChild>
                  <Link href="#pricing">
                    View Pricing
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-base px-10 py-7 h-auto font-bold border-2 border-white text-white hover:bg-white/10 rounded-full transition-all" asChild>
                  <Link href="https://calendly.com/lamar-tropitech/10min" target="_blank">
                    Book Onboarding
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">
                  <span className="font-extrabold text-[#2596be]">Tropi</span>
                  <span className="font-medium text-[#145369]">Track</span>
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-6 max-w-sm leading-relaxed">
                Time tracking and payroll management built for Bahamian construction crews. 
                Simple, powerful, and made for the field.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-[#041014] mb-4 text-sm">Product</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#features" className="text-sm text-gray-600 hover:text-[#2596be] transition-colors font-medium">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#demo" className="text-sm text-gray-600 hover:text-[#2596be] transition-colors font-medium">
                    Try Demo
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-sm text-gray-600 hover:text-[#2596be] transition-colors font-medium">
                    Log In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-[#041014] mb-4 text-sm">Company</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#why-tropitrack" className="text-sm text-gray-600 hover:text-[#2596be] transition-colors font-medium">
                    Why TropiTrack
                  </Link>
                </li>
                <li>
                  <Link href="#testimonials" className="text-sm text-gray-600 hover:text-[#2596be] transition-colors font-medium">
                    Testimonials
                  </Link>
                </li>
                <li>
                  <a href="mailto:lamar@tropitech.org" className="text-sm text-gray-600 hover:text-[#2596be] transition-colors font-medium">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-[#041014] mb-4 text-sm">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-sm text-gray-600 hover:text-[#2596be] transition-colors font-medium">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-gray-600 hover:text-[#2596be] transition-colors font-medium">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 font-medium">
              © {new Date().getFullYear()} TropiTrack. Powered by TropiTech Solutions. Built in the Bahamas 🇧🇸
            </p>
            <div className="flex items-center gap-4">
              <a href="mailto:lamar@tropitech.org" className="text-sm text-gray-600 hover:text-[#2596be] transition-colors font-medium">
                lamar@tropitech.org
              </a>
              <span className="text-gray-300">•</span>
              <a href="tel:+13349130982" className="text-sm text-gray-600 hover:text-[#2596be] transition-colors font-medium">
                +1 (334) 913-0982
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
