"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FaqAccordion } from "@/components/faq-accordion"
import { NewsletterForm } from "@/components/newsletter-form"
import { Clock, CreditCard, Users, Smartphone, CheckCircle, ArrowRight, Star, Building2, Zap, Shield, Globe } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">TropiTrack</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium transition-colors hover:text-primary">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium transition-colors hover:text-primary">
              Pricing
            </Link>
            <Link href="#faq" className="text-sm font-medium transition-colors hover:text-primary">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="hidden md:flex">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/signup?plan=starter">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 md:py-32 lg:py-40 bg-gradient-to-br from-black via-gray-900 to-black">
          {/* Gradient overlay with Bahamas colors */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-transparent to-black/60"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/20 via-transparent to-cyan-400/20"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-cyan-300/10 via-transparent to-yellow-300/10"></div>
          
          {/* Animated gradient orbs */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-yellow-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-l from-cyan-400/20 to-yellow-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-yellow-300/15 to-cyan-300/15 rounded-full blur-3xl animate-pulse delay-500"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center rounded-full border border-yellow-400/30 bg-black/50 backdrop-blur-sm px-4 py-2 text-sm mb-8">
                <span className="mr-2 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 h-2 w-2"></span>
                <span className="text-yellow-100">Built for construction companies in the Bahamas</span>
              </div>
              
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl mb-8">
                <span className="bg-gradient-to-r from-white via-yellow-100 to-cyan-100 bg-clip-text text-transparent">
                  Construction Time Tracking
                </span>
                <span className="block bg-gradient-to-r from-yellow-400 via-yellow-300 to-cyan-400 bg-clip-text text-transparent">
                  Made Simple
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                Stop losing money on manual timesheets. Track time, manage payroll, and run your construction business 
                with confidence using our all-in-one platform.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button size="lg" className="group bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black text-lg px-8 py-6 h-auto font-semibold shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                  <Link href="/signup">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-yellow-400/50 text-black hover:bg-yellow-400/10 hover:border-yellow-400 transition-all duration-300">
                  Watch Demo
                </Button>
              </div>
              
              <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-yellow-400" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-yellow-400" />
                  2 weeks free trial
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-yellow-400" />
                  Cancel anytime
                </div>
              </div>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="mt-16 max-w-6xl mx-auto px-4 relative z-10">
            <div className="relative rounded-2xl border border-yellow-400/30 bg-black/50 backdrop-blur-sm p-2 shadow-2xl">
              <Image
                src="/images/Dashboard.png"
                alt="TropiTrack Dashboard Preview"
                width={1200}
                height={600}
                className="rounded-xl shadow-lg"
              />
              <div className="absolute -top-4 -right-4 h-32 w-32 rounded-full bg-gradient-to-r from-yellow-400/30 to-cyan-400/30 blur-3xl"></div>
              <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-gradient-to-r from-cyan-400/30 to-yellow-400/30 blur-3xl"></div>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
                      <p className="text-lg text-muted-foreground mb-4">Designed specifically for construction companies in the Bahamas</p>
        <div className="flex items-center justify-center gap-8 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="flex text-primary">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <span className="font-medium">Built with local expertise</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
                Why construction companies choose TropiTrack
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Built specifically for the unique needs of construction teams in the Bahamas
              </p>
            </div>

            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
              <div className="text-center">
                <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Save 10+ Hours Weekly</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Automate time tracking and payroll processing. No more manual calculations or chasing down timesheets.
                </p>
              </div>

              <div className="text-center">
                <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Bahamas Compliant</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Built-in NIB calculations, overtime rules, and local tax requirements. Stay compliant without the headache.
                </p>
              </div>

              <div className="text-center">
                <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Works Offline</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Perfect for remote job sites. Workers can clock in/out without internet and sync when back online.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
                Everything you need to run your construction business
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Powerful features designed to streamline your operations and boost productivity
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="mb-6 rounded-full bg-primary/10 p-4 w-fit">
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Smart Time Tracking</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    GPS-verified clock in/out, project assignment, and automatic overtime calculations. 
                    Workers can use any device - mobile or desktop.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="mb-6 rounded-full bg-primary/10 p-4 w-fit">
                    <CreditCard className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Automated Payroll</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Calculate regular pay, overtime, holiday pay, and NIB deductions automatically. 
                    Export payroll data ready for your accounting system.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="mb-6 rounded-full bg-primary/10 p-4 w-fit">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Worker Management</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Track skills, certifications, availability, and performance. 
                    Assign workers to projects and manage their schedules efficiently.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="mb-6 rounded-full bg-primary/10 p-4 w-fit">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Project Tracking</h3>
                  <p className="text-gray-500 text-lg leading-relaxed">
                    Monitor project progress, track costs, and generate reports. 
                    Keep your projects on time and within budget.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="mb-6 rounded-full bg-primary/10 p-4 w-fit">
                    <Smartphone className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Mobile First</h3>
                  <p className="text-gray-500 text-lg leading-relaxed">
                    Works perfectly on phones, tablets, and computers. 
                    Offline capability ensures work never stops, even without internet.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="mb-6 rounded-full bg-primary/10 p-4 w-fit">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Secure & Reliable</h3>
                  <p className="text-gray-500 text-lg leading-relaxed">
                    Enterprise-grade security with automatic backups. 
                    Your data is safe, secure, and always accessible.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>


        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">Simple, transparent pricing</h2>
              <p className="text-xl text-gray-500 max-w-3xl mx-auto">
                Choose the plan that works best for your construction business. All plans include our 2-week free trial.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
              <Card className="bg-card border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">Starter</h3>
                    <p className="text-gray-500 mb-4">Perfect for small crews</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">$39</span>
                      <span className="text-gray-500">/month</span>
                    </div>
                  </div>
                  <ul className="mb-8 space-y-4">
                    <li className="flex items-start">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Up to 15 workers</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>5 active projects</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Time tracking & approvals</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Basic payroll reports</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Mobile app access</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Email support</span>
                    </li>
                  </ul>
                  <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                    <Link href="/signup?plan=starter">Start Free Trial</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-2 border-primary shadow-xl relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
                <CardContent className="p-8">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">Professional</h3>
                    <p className="text-gray-500 mb-4">For growing companies</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">$89</span>
                      <span className="text-gray-500">/month</span>
                    </div>
                  </div>
                  <ul className="mb-8 space-y-4">
                    <li className="flex items-start">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Up to 50 workers</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Unlimited projects</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Advanced payroll features</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Project cost tracking</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Document management</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Priority support</span>
                    </li>
                  </ul>
                  <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                    <Link href="/signup?plan=professional">Start Free Trial</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                    <p className="text-gray-500 mb-4">For large operations</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">$179</span>
                      <span className="text-gray-500">/month</span>
                    </div>
                  </div>
                  <ul className="mb-8 space-y-4">
                    <li className="flex items-start">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Unlimited workers</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Multi-company access</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Advanced analytics</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Equipment tracking</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>API access</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Dedicated support</span>
                    </li>
                  </ul>
                  <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                    <Link href="/signup?plan=enterprise">Start Free Trial</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">Frequently asked questions</h2>
              <p className="text-xl text-gray-500 max-w-3xl mx-auto">
                Everything you need to know about TropiTrack
              </p>
            </div>

            <div className="mx-auto max-w-4xl">
              <FaqAccordion />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
          {/* Gradient overlay with Bahamas colors */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-transparent to-black/60"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/15 via-transparent to-cyan-400/15"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-cyan-300/10 via-transparent to-yellow-300/10"></div>
          
          {/* Animated gradient orbs */}
          <div className="absolute top-10 left-20 w-64 h-64 bg-gradient-to-r from-yellow-400/25 to-cyan-400/25 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-20 w-80 h-80 bg-gradient-to-l from-cyan-400/20 to-yellow-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
                <span className="bg-gradient-to-r from-white via-yellow-100 to-cyan-100 bg-clip-text text-transparent">
                  Ready to transform your construction business?
                </span>
              </h2>
              <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
                Join hundreds of construction companies already using TropiTrack to save time, reduce errors, and grow their business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button size="lg" className="group bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black text-lg px-8 py-6 h-auto font-semibold shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                  <Link href="/signup">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-yellow-400/50 text-black hover:bg-yellow-400/10 hover:border-yellow-400 transition-all duration-300">
                  Schedule a Demo
                </Button>
              </div>
              <p className="text-sm text-gray-400">
                No credit card required • 2 weeks free trial • Cancel anytime
              </p>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-4xl font-bold tracking-tight mb-6">Stay updated with TropiTrack</h2>
              <p className="text-xl text-gray-500 mb-8">
                Get the latest features, construction tips, and industry insights delivered to your inbox.
              </p>
              <div className="flex justify-center">
                <NewsletterForm />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-16">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl font-bold tracking-tight">TropiTrack</span>
              </div>
              <p className="text-gray-500 mb-6">
                Modern time tracking and payroll management for construction companies in the Bahamas.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                  <span className="sr-only">Facebook</span>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                  </svg>
                  <span className="sr-only">Instagram</span>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                  <span className="sr-only">Twitter</span>
                </Button>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-6">Product</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-6">Company</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Support
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-6">Contact</h3>
              <ul className="space-y-3">
                <li>
                  <p className="text-muted-foreground">
                    Email: <a href="mailto:lamar@tropitech.org" className="hover:text-foreground transition-colors">lamar@tropitech.org</a>
                  </p>
                </li>
                <li>
                  <p className="text-muted-foreground">
                    Phone: <a href="tel:+13349130982" className="hover:text-foreground transition-colors">+1 (334) 913-0982</a>
                  </p>
                </li>
                <li>
                  <p className="text-muted-foreground">Address: Eleuthera, Bahamas</p>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} TropiTrack. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
